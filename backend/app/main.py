"""
ReturnShield AI — FastAPI Application
"""
import random
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, SessionLocal
import app.models  # registers all models with Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables, seed data, load ML model."""
    # Create all DB tables
    Base.metadata.create_all(bind=engine)

    # Seed demo data if DB is empty
    db = SessionLocal()
    try:
        from app.services.seed_data import seed_db
        seed_db(db)
    except Exception as e:
        print(f"Warning: Seed data failed: {e}")
    finally:
        db.close()

    # Pre-load ML model into cache
    try:
        from app.ml.model_inference import load_model
        artifacts = load_model()
        if artifacts:
            print("[OK] ML model loaded into cache")
        else:
            print("[WARN] ML model not found -- run: cd backend && python data/train_model.py")
    except Exception as e:
        print(f"[WARN] ML model load failed: {e}")

    yield  # App runs here


app = FastAPI(
    title="ReturnShield AI",
    description="Defense-only AI platform for e-commerce return abuse detection",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "ReturnShield AI", "version": "1.0.0"}


# Register all routers
from app.routers import auth, dashboard, returns, simulator, metrics, decisions, customers, risk

app.include_router(auth.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(returns.router, prefix="/api/v1")
app.include_router(simulator.router, prefix="/api/v1")
app.include_router(metrics.router, prefix="/api/v1")
app.include_router(decisions.router, prefix="/api/v1")
app.include_router(customers.router, prefix="/api/v1")
app.include_router(risk.router, prefix="/api/v1")


@app.get("/api/v1/demo/trigger-new-return")
def trigger_new_return():
    """
    Demo endpoint: generates and scores a random new return request.
    Used by the Dashboard 'Trigger New Return' button.
    """
    from app.database import SessionLocal
    from app.models.customer import Customer
    from app.services.risk_engine import score_return_request
    import json

    db = SessionLocal()
    try:
        customers = db.query(Customer).all()
        if not customers:
            return {"error": "No customers in database. Run seeding first."}

        # Pick a random customer — bias toward high-risk profiles
        customer = random.choice(customers)
        categories = ["Electronics", "Fashion", "Furniture", "Home", "Books", "Sports", "Beauty"]
        category = random.choice(categories)

        # Bias toward higher amounts for demo interest
        amount = round(random.uniform(500, 12000), 2)

        customer_data = {
            "id": customer.id,
            "account_age_days": customer.account_age_days,
            "total_orders": customer.total_orders,
            "total_returns": customer.total_returns,
            "verified_abuse_history": customer.verified_abuse_history,
            "avg_order_value": 2500.0,
            "avg_return_value": 1800.0,
            "recent_returns": random.randint(0, 4),
        }
        return_request_data = {
            "amount": amount,
            "category": category,
            "reason": random.choice([
                "Product defective", "Wrong item received",
                "Changed my mind", "Size doesn't fit",
                "Color different from picture",
            ]),
            "days_since_purchase": random.randint(1, 28),
        }

        result = score_return_request(customer_data, return_request_data, db)

        return {
            "customer_name": customer.name,
            "customer_id": customer.id,
            "return_amount": amount,
            "category": category,
            "risk_score": result["risk_score"],
            "risk_level": result["risk_level"],
            "recommended_action": result["recommended_action"],
            "abuse_probability": result["abuse_probability"],
            "expected_loss": result.get("expected_loss", 0),
            "drift_score": result.get("drift_score", 0),
            "top_signal": result["explanation"][0]["signal"] if result.get("explanation") else "",
            "detected_patterns": [p["name"] for p in result.get("detected_patterns", [])[:3]],
        }
    finally:
        db.close()
