from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from app.database import Base
from datetime import datetime


class ReviewerDecision(Base):
    __tablename__ = "reviewer_decisions"
    id = Column(Integer, primary_key=True, index=True)
    return_request_id = Column(Integer, ForeignKey("return_requests.id"), index=True)
    reviewer_id = Column(Integer, default=1)
    decision = Column(String)          # APPROVED / REJECTED / ESCALATED
    notes = Column(String, default="")
    feedback_label = Column(String, default="")  # TRUE_POSITIVE / FALSE_POSITIVE / etc.
    final_action = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
