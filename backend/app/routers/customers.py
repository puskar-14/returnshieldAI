"""
ReturnShield AI — Customers / Clients Directory Router
Allows merchants and admins to view, filter, and manage All, Pending, Accepted/Active, On Hold, and Rejected clients.
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.models.return_request import ReturnRequest
from app.models.risk_assessment import RiskAssessment

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("")
def list_customers(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    List all merchant clients/customers with filtering by status:
    ALL, PENDING, ACCEPT (ACTIVE), HOLD, REJECT (REJECTED).
    """
    query = db.query(Customer)

    # Filter by status
    if status and status.upper() != "ALL":
        s = status.upper().strip()
        if s in ["ACCEPT", "ACCEPTED", "ACTIVE"]:
            query = query.filter(Customer.status.in_(["ACTIVE", "ACCEPTED"]))
        elif s in ["HOLD", "ON HOLD"]:
            query = query.filter(Customer.status == "HOLD")
        elif s in ["REJECT", "REJECTED", "BLOCKED"]:
            query = query.filter(Customer.status == "REJECTED")
        elif s in ["PENDING"]:
            query = query.filter(Customer.status == "PENDING")

    # Search by customer name or email
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter((Customer.name.ilike(term)) | (Customer.email.ilike(term)))

    total = query.count()
    customers_page = (
        query.order_by(Customer.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # Compute overall summary counts
    pending_count = db.query(Customer).filter(Customer.status == "PENDING").count()
    active_count = db.query(Customer).filter(Customer.status.in_(["ACTIVE", "ACCEPTED"])).count()
    hold_count = db.query(Customer).filter(Customer.status == "HOLD").count()
    rejected_count = db.query(Customer).filter(Customer.status == "REJECTED").count()
    total_count = db.query(Customer).count()

    results = []
    for c in customers_page:
        # Get customer's return requests
        returns = db.query(ReturnRequest).filter(ReturnRequest.customer_id == c.id).all()
        orders = db.query(Order).filter(Order.customer_id == c.id).all()

        total_returns = len(returns)
        total_orders = max(1, len(orders))
        return_rate = total_returns / total_orders

        total_claim_val = sum(r.amount or 0 for r in returns)
        highest_risk_score = max([r.risk_score for r in returns if r.risk_score is not None] or [0])
        highest_risk_level = "LOW"
        if highest_risk_score >= 70:
            highest_risk_level = "HIGH"
        elif highest_risk_score >= 40:
            highest_risk_level = "MEDIUM"

        results.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "account_age_days": c.account_age_days,
            "status": c.status or "ACTIVE",
            "verified_abuse_history": c.verified_abuse_history,
            "total_orders": total_orders,
            "total_returns": total_returns,
            "return_rate": round(return_rate, 4),
            "return_rate_pct": f"{return_rate*100:.1f}%",
            "total_claim_value": round(total_claim_val, 2),
            "highest_risk_score": highest_risk_score,
            "highest_risk_level": highest_risk_level,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })

    return {
        "summary": {
            "total": total_count,
            "pending_count": pending_count,
            "active_count": active_count,
            "accepted_count": active_count,
            "hold_count": hold_count,
            "rejected_count": rejected_count,
        },
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
        "total": total,
        "customers": results,
    }


@router.patch("/{customer_id}/status")
def update_customer_status(customer_id: int, data: dict, db: Session = Depends(get_db)):
    """Admin endpoint to manually change client status: PENDING | ACCEPT / ACTIVE | HOLD | REJECT."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    raw_status = str(data.get("status", "ACTIVE")).upper().strip()
    status_map = {
        "ACCEPT": "ACTIVE",
        "ACCEPTED": "ACTIVE",
        "ACTIVE": "ACTIVE",
        "HOLD": "HOLD",
        "ON HOLD": "HOLD",
        "REJECT": "REJECTED",
        "REJECTED": "REJECTED",
        "PENDING": "PENDING",
    }
    new_status = status_map.get(raw_status, "ACTIVE")

    customer.status = new_status
    if new_status == "REJECTED":
        customer.verified_abuse_history = 1

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return {
        "success": True,
        "customer_id": customer.id,
        "name": customer.name,
        "new_status": customer.status,
        "message": f"Client {customer.name} status updated to {new_status}."
    }


@router.get("/{customer_id}")
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Customer profile with behavioral analytics."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    orders = db.query(Order).filter(Order.customer_id == customer_id).all()
    returns = db.query(ReturnRequest).filter(ReturnRequest.customer_id == customer_id).all()

    now = datetime.utcnow()
    cutoff_30d = now - timedelta(days=30)
    recent_returns = [r for r in returns if r.created_at >= cutoff_30d]

    total_orders = max(1, len(orders))
    total_returns = len(returns)
    return_rate = total_returns / total_orders
    recent_return_count = len(recent_returns)

    order_amounts = [o.amount for o in orders if o.amount]
    return_amounts = [r.amount for r in returns if r.amount]
    avg_order_value = sum(order_amounts) / len(order_amounts) if order_amounts else 0
    avg_return_value = sum(return_amounts) / len(return_amounts) if return_amounts else 0

    account_age = max(1, customer.account_age_days)
    order_frequency = total_orders / (account_age / 30.0)
    return_frequency = total_returns / (account_age / 30.0)

    # Risk history
    risk_assessments = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.customer_id == customer_id)
        .order_by(RiskAssessment.created_at.desc())
        .limit(10)
        .all()
    )

    high_risk_count = sum(1 for r in returns if r.risk_level == "HIGH")
    medium_risk_count = sum(1 for r in returns if r.risk_level == "MEDIUM")
    low_risk_count = sum(1 for r in returns if r.risk_level == "LOW")

    latest_drift = risk_assessments[0].drift_score if risk_assessments else 0
    latest_baseline_dev = risk_assessments[0].baseline_deviation if risk_assessments else 0

    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "account_age_days": customer.account_age_days,
        "status": customer.status or "ACTIVE",
        "created_at": customer.created_at.isoformat() if customer.created_at else None,
        "verified_abuse_history": customer.verified_abuse_history,
        "behavioral_analytics": {
            "total_orders": total_orders,
            "total_returns": total_returns,
            "return_rate": round(return_rate, 4),
            "return_rate_pct": f"{return_rate*100:.1f}%",
            "recent_return_count": recent_return_count,
            "avg_order_value": round(avg_order_value, 2),
            "avg_return_value": round(avg_return_value, 2),
            "order_frequency": round(order_frequency, 2),
            "return_frequency": round(return_frequency, 2),
            "high_risk_returns": high_risk_count,
            "medium_risk_returns": medium_risk_count,
            "low_risk_returns": low_risk_count,
            "latest_drift_score": latest_drift,
            "latest_baseline_deviation": latest_baseline_dev,
        },
        "returns": [
            {
                "id": r.id,
                "amount": r.amount,
                "category": r.category,
                "reason": r.reason,
                "status": r.status,
                "risk_score": r.risk_score,
                "risk_level": r.risk_level,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in returns
        ],
        "risk_history": [
            {
                "risk_score": ra.risk_score,
                "risk_level": ra.risk_level,
                "drift_score": ra.drift_score,
                "baseline_deviation": ra.baseline_deviation,
                "expected_loss": ra.expected_loss,
                "created_at": ra.created_at.isoformat() if ra.created_at else None,
            }
            for ra in risk_assessments
        ],
    }
