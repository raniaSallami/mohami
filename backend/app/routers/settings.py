"""
Settings API endpoints.
Returns system config, pricing, and plan limits.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/general")
async def get_general_settings():
    """Return general platform settings."""
    return {
        "maintenanceMode": False,
        "allowRegistrations": True,
        "appName": "المحامي",
        "appVersion": "1.0.0",
    }


@router.get("/pricing")
async def get_pricing():
    """Return plan pricing."""
    return {
        "pro": 59,
        "enterprise": 199,
    }


@router.get("/plan-limits")
async def get_plan_limits():
    """Return plan limits."""
    return {
        "basic": {"cases": 5, "contracts": 2},
        "pro": {"cases": 50, "contracts": 100},
        "enterprise": {"cases": 9999, "contracts": 9999},
    }
