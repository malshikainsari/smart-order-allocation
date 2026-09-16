# Smart Order Allocation System

A full-stack application that automatically allocates customer orders to the most suitable branch based on stock availability, location proximity, and branch workload.

---

## Technologies Used

### Backend
- **Python** with **FastAPI** — REST API framework
- **PostgreSQL** — Relational database
- **SQLAlchemy** — ORM for database interactions
- **passlib (bcrypt)** — Password hashing
- **python-jose** — JWT token generation and validation
- **slowapi** — Rate limiting
- **scikit-learn** — ML model (TF-IDF + Logistic Regression)
- **python-decouple** — Environment variable management

### Frontend
- **Next.js 14** (App Router) with **TypeScript**
- **Tailwind CSS** — Styling
- **Axios** — API communication
- **React Hook Form + Zod** — Form validation

### Database
- **PostgreSQL** with the following tables:
  - `users` — Customer and admin accounts
  - `branches` — Branch locations and status
  - `products` — Product catalog
  - `branch_stock` — Stock levels per branch
  - `orders` — Customer orders
  - `order_items` — Individual items per order

---

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` folder:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/smart_order_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ENVIRONMENT=development
```

Train the ML model:
```bash
python -m ml.train
```

Seed the database with sample data:
```bash
python -m app.seed
```

Start the backend server:
```bash
uvicorn app.main:app --reload
```

API available at: `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend available at: `http://localhost:3000`

### Default Admin Credentials
- Email: `admin@smartorder.com`
- Password: `admin123`

---

## System Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌────────────────┐
│   Next.js       │  HTTP   │   FastAPI         │  ORM    │  PostgreSQL    │
│   Frontend      │ ──────► │   Backend         │ ──────► │  Database      │
│   (Port 3000)   │         │   (Port 8000)     │         │  (Port 5432)   │
└─────────────────┘         └──────────────────┘         └────────────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │   ML Service      │
                             │  (scikit-learn)   │
                             │  TF-IDF + LR      │
                             └──────────────────┘
```

---

## Branch Allocation Logic

When a customer places an order, the system runs the following algorithm:

### Step 1 — Stock Filter
Only branches that have **all ordered items in sufficient quantity** are considered eligible. If no branch has full stock, the order is set to `pending` status.

### Step 2 — Scoring
Each eligible branch is scored using a weighted formula:

```
Total Score = (stock_score × 0.50) + (distance_score × 0.30) + (workload_score × 0.20)
```

| Factor | Weight | Logic |
|--------|--------|-------|
| **Stock Score** | 50% | How well the branch covers all ordered items |
| **Distance Score** | 30% | Proximity to customer using Haversine formula |
| **Workload Score** | 20% | Fewer active orders = higher score |

If no customer location is provided, weights adjust to stock 50% / workload 50%.

### Step 3 — Selection
The branch with the highest score is selected. In case of a tie, the branch with the lowest active order count wins.

### Why This Approach?
- **Stock availability** is the most critical factor — an order cannot be fulfilled without stock
- **Distance** reduces delivery time and cost
- **Workload balancing** prevents any single branch from being overwhelmed
- The weighted scoring approach is transparent, explainable, and adjustable

### Edge Cases Handled
- No active branches → order stays `pending`
- No branch has full stock → order stays `pending` with clear response
- Customer cancels order → stock is restored to the allocated branch
- No customer location → distance weight redistributed to workload
- Branch deactivated → excluded from future allocations

---

## Authentication & Security

| Measure | Implementation |
|---------|---------------|
| Password hashing | bcrypt via passlib |
| Authentication | JWT access tokens (30 min expiry) + refresh tokens (7 days) |
| Protected routes | Bearer token required on all protected endpoints |
| Role-based access | `customer` and `admin` roles — admin endpoints reject non-admin tokens |
| Input validation | Pydantic schemas on all request bodies |
| Environment secrets | All secrets in `.env` via python-decouple |
| Rate limiting | Login endpoint limited to 5 requests/minute via slowapi |
| CORS | Restricted to frontend origin only |

### Key Security Decision
A customer cannot access admin endpoints even with a valid token — the role is embedded in the JWT payload and verified server-side on every request. Modifying frontend data or calling a protected API directly will not grant elevated access.

---

## AI/ML Approach

### Task
Classify customer order notes and messages into categories automatically.

### Categories
`Payment Issue` | `Delivery Issue` | `Refund/Cancellation` | `Product/Stock Inquiry` | `General Inquiry` | `Account/Login Issue` | `Order Status Inquiry` | `Promotion/Discount Inquiry`

> The dataset contained 8 categories rather than the 5 listed in the brief, so all 8 were used for training to improve real-world coverage.

### Model — TF-IDF + Logistic Regression

- **Dataset:** 450 messages, 8 balanced categories (55 each), 10 unlabeled rows removed
- **Vectorizer:** TF-IDF with bigrams (1,2), max 5000 features, English stopwords removed
- **Classifier:** Logistic Regression, max 1000 iterations
- **Train/test split:** 80/20 with stratification
- **Accuracy: 96.51%**

### Why This Approach?
- Simple, fast, and interpretable — suitable for a small balanced dataset
- No GPU or heavy infrastructure required
- TF-IDF captures word importance effectively for short customer messages
- Logistic Regression provides probability scores needed for confidence thresholding

### Confidence Threshold
If model confidence is **below 60%**, the result is returned as `Unclassified (Low Confidence)` rather than making a potentially wrong classification.

### Integration
Every order note is automatically classified at order creation time. The category and confidence score are stored in the database and displayed in both the customer order view and the admin orders panel.

---

## Assumptions & Limitations

- Customer location coordinates are optional — if not provided, distance scoring is skipped and weight is redistributed to workload
- The ML model is trained on a fixed dataset — retraining requires running `python -m ml.train`
- HTTPS is handled at the deployment/hosting level, not the application level
- The system currently supports a single currency (LKR)
- Branch coordinates are seeded at setup and are not editable via the UI

---

## Live Application

- **Frontend:** https://smart-order-allocation.vercel.app
- **Backend API:** https://smart-order-allocation.onrender.com
- **GitHub:** https://github.com/malshikainsari/smart-order-allocation