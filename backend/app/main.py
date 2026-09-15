from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.database import Base, engine
from app.routers import auth, products, branches, orders, admin, ml

# Create all tables
Base.metadata.create_all(bind=engine)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Smart Order Allocation System",
    description="API for intelligent order allocation across branches",
    version="1.0.0",
)

# Rate limit error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(branches.router)
app.include_router(orders.router)
app.include_router(admin.router)
app.include_router(ml.router)


@app.get("/")
def root():
    return {"message": "Smart Order Allocation System API", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}