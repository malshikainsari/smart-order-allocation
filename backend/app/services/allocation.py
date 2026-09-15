import math
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.models import Branch, BranchStock, Order, OrderStatus


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_branch_workload(db: Session, branch_id: int) -> int:
    return (
        db.query(Order)
        .filter(
            Order.branch_id == branch_id,
            Order.status.in_([OrderStatus.allocated, OrderStatus.preparing]),
        )
        .count()
    )


def check_stock_availability(db: Session, branch_id: int, items: List[dict]) -> bool:
    for item in items:
        stock = (
            db.query(BranchStock)
            .filter(
                BranchStock.branch_id == branch_id,
                BranchStock.product_id == item["product_id"],
                BranchStock.quantity >= item["quantity"],
            )
            .first()
        )
        if not stock:
            return False
    return True


def calculate_stock_score(db: Session, branch_id: int, items: List[dict]) -> float:
    total_items = len(items)
    if total_items == 0:
        return 0.0
    covered = 0
    for item in items:
        stock = (
            db.query(BranchStock)
            .filter(
                BranchStock.branch_id == branch_id,
                BranchStock.product_id == item["product_id"],
            )
            .first()
        )
        if stock and stock.quantity >= item["quantity"]:
            covered += 1
    return covered / total_items


def calculate_distance_score(
    customer_lat: float,
    customer_lng: float,
    branch_lat: float,
    branch_lng: float,
    max_distance_km: float = 50.0,
) -> float:
    distance = haversine_distance(customer_lat, customer_lng, branch_lat, branch_lng)
    if distance >= max_distance_km:
        return 0.0
    return 1.0 - (distance / max_distance_km)


def calculate_workload_score(workload: int, max_workload: int = 20) -> float:
    if workload >= max_workload:
        return 0.0
    return 1.0 - (workload / max_workload)


def allocate_branch(
    db: Session,
    items: List[dict],
    customer_lat: Optional[float] = None,
    customer_lng: Optional[float] = None,
) -> Optional[tuple]:
    active_branches = db.query(Branch).filter(Branch.is_active == True).all()

    if not active_branches:
        return None, None

    eligible_branches = [
        branch
        for branch in active_branches
        if check_stock_availability(db, branch.id, items)
    ]

    if not eligible_branches:
        return None, None

    scored_branches = []

    for branch in eligible_branches:
        stock_score = calculate_stock_score(db, branch.id, items)
        workload = get_branch_workload(db, branch.id)
        workload_score = calculate_workload_score(workload)

        if customer_lat is not None and customer_lng is not None:
            distance_score = calculate_distance_score(
                customer_lat, customer_lng, branch.latitude, branch.longitude
            )
            total_score = (
                stock_score * 0.50
                + distance_score * 0.30
                + workload_score * 0.20
            )
        else:
            total_score = stock_score * 0.50 + workload_score * 0.50

        scored_branches.append((branch, total_score, workload))

    if not scored_branches:
        return None, None

    scored_branches.sort(key=lambda x: (-x[1], x[2]))
    best_branch, best_score, _ = scored_branches[0]

    return best_branch, round(best_score, 4)


def deduct_stock(db: Session, branch_id: int, items: List[dict]) -> None:
    for item in items:
        stock = (
            db.query(BranchStock)
            .filter(
                BranchStock.branch_id == branch_id,
                BranchStock.product_id == item["product_id"],
            )
            .first()
        )
        if stock:
            stock.quantity -= item["quantity"]
    db.commit()


def restore_stock(db: Session, branch_id: int, items: List[dict]) -> None:
    for item in items:
        stock = (
            db.query(BranchStock)
            .filter(
                BranchStock.branch_id == branch_id,
                BranchStock.product_id == item["product_id"],
            )
            .first()
        )
        if stock:
            stock.quantity += item["quantity"]
    db.commit()