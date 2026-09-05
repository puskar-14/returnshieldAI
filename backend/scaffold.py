import os

directories = [
    'app/models',
    'app/routers',
    'app/ml',
    'app/services'
]

for d in directories:
    os.makedirs(os.path.join(r"c:\Users\Puskar Kumar Prasad\Music\ShieldApp\backend", d), exist_ok=True)

with open(r"c:\Users\Puskar Kumar Prasad\Music\ShieldApp\backend\app\models\__init__.py", "w") as f:
    f.write("# Init\nfrom .customer import Customer\nfrom .order import Order\nfrom .return_request import ReturnRequest\nfrom .product import Product\nfrom .risk_assessment import RiskAssessment\nfrom .reviewer_decision import ReviewerDecision\n")
    
with open(r"c:\Users\Puskar Kumar Prasad\Music\ShieldApp\backend\app\models\customer.py", "w") as f:
    f.write("""from sqlalchemy import Column, Integer, String, DateTime, Float
from app.database import Base
from datetime import datetime

class Customer(Base):
    __tablename__ = 'customers'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    account_age_days = Column(Integer, default=0)
    total_orders = Column(Integer, default=0)
    total_returns = Column(Integer, default=0)
    verified_abuse_history = Column(Integer, default=0)
""")

with open(r"c:\Users\Puskar Kumar Prasad\Music\ShieldApp\backend\app\models\order.py", "w") as f:
    f.write("""from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from app.database import Base
from datetime import datetime

class Order(Base):
    __tablename__ = 'orders'
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey('customers.id'))
    product_id = Column(Integer, ForeignKey('products.id'))
    amount = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String)
""")

with open(r"c:\Users\Puskar Kumar Prasad\Music\ShieldApp\backend\app\models\product.py", "w") as f:
    f.write("""from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class Product(Base):
    __tablename__ = 'products'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    category = Column(String)
    avg_price = Column(Float)
    category_return_rate = Column(Float)
""")

with open(r"c:\Users\Puskar Kumar Prasad\Music\ShieldApp\backend\app\models\return_request.py", "w") as f:
    f.write("""from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from app.database import Base
from datetime import datetime

class ReturnRequest(Base):
    __tablename__ = 'return_requests'
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey('customers.id'))
    order_id = Column(Integer, ForeignKey('orders.id'))
    amount = Column(Float)
    reason = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String) # PENDING/APPROVED/REJECTED/UNDER_REVIEW
    risk_score = Column(Integer)
    risk_level = Column(String) # LOW/MEDIUM/HIGH
    recommended_action = Column(String)
""")

with open(r"c:\Users\Puskar Kumar Prasad\Music\ShieldApp\backend\app\models\risk_assessment.py", "w") as f:
    f.write("""from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text
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
""")

with open(r"c:\Users\Puskar Kumar Prasad\Music\ShieldApp\backend\app\models\reviewer_decision.py", "w") as f:
    f.write("""from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from app.database import Base
from datetime import datetime

class ReviewerDecision(Base):
    __tablename__ = 'reviewer_decisions'
    id = Column(Integer, primary_key=True, index=True)
    return_request_id = Column(Integer, ForeignKey('return_requests.id'))
    reviewer_id = Column(String)
    decision = Column(String) # APPROVED/REJECTED
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    final_action = Column(String)
""")

with open(r"c:\Users\Puskar Kumar Prasad\Music\ShieldApp\backend\app\auth.py", "w") as f:
    f.write("""from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
""")

with open(r"c:\Users\Puskar Kumar Prasad\Music\ShieldApp\backend\app\main.py", "w") as f:
    f.write("""from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models # to ensure tables are registered

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ReturnShield AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}
""")
