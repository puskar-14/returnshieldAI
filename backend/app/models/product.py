from sqlalchemy import Column, Integer, String, DateTime, Float
from app.database import Base
from datetime import datetime


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    category = Column(String)
    avg_price = Column(Float)
    category_return_rate = Column(Float, default=0.10)
    created_at = Column(DateTime, default=datetime.utcnow)
