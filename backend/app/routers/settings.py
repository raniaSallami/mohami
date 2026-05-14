"""
Settings API endpoints.
Returns system config, pricing, and plan limits.
"""
import json
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.tenant import SystemSettings
from app.utils.security import require_role

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


@router.get("/{setting_key}")
async def get_system_setting(
    setting_key: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("ADMIN"))
):
    """Return a named system setting from database."""
    result = await db.execute(select(SystemSettings).where(SystemSettings.key == setting_key))
    setting = result.scalars().first()
    if not setting:
        return {}

    if isinstance(setting.value, str):
        try:
            return json.loads(setting.value)
        except Exception:
            return setting.value

    return setting.value


@router.post("/{setting_key}")
async def set_system_setting(
    setting_key: str,
    payload: Any = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("ADMIN"))
):
    """Save a named system setting to database."""
    value = payload
    result = await db.execute(select(SystemSettings).where(SystemSettings.key == setting_key))
    existing = result.scalars().first()
    if existing:
        existing.value = value
        db.add(existing)
    else:
        db.add(SystemSettings(key=setting_key, value=value))
    return payload
