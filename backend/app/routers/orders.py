from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Order, OrderItem, OrderStatus, Product, User, UserRole
from app.schemas.schemas import OrderCreate, OrderOut, OrderStatusUpdate
from app.core.dependencies import get_current_user, get_admin_user
from app.services.allocation import allocate_branch, deduct_stock, restore_stock

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate products exist
    items_data = []
    total_amount = 0.0

    for item in payload.items:
        product = db.query(Product).filter(
            Product.id == item.product_id,
            Product.is_active == True
        ).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} not found"
            )
        items_data.append({
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": product.price,
            "product": product,
        })
        total_amount += product.price * item.quantity

    # Run allocation algorithm
    allocation_items = [
        {"product_id": i["product_id"], "quantity": i["quantity"]}
        for i in items_data
    ]

    customer_lat = payload.customer_lat or current_user.latitude
    customer_lng = payload.customer_lng or current_user.longitude

    best_branch, score = allocate_branch(
        db=db,
        items=allocation_items,
        customer_lat=customer_lat,
        customer_lng=customer_lng,
    )

    # Create order
    order = Order(
        customer_id=current_user.id,
        branch_id=best_branch.id if best_branch else None,
        status=OrderStatus.allocated if best_branch else OrderStatus.pending,
        customer_note=payload.customer_note,
        total_amount=total_amount,
        customer_lat=customer_lat,
        customer_lng=customer_lng,
        customer_address=payload.customer_address or current_user.address,
        allocation_score=score,
    )
    db.add(order)
    db.flush()

    # Add order items
    for item in items_data:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item["product_id"],
            quantity=item["quantity"],
            unit_price=item["unit_price"],
        )
        db.add(order_item)

    # Deduct stock if allocated
    if best_branch:
        deduct_stock(db, best_branch.id, allocation_items)

    db.commit()
    db.refresh(order)

    # Build response manually to include product names
    order_out = OrderOut(
        id=order.id,
        status=order.status,
        customer_note=order.customer_note,
        note_category=order.note_category,
        note_confidence=order.note_confidence,
        total_amount=order.total_amount,
        customer_address=order.customer_address,
        allocation_score=order.allocation_score,
        branch=order.branch,
        items=[
            {
                "product_id": i["product_id"],
                "product_name": i["product"].name,
                "quantity": i["quantity"],
                "unit_price": i["unit_price"],
            }
            for i in items_data
        ],
        created_at=order.created_at,
        updated_at=order.updated_at,
    )
    return order_out


@router.get("/", response_model=List[OrderOut])
def get_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.admin:
        orders = db.query(Order).order_by(Order.created_at.desc()).all()
    else:
        orders = db.query(Order).filter(
            Order.customer_id == current_user.id
        ).order_by(Order.created_at.desc()).all()

    result = []
    for order in orders:
        result.append(OrderOut(
            id=order.id,
            status=order.status,
            customer_note=order.customer_note,
            note_category=order.note_category,
            note_confidence=order.note_confidence,
            total_amount=order.total_amount,
            customer_address=order.customer_address,
            allocation_score=order.allocation_score,
            branch=order.branch,
            items=[
                {
                    "product_id": item.product_id,
                    "product_name": item.product.name,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                }
                for item in order.items
            ],
            created_at=order.created_at,
            updated_at=order.updated_at,
        ))
    return result


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if current_user.role != UserRole.admin and order.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this order"
        )

    return OrderOut(
        id=order.id,
        status=order.status,
        customer_note=order.customer_note,
        note_category=order.note_category,
        note_confidence=order.note_confidence,
        total_amount=order.total_amount,
        customer_address=order.customer_address,
        allocation_score=order.allocation_score,
        branch=order.branch,
        items=[
            {
                "product_id": item.product_id,
                "product_name": item.product.name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
            }
            for item in order.items
        ],
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


@router.patch("/{order_id}/cancel", response_model=OrderOut)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if current_user.role != UserRole.admin and order.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    if order.status in [OrderStatus.delivered, OrderStatus.cancelled]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel an order with status: {order.status}"
        )

    # Restore stock if was allocated
    if order.branch_id and order.status != OrderStatus.pending:
        restore_stock(
            db,
            order.branch_id,
            [{"product_id": item.product_id, "quantity": item.quantity} for item in order.items]
        )

    order.status = OrderStatus.cancelled
    db.commit()
    db.refresh(order)

    return OrderOut(
        id=order.id,
        status=order.status,
        customer_note=order.customer_note,
        note_category=order.note_category,
        note_confidence=order.note_confidence,
        total_amount=order.total_amount,
        customer_address=order.customer_address,
        allocation_score=order.allocation_score,
        branch=order.branch,
        items=[
            {
                "product_id": item.product_id,
                "product_name": item.product.name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
            }
            for item in order.items
        ],
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_admin_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    order.status = payload.status
    db.commit()
    db.refresh(order)

    return OrderOut(
        id=order.id,
        status=order.status,
        customer_note=order.customer_note,
        note_category=order.note_category,
        note_confidence=order.note_confidence,
        total_amount=order.total_amount,
        customer_address=order.customer_address,
        allocation_score=order.allocation_score,
        branch=order.branch,
        items=[
            {
                "product_id": item.product_id,
                "product_name": item.product.name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
            }
            for item in order.items
        ],
        created_at=order.created_at,
        updated_at=order.updated_at,
    )