from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Branch, BranchStock, Product
from app.schemas.schemas import BranchCreate, BranchOut, StockUpdate, StockItemOut
from app.core.dependencies import get_admin_user

router = APIRouter(prefix="/branches", tags=["Branches"])


@router.get("/", response_model=List[BranchOut])
def get_branches(db: Session = Depends(get_db)):
    return db.query(Branch).filter(Branch.is_active == True).all()


@router.get("/{branch_id}", response_model=BranchOut)
def get_branch(branch_id: int, db: Session = Depends(get_db)):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found"
        )
    return branch


@router.post("/", response_model=BranchOut, status_code=status.HTTP_201_CREATED)
def create_branch(
    payload: BranchCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_admin_user)
):
    branch = Branch(
        name=payload.name,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return branch


@router.patch("/{branch_id}/toggle", response_model=BranchOut)
def toggle_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_admin_user)
):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found"
        )
    branch.is_active = not branch.is_active
    db.commit()
    db.refresh(branch)
    return branch


@router.get("/{branch_id}/stock", response_model=List[StockItemOut])
def get_branch_stock(branch_id: int, db: Session = Depends(get_db)):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found"
        )
    stock_items = (
        db.query(BranchStock)
        .filter(BranchStock.branch_id == branch_id)
        .all()
    )
    return [
        StockItemOut(
            product_id=item.product_id,
            product_name=item.product.name,
            quantity=item.quantity,
        )
        for item in stock_items
    ]


@router.post("/{branch_id}/stock", status_code=status.HTTP_200_OK)
def update_stock(
    branch_id: int,
    payload: StockUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_admin_user)
):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found"
        )

    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    stock = (
        db.query(BranchStock)
        .filter(
            BranchStock.branch_id == branch_id,
            BranchStock.product_id == payload.product_id,
        )
        .first()
    )

    if stock:
        stock.quantity = payload.quantity
    else:
        stock = BranchStock(
            branch_id=branch_id,
            product_id=payload.product_id,
            quantity=payload.quantity,
        )
        db.add(stock)

    db.commit()
    return {"message": "Stock updated successfully"}