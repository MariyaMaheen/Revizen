from fastapi import APIRouter, Depends

from services.auth import get_current_user
from services.insights import get_insights

router = APIRouter()


@router.get("/insights")
async def insights(current_user=Depends(get_current_user)):
    data = get_insights(current_user["id"])
    return data
