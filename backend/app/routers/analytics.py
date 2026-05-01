from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

from app.database import get_db

router = APIRouter(prefix="/analytics", tags=["Analytics"])

class PageViewRequest(BaseModel):
    visitor_id: str
    page: str
    email: Optional[str] = None
    session_id: Optional[str] = None
    timestamp: Optional[str] = None

class ActionRequest(BaseModel):
    visitor_id: str
    action: str
    data: Optional[dict] = None
    email: Optional[str] = None
    session_id: Optional[str] = None
    timestamp: Optional[str] = None

class ErrorRequest(BaseModel):
    visitor_id: str
    error: str
    stack: Optional[str] = None
    email: Optional[str] = None
    session_id: Optional[str] = None
    timestamp: Optional[str] = None

@router.post("/page-view")
async def track_page_view(data: PageViewRequest, request: Request, db: AsyncSession = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    try:
        from app.models.tenant import PlatformVisitor
        visit_date = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        
        # Check if already visited today to decide is_unique
        today_start = datetime.utcnow().strftime("%Y-%m-%d 00:00:00")
        is_unique_query = await db.execute(select(PlatformVisitor.id).where(
            PlatformVisitor.session_id == (data.session_id or data.visitor_id),
            PlatformVisitor.visit_date >= today_start
        ))
        is_unique = (is_unique_query.first() is None)

        visitor = PlatformVisitor(
            session_id=data.session_id or data.visitor_id,
            ip_address=ip[:100] if ip else None,
            user_agent=user_agent,
            page_visited=data.page[:500] if data.page else None,
            visit_date=visit_date,
            is_unique=is_unique
        )
        db.add(visitor)
        await db.commit()
    except Exception as e:
        import traceback
        traceback.print_exc()
        await db.rollback()
    return {"status": "ok"}

@router.post("/action")
async def track_action(data: ActionRequest, request: Request):
    return {"status": "ok"}

@router.post("/error")
async def track_error(data: ErrorRequest, request: Request):
    return {"status": "ok"}
