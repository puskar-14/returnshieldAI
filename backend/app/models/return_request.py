from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from app.database import Base
from datetime import datetime


class ReturnRequest(Base):
    __tablename__ = "return_requests"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    amount = Column(Float)
    reason = Column(String)
    category = Column(String, default="Home")
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="PENDING")   # PENDING/APPROVED/REJECTED/UNDER_REVIEW/HOLD
    risk_score = Column(Integer, default=0)
    risk_level = Column(String, default="LOW")   # LOW/MEDIUM/HIGH
    recommended_action = Column(String, default="ALLOW")
    
    # Razorpay refund context
    refund_id = Column(String, nullable=True)
    payment_id = Column(String, nullable=True)
    days_since_payment = Column(Integer, default=7)
    refund_status = Column(String, default="PENDING")
