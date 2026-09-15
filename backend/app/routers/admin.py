from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Order, OrderStatus, Branch, Product, User
from app.schemas.schemas import DashboardStats
from app.core.dependencies import get_admin_user

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(
    db: Session = Depends(get_db),
    admin=Depends(get_admin_user)
):
    total_orders = db.query(Order).count()
    pending_orders = db.query(Order).filter(Order.status == OrderStatus.pending).count()
    allocated_orders = db.query(Order).filter(Order.status == OrderStatus.allocated).count()
    delivered_orders = db.query(Order).filter(Order.status == OrderStatus.delivered).count()
    cancelled_orders = db.query(Order).filter(Order.status == OrderStatus.cancelled).count()
    total_branches = db.query(Branch).count()
    active_branches = db.query(Branch).filter(Branch.is_active == True).count()
    total_products = db.query(Product).filter(Product.is_active == True).count()

    return DashboardStats(
        total_orders=total_orders,
        pending_orders=pending_orders,
        allocated_orders=allocated_orders,
        delivered_orders=delivered_orders,
        cancelled_orders=cancelled_orders,
        total_branches=total_branches,
        active_branches=active_branches,
        total_products=total_products,
    )


@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    admin=Depends(get_admin_user)
):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
        }
        for u in users
    ]


@router.patch("/users/{user_id}/toggle")
def toggle_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}"}