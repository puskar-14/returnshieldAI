from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from app.database import Base
from datetime import datetime


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    amount = Column(Float)
    category = Column(String, default="Home")
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="COMPLETED")
    
    # Razorpay payment context
    payment_id = Column(String, nullable=True)
    payment_method = Column(String, default="UPI")  # UPI, NetBanking, Credit Card, Debit Card
    payment_status = Column(String, default="CAPTURED")
    delivered_at = Column(DateTime, nullable=True)
