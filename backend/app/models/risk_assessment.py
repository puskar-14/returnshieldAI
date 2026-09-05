from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text
from app.database import Base
from datetime import datetime

class RiskAssessment(Base):
    __tablename__ = 'risk_assessments'
    id = Column(Integer, primary_key=True, index=True)
    return_request_id = Column(Integer, ForeignKey('return_requests.id'))
    customer_id = Column(Integer, ForeignKey('customers.id'))
    risk_score = Column(Integer)
    risk_level = Column(String)
    abuse_probability = Column(Float)
    expected_loss = Column(Float)
    features_json = Column(Text)
    explanation_json = Column(Text)
    drift_score = Column(Float)
    baseline_deviation = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
