from sqlalchemy import Column, Integer, String, DateTime, Float
from app.database import Base
from datetime import datetime


class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    account_age_days = Column(Integer, default=0)
    total_orders = Column(Integer, default=0)
    total_returns = Column(Integer, default=0)
    verified_abuse_history = Column(Integer, default=0)
    status = Column(String, default="ACTIVE")  # "ACTIVE", "HOLD", "REJECTED", "PENDING"
    
    # Extended payment & refund aggregates
    total_payments = Column(Integer, default=0)
    total_refunds = Column(Integer, default=0)
    total_payment_value = Column(Float, default=0.0)
    total_refund_value = Column(Float, default=0.0)
