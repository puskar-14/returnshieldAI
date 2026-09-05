"""
ReturnShield AI — Authentication Router
JWT-based authentication for merchant dashboard.
"""
from datetime import timedelta
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session

from app.auth import create_access_token, verify_password, get_current_user
from app.database import get_db
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

# Demo credentials with genuine bcrypt hash for "demo123"
DEMO_USERS = {
    "merchant@demo.com": {
        "id": 1,
        "name": "Demo Merchant",
        "email": "merchant@demo.com",
        "hashed_password": "$2b$12$R.LcBaTny/HjIy7QPbXyZ.HY7MyCw4rOLwBGwRAFRspVzwR8sqxMq",
        "role": "MERCHANT",
    }
}


@router.post("/login")
async def login(request: Request):
    """Authenticate and return JWT token. Accepts Form Data or JSON body."""
    content_type = request.headers.get("content-type", "")
    username = None
    password = None

    if "application/json" in content_type:
        try:
            data = await request.json()
            username = data.get("username") or data.get("email")
            password = data.get("password")
        except Exception:
            pass
    else:
        try:
            form = await request.form()
            username = form.get("username") or form.get("email")
            password = form.get("password")
        except Exception:
            pass

    # Fallback to query params or default demo if empty
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password are required")

    user = DEMO_USERS.get(username.strip())
    if not user and username.strip().lower() == "merchant@demo.com":
        user = DEMO_USERS.get("merchant@demo.com")

    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"]},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return {
        "access_token": access_token,
        "token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        },
    }


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Return current authenticated user info."""
    return current_user
