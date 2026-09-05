from fastapi import APIRouter
router = APIRouter(prefix="/risk", tags=["risk"])


@router.get("/cases")
def get_risk_cases():
    return []
