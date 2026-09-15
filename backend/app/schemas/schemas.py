from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from app.models.models import UserRole, OrderStatus


# ─── Auth ────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    address: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Products ────────────────────────────────────────────────────────────────

class ProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    is_active: bool

    model_config = {"from_attributes": True}


# ─── Branches ────────────────────────────────────────────────────────────────

class BranchCreate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float


class BranchOut(BaseModel):
    id: int
    name: str
    address: str
    latitude: float
    longitude: float
    is_active: bool

    model_config = {"from_attributes": True}


class StockUpdate(BaseModel):
    product_id: int
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_non_negative(cls, v):
        if v < 0:
            raise ValueError("Quantity cannot be negative")
        return v


class StockItemOut(BaseModel):
    product_id: int
    product_name: str
    quantity: int

    model_config = {"from_attributes": True}


# ─── Orders ──────────────────────────────────────────────────────────────────

class OrderItemIn(BaseModel):
    product_id: int
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be at least 1")
        return v


class OrderCreate(BaseModel):
    items: List[OrderItemIn]
    customer_note: Optional[str] = None
    customer_address: Optional[str] = None
    customer_lat: Optional[float] = None
    customer_lng: Optional[float] = None

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v):
        if not v:
            raise ValueError("Order must have at least one item")
        return v


class OrderItemOut(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    unit_price: float

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: int
    status: OrderStatus
    customer_note: Optional[str]
    note_category: Optional[str]
    note_confidence: Optional[float]
    total_amount: float
    customer_address: Optional[str]
    allocation_score: Optional[float]
    branch: Optional[BranchOut]
    items: List[OrderItemOut]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


# ─── ML ──────────────────────────────────────────────────────────────────────

class ClassifyRequest(BaseModel):
    message: str


class ClassifyResponse(BaseModel):
    category: str
    confidence: float
    is_confident: bool


# ─── Dashboard ───────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_orders: int
    pending_orders: int
    allocated_orders: int
    delivered_orders: int
    cancelled_orders: int
    total_branches: int
    active_branches: int
    total_products: int