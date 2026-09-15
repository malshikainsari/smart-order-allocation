from app.database import SessionLocal, Base, engine
from app.models.models import User, Branch, Product, BranchStock, UserRole
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # Admin user
        if not db.query(User).filter(User.email == "admin@smartorder.com").first():
            admin = User(
                name="Admin",
                email="admin@smartorder.com",
                password_hash=hash_password("admin123"),
                role=UserRole.admin,
                address="Colombo HQ",
                latitude=6.9271,
                longitude=79.8612,
            )
            db.add(admin)

        # Products
        products_data = [
            {"name": "Rice (5kg)", "price": 1500.0, "description": "Premium basmati rice"},
            {"name": "Coconut Oil (1L)", "price": 850.0, "description": "Pure coconut oil"},
            {"name": "Sugar (1kg)", "price": 220.0, "description": "White sugar"},
            {"name": "Flour (1kg)", "price": 180.0, "description": "All purpose flour"},
            {"name": "Milk Powder (400g)", "price": 1200.0, "description": "Full cream milk powder"},
        ]

        products = []
        for p in products_data:
            existing = db.query(Product).filter(Product.name == p["name"]).first()
            if not existing:
                product = Product(**p)
                db.add(product)
                db.flush()
                products.append(product)
            else:
                products.append(existing)

        # Branches
        branches_data = [
            {"name": "Colombo Branch", "address": "Colombo 03", "latitude": 6.9271, "longitude": 79.8612},
            {"name": "Kandy Branch", "address": "Kandy City", "latitude": 7.2906, "longitude": 80.6337},
            {"name": "Galle Branch", "address": "Galle Fort", "latitude": 6.0535, "longitude": 80.2210},
            {"name": "Negombo Branch", "address": "Negombo Town", "latitude": 7.2096, "longitude": 79.8386},
        ]

        branches = []
        for b in branches_data:
            existing = db.query(Branch).filter(Branch.name == b["name"]).first()
            if not existing:
                branch = Branch(**b)
                db.add(branch)
                db.flush()
                branches.append(branch)
            else:
                branches.append(existing)

        # Stock for each branch
        stock_data = [
            # Colombo - full stock
            (0, 0, 50), (0, 1, 30), (0, 2, 100), (0, 3, 80), (0, 4, 40),
            # Kandy - moderate stock
            (1, 0, 20), (1, 1, 15), (1, 2, 60), (1, 3, 40), (1, 4, 25),
            # Galle - low stock
            (2, 0, 10), (2, 1, 5),  (2, 2, 30), (2, 3, 20), (2, 4, 10),
            # Negombo - moderate stock
            (3, 0, 35), (3, 1, 20), (3, 2, 70), (3, 3, 50), (3, 4, 30),
        ]

        for branch_idx, product_idx, qty in stock_data:
            if branch_idx < len(branches) and product_idx < len(products):
                existing = db.query(BranchStock).filter(
                    BranchStock.branch_id == branches[branch_idx].id,
                    BranchStock.product_id == products[product_idx].id,
                ).first()
                if not existing:
                    stock = BranchStock(
                        branch_id=branches[branch_idx].id,
                        product_id=products[product_idx].id,
                        quantity=qty,
                    )
                    db.add(stock)

        db.commit()
        print("✅ Seed data inserted successfully!")
        print("👤 Admin: admin@smartorder.com / admin123")
        print("🏪 Branches: Colombo, Kandy, Galle, Negombo")
        print("📦 Products: 5 products with stock")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()