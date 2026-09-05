"""
ReturnShield AI — Decisions Router
Allows reviewers to approve/reject/flag return requests and update client risk status.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.return_request import ReturnRequest
from app.models.customer import Customer
from app.models.reviewer_decision import ReviewerDecision

router = APIRouter(prefix="/decisions", tags=["decisions"])


@router.post("/{return_id}")
def submit_decision(return_id: int, data: dict, db: Session = Depends(get_db)):
    """
    Reviewer submits a decision on a return request.
    Decision: APPROVE / APPROVED / ALLOW | FLAG / HOLD / MANUAL_REVIEW | REJECT / REJECTED / DENY
    Feedback label: TRUE_POSITIVE | FALSE_POSITIVE | TRUE_NEGATIVE | FALSE_NEGATIVE
    """
    rr = db.query(ReturnRequest).filter(ReturnRequest.id == return_id).first()
    if not rr:
        raise HTTPException(status_code=404, detail="Return request not found")

    decision_raw = str(data.get("decision", "APPROVED")).upper().strip()
    notes = data.get("notes", "")
    feedback_label = data.get("feedback_label", "")

    # Clean mapping of decisions to canonical statuses
    status_map = {
        "APPROVE": "APPROVED",
        "APPROVED": "APPROVED",
        "ALLOW": "APPROVED",
        "FLAG": "HOLD",
        "HOLD": "HOLD",
        "UNDER_REVIEW": "HOLD",
        "MANUAL_REVIEW": "HOLD",
        "ESCALATED": "HOLD",
        "ENHANCED_VERIFICATION": "HOLD",
        "REJECT": "REJECTED",
        "REJECTED": "REJECTED",
        "DENY": "REJECTED",
        "DENIED": "REJECTED",
    }
    new_status = status_map.get(decision_raw, "HOLD")
    rr.status = new_status
    db.add(rr)

    # Also update the customer's overall client status
    customer = db.query(Customer).filter(Customer.id == rr.customer_id).first()
    customer_status = "ACTIVE"
    if customer:
        if new_status == "REJECTED":
            customer.status = "REJECTED"
            customer.verified_abuse_history = 1
        elif new_status == "HOLD":
            if customer.status != "REJECTED":
                customer.status = "HOLD"
        elif new_status == "APPROVED":
            # Check if customer has other pending or hold claims
            other_holds = db.query(ReturnRequest).filter(
                ReturnRequest.customer_id == customer.id,
                ReturnRequest.id != rr.id,
                ReturnRequest.status.in_(["HOLD", "UNDER_REVIEW", "PENDING"]),
            ).count()
            if other_holds == 0 and customer.status != "REJECTED":
                customer.status = "ACTIVE"
        customer_status = customer.status
        db.add(customer)

    # Create reviewer decision audit record
    reviewer_decision = ReviewerDecision(
        return_request_id=return_id,
        reviewer_id=1,
        decision=new_status,
        notes=notes,
        feedback_label=feedback_label,
        created_at=datetime.utcnow(),
        final_action=new_status,
    )
    db.add(reviewer_decision)
    db.commit()
    db.refresh(rr)
    if customer:
        db.refresh(customer)

    return {
        "success": True,
        "return_id": return_id,
        "decision": new_status,
        "new_status": new_status,
        "customer_id": rr.customer_id,
        "customer_status": customer_status,
        "feedback_label": feedback_label,
        "message": f"Verdict '{new_status}' saved. Return status updated to {new_status}, client status set to {customer_status}, and ground-truth feedback recorded for future model retraining.",
        "reviewer_decision_id": reviewer_decision.id,
        "decided_at": reviewer_decision.created_at.isoformat(),
    }


@router.get("/{return_id}")
def get_decisions(return_id: int, db: Session = Depends(get_db)):
    """Get all reviewer decisions for a return request."""
    decisions = (
        db.query(ReviewerDecision)
        .filter(ReviewerDecision.return_request_id == return_id)
        .order_by(ReviewerDecision.created_at.desc())
        .all()
    )
    return [
        {
            "id": d.id,
            "return_request_id": d.return_request_id,
            "decision": d.decision,
            "notes": d.notes,
            "feedback_label": d.feedback_label,
            "final_action": d.final_action,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in decisions
    ]
