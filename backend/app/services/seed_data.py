"""
ReturnShield AI — Database Seeder
Seeds the database with compelling demo data including:
- Legitimate customers with normal return behavior
- Abusive customers with various patterns
- Pre-computed risk assessments
"""
import json
import random
from datetime import datetime, timedelta
from passlib.context import CryptContext

from app.database import SessionLocal
from app.models.customer import Customer
from app.models.order import Order
from app.models.product import Product
from app.models.return_request import ReturnRequest
from app.models.risk_assessment import RiskAssessment
from app.models.reviewer_decision import ReviewerDecision

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

random.seed(42)

CATEGORIES = ["Electronics", "Fashion", "Furniture", "Home", "Books", "Sports", "Beauty"]

CATEGORY_PRODUCTS = {
    "Electronics": [
        ("Samsung Galaxy S24", 45000), ("Apple AirPods Pro", 22000),
        ("Sony WH-1000XM5", 28000), ("Laptop Stand", 3500), ("USB-C Hub", 4200),
        ("iPad 10th Gen", 38000), ("Mechanical Keyboard", 8500),
    ],
    "Fashion": [
        ("Nike Air Max 270", 8500), ("Levi's 511 Jeans", 4200),
        ("Zara Casual Shirt", 2800), ("H&M Hoodie", 2200),
        ("Adidas Track Pants", 3500), ("Formal Blazer", 6500),
    ],
    "Furniture": [
        ("Ergonomic Chair", 18000), ("Standing Desk", 25000),
        ("Bookshelf (5-tier)", 8500), ("Coffee Table", 12000),
    ],
    "Home": [
        ("Air Purifier", 9500), ("Electric Kettle", 2200),
        ("Coffee Maker", 4800), ("Microwave Oven", 12000),
    ],
    "Books": [
        ("Clean Code", 850), ("System Design Interview", 1200),
        ("Atomic Habits", 650), ("DDIA", 1800),
    ],
    "Sports": [
        ("Yoga Mat", 1200), ("Resistance Bands Set", 850),
        ("Protein Powder 1kg", 2200), ("Running Shoes", 4500),
    ],
    "Beauty": [
        ("Serum Set", 3200), ("Face Wash Pack", 1100),
        ("Moisturizer SPF50", 1800), ("Perfume 100ml", 4500),
    ],
}

REASONS = [
    "Product defective", "Wrong item received", "Changed my mind",
    "Size doesn't fit", "Color different from picture", "Product not as described",
    "Received damaged", "No longer needed", "Found cheaper elsewhere",
    "Gift not needed",
]

DEMO_SCENARIOS = [
    # (name, email, profile_type, account_age_days)
    ("Raj Sharma",       "raj.sharma@email.com",      "HIGH_DRIFT",          480),
    ("Priya Patel",      "priya.patel@email.com",     "BURST_ABUSER",        320),
    ("Amit Verma",       "amit.verma@email.com",      "VERIFIED_ABUSER",     650),
    ("Sneha Reddy",      "sneha.reddy@email.com",     "LEGITIMATE",          750),
    ("Karan Mehta",      "karan.mehta@email.com",     "LEGITIMATE",          1200),
    ("Divya Singh",      "divya.singh@email.com",     "NEW_ACCOUNT",         15),
    ("Rahul Gupta",      "rahul.gupta@email.com",     "MODERATE_RISK",       200),
    ("Ananya Nair",      "ananya.nair@email.com",     "FALSE_POSITIVE",      900),
    ("Vikram Joshi",     "vikram.joshi@email.com",    "HIGH_VALUE_ABUSER",   550),
    ("Pooja Iyer",       "pooja.iyer@email.com",      "LEGITIMATE",          1800),
    ("Suresh Kumar",     "suresh.kumar@email.com",    "BURST_ABUSER",        180),
    ("Meera Krishnan",   "meera.krishnan@email.com",  "HIGH_DRIFT",          420),
    ("Arjun Nanda",      "arjun.nanda@email.com",     "LEGITIMATE",          890),
    ("Lakshmi Rao",      "lakshmi.rao@email.com",     "MODERATE_RISK",       300),
    ("Siddharth Malhotra", "sid.malhotra@email.com",  "VERIFIED_ABUSER",    700),
]

# Additional generic customers
GENERIC_NAMES = [
    "Neha Sharma", "Ravi Tiwari", "Sunita Agarwal", "Manoj Kumar", "Kavya Pillai",
    "Deepak Nair", "Rashmi Sinha", "Arun Saxena", "Tanya Kapoor", "Vinay Mishra",
    "Geetha Menon", "Harish Prasad", "Jaya Lakshmikanthan", "Kishore Babu",
    "Lalitha Devi", "Mohan Das", "Nisha Tripathi", "Omkar Jadhav", "Prabha Reddy",
    "Qasim Ahmed", "Rekha Sharma", "Sameer Khan", "Tanvir Hussain", "Uma Devi",
    "Vasanth Rajan", "Waqar Ali", "Xavier Fernandes", "Yogita Jain", "Zara Merchant",
    "Abhishek Roy", "Bharathi Subramanian", "Chandana Murthy", "Dilip Nair",
    "Esha Kapoor", "Farhan Sheikh", "Gauri Trivedi", "Hemant Soni",
]


def _make_orders_and_returns(
    db,
    customer: Customer,
    products: list,
    profile: str,
    num_orders: int = 8,
):
    """
    Create orders and return requests for a customer based on their risk profile.
    Returns list of (ReturnRequest, risk_score_hint) tuples.
    """
    now = datetime.utcnow()
    account_age = customer.account_age_days
    orders = []
    return_requests = []

    for i in range(num_orders):
        product = random.choice(products)
        days_ago = random.randint(5, min(account_age, 400))
        order_date = now - timedelta(days=days_ago)

        order = Order(
            customer_id=customer.id,
            product_id=product.id,
            amount=round(product.avg_price * random.uniform(0.9, 1.1), 2),
            category=product.category,
            created_at=order_date,
            status="COMPLETED",
        )
        db.add(order)
        db.flush()
        orders.append((order, product, days_ago))

    # Create returns based on profile
    if profile == "HIGH_DRIFT":
        # Was returning 8%, now returning 60%
        return_orders = random.sample(orders, min(len(orders), int(len(orders) * 0.6)))
        is_recent_abuse = True
    elif profile == "BURST_ABUSER":
        # 4-5 returns in last 7 days
        return_orders = orders[:min(5, len(orders))]
        is_recent_abuse = True
    elif profile == "VERIFIED_ABUSER":
        return_orders = random.sample(orders, min(len(orders), int(len(orders) * 0.5)))
        is_recent_abuse = True
    elif profile == "HIGH_VALUE_ABUSER":
        # Returns only high-value items
        high_val_orders = [(o, p, d) for o, p, d in orders if p.avg_price > 5000]
        return_orders = high_val_orders if high_val_orders else orders[:2]
        is_recent_abuse = True
    elif profile == "NEW_ACCOUNT":
        return_orders = orders[:min(3, len(orders))]
        is_recent_abuse = True
    elif profile == "LEGITIMATE":
        return_orders = random.sample(orders, min(1, len(orders)))
        is_recent_abuse = False
    elif profile == "FALSE_POSITIVE":
        # Legitimate customer but happens to have slightly higher returns
        return_orders = random.sample(orders, min(2, len(orders)))
        is_recent_abuse = False
    elif profile == "MODERATE_RISK":
        return_orders = random.sample(orders, min(len(orders), int(len(orders) * 0.3)))
        is_recent_abuse = random.random() < 0.5
    else:
        return_orders = random.sample(orders, min(1, len(orders)))
        is_recent_abuse = False

    for o, p, days_ago in return_orders:
        if profile == "BURST_ABUSER":
            return_days_ago = random.randint(1, 5)  # all recent
        elif profile == "HIGH_DRIFT":
            return_days_ago = random.randint(1, 15)
        else:
            return_days_ago = random.randint(1, min(days_ago, 25))

        return_date = now - timedelta(days=return_days_ago)

        # Risk scoring hint
        if profile in ("HIGH_DRIFT", "BURST_ABUSER", "VERIFIED_ABUSER", "HIGH_VALUE_ABUSER", "NEW_ACCOUNT"):
            risk_hint = "HIGH"
        elif profile == "MODERATE_RISK":
            risk_hint = "MEDIUM"
        else:
            risk_hint = "LOW"

        rr = ReturnRequest(
            customer_id=customer.id,
            order_id=o.id,
            amount=round(o.amount * random.uniform(0.8, 1.0), 2),
            reason=random.choice(REASONS),
            category=p.category,
            created_at=return_date,
            status=_status_for_risk(risk_hint),
            risk_score=_risk_score_for_hint(risk_hint),
            risk_level=risk_hint,
            recommended_action=_action_for_hint(risk_hint),
        )
        db.add(rr)
        db.flush()
        return_requests.append(rr)

    return return_requests


def _status_for_risk(hint: str) -> str:
    if hint == "HIGH":
        return random.choice(["UNDER_REVIEW", "PENDING", "REJECTED"])
    elif hint == "MEDIUM":
        return random.choice(["UNDER_REVIEW", "PENDING", "APPROVED"])
    return random.choice(["APPROVED", "APPROVED", "PENDING"])


def _risk_score_for_hint(hint: str) -> int:
    if hint == "HIGH":
        return random.randint(72, 96)
    elif hint == "MEDIUM":
        return random.randint(42, 68)
    return random.randint(8, 37)


def _action_for_hint(hint: str) -> str:
    return {
        "HIGH": "ENHANCED_VERIFICATION",
        "MEDIUM": "MANUAL_REVIEW",
        "LOW": "ALLOW",
    }[hint]


def seed_db(db=None):
    """Seed the database with demo data."""
    if db is None:
        db = SessionLocal()
        close_db = True
    else:
        close_db = False

    try:
        # Skip if already seeded
        if db.query(Customer).count() > 0:
            return

        print("Seeding database...")

        # ── Products ──────────────────────────────────────────────────────
        products_by_cat = {}
        for cat, items in CATEGORY_PRODUCTS.items():
            for name, price in items:
                p = Product(
                    name=name,
                    category=cat,
                    avg_price=float(price),
                    category_return_rate=0.10,
                )
                db.add(p)
                db.flush()
                products_by_cat.setdefault(cat, []).append(p)
        all_products = [p for plist in products_by_cat.values() for p in plist]

        # ── Demo customers ────────────────────────────────────────────────
        for name, email, profile, age in DEMO_SCENARIOS:
            abuse_flag = 1 if profile in ("VERIFIED_ABUSER",) else 0
            c = Customer(
                name=name,
                email=email,
                account_age_days=age,
                total_orders=random.randint(6, 20),
                total_returns=0,
                verified_abuse_history=abuse_flag,
                created_at=datetime.utcnow() - timedelta(days=age),
            )
            db.add(c)
            db.flush()

            returns = _make_orders_and_returns(
                db, c, all_products, profile, num_orders=random.randint(6, 14)
            )
            c.total_returns = len(returns)

            # Create risk assessments for each return
            for rr in returns:
                features_mock = {
                    "return_to_order_ratio": 0.6 if profile in ("HIGH_DRIFT", "BURST_ABUSER", "VERIFIED_ABUSER") else 0.1,
                    "drift_score": 78.0 if profile == "HIGH_DRIFT" else (20.0 if profile == "LEGITIMATE" else 45.0),
                    "baseline_deviation": 4.2 if profile == "HIGH_DRIFT" else (0.3 if profile == "LEGITIMATE" else 1.8),
                }
                explanation_mock = [
                    {"signal": "Return frequency increased", "contribution": rr.risk_score * 0.35, "direction": "risk"},
                    {"signal": "Deviation from personal baseline", "contribution": rr.risk_score * 0.22, "direction": "risk"},
                    {"signal": "Recent return count (30 days)", "contribution": rr.risk_score * 0.15, "direction": "risk"},
                    {"signal": "Account age", "contribution": -rr.risk_score * 0.08, "direction": "safe"},
                ]
                ra = RiskAssessment(
                    return_request_id=rr.id,
                    customer_id=c.id,
                    risk_score=rr.risk_score,
                    risk_level=rr.risk_level,
                    abuse_probability=round(rr.risk_score / 100.0, 3),
                    expected_loss=round(rr.amount * (rr.risk_score / 100.0), 2),
                    features_json=json.dumps(features_mock),
                    explanation_json=json.dumps(explanation_mock),
                    drift_score=features_mock["drift_score"],
                    baseline_deviation=features_mock["baseline_deviation"],
                    created_at=rr.created_at,
                )
                db.add(ra)

        # ── Generic customers ─────────────────────────────────────────────
        for idx, gname in enumerate(GENERIC_NAMES):
            email = gname.lower().replace(" ", ".") + f"{idx}@email.com"
            profile = random.choice(["LEGITIMATE", "LEGITIMATE", "MODERATE_RISK", "HIGH_DRIFT"])
            age = random.randint(30, 1200)
            c = Customer(
                name=gname,
                email=email,
                account_age_days=age,
                total_orders=random.randint(3, 25),
                total_returns=0,
                verified_abuse_history=0,
                created_at=datetime.utcnow() - timedelta(days=age),
            )
            db.add(c)
            db.flush()
            returns = _make_orders_and_returns(
                db, c, all_products, profile, num_orders=random.randint(4, 12)
            )
            c.total_returns = len(returns)

            for rr in returns:
                ra = RiskAssessment(
                    return_request_id=rr.id,
                    customer_id=c.id,
                    risk_score=rr.risk_score,
                    risk_level=rr.risk_level,
                    abuse_probability=round(rr.risk_score / 100.0, 3),
                    expected_loss=round(rr.amount * (rr.risk_score / 100.0), 2),
                    features_json=json.dumps({}),
                    explanation_json=json.dumps([]),
                    drift_score=random.uniform(10, 70),
                    baseline_deviation=random.uniform(-1, 4),
                    created_at=rr.created_at,
                )
                db.add(ra)

        db.commit()
        print(f"[OK] Database seeded: {db.query(Customer).count()} customers, "
              f"{db.query(ReturnRequest).count()} return requests")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding error: {e}")
        import traceback; traceback.print_exc()
    finally:
        if close_db:
            db.close()
