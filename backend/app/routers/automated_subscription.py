"""
Placeholder router for automated subscription-related operations.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/automated-subscription", tags=["Automated Subscription"])


@router.get("/status")
async def automated_subscription_status():
    return {
        "status": "ok",
        "feature": "automated subscription placeholder",
    }
