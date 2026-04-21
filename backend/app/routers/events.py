"""
Event management routes.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from app.database import get_db
from app.models.user import User
from app.models.event import Event
from app.schemas.event import (
    EventCreate,
    EventUpdate,
    EventResponse,
    EventListResponse,
)
from app.utils.security import get_current_active_user


router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=EventListResponse)
async def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    event_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List events for the current user/organization."""
    tenant_id = None
    if current_user.role != "ADMIN":
        tenant_id = current_user.organization_owner_id or current_user.id
    
    query = select(Event)
    
    if tenant_id:
        query = query.where(
            or_(
                Event.tenant_id == str(tenant_id),
                Event.user_id == str(current_user.id)
            )
        )
    
    if start_date:
        query = query.where(Event.date >= start_date)
    if end_date:
        query = query.where(Event.date <= end_date)
    if event_type:
        query = query.where(Event.type == event_type)
    
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Event.date.asc(), Event.time.asc())
    
    result = await db.execute(query)
    events = result.scalars().all()
    
    return EventListResponse(
        events=[EventResponse.model_validate(e) for e in events],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific event by ID."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return EventResponse.model_validate(event)


@router.post("", response_model=EventResponse)
async def create_event(
    event_data: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new event and notify the user."""
    from app.models.notification import Notification
    
    tenant_id = current_user.organization_owner_id or current_user.id
    
    event = Event(
        title=event_data.title,
        date=event_data.date,
        time=event_data.time,
        type=event_data.type,
        description=event_data.description,
        case_id=event_data.case_id,
        user_id=str(current_user.id),
        tenant_id=str(tenant_id) if tenant_id else None
    )
    
    db.add(event)
    
    # Create notification
    notification = Notification(
        user_id=current_user.id,
        type="appointment",
        title="موعد جديد",
        message=f"تمت إضافة موعد جديد في التقويم: {event.title}",
        link="/calendar"
    )
    db.add(notification)
    
    await db.commit()
    await db.refresh(event)
    
    return EventResponse.model_validate(event)


@router.patch("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    event_update: EventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update an event."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = event_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)
    
    await db.commit()
    await db.refresh(event)
    
    return EventResponse.model_validate(event)


@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete an event."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    await db.delete(event)
    await db.commit()
    
    return {"message": "Event deleted successfully"}

