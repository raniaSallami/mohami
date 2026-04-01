"""
Notification management routes.

Routes are aligned with the frontend notificationService.ts expectations:
  GET  /notifications?page=<int|false>&limit=<int>
  GET  /notifications/unread-count
  PUT  /notifications/<id>/read
  PUT  /notifications/mark-all-read
  DELETE /notifications/<id>
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import (
    NotificationCreate,
    NotificationUpdate,
    NotificationResponse,
    NotificationListResponse,
    MarkAllReadResponse,
)
from app.utils.security import get_current_active_user


router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ── helpers ──────────────────────────────────────────────

def _parse_page(raw: Optional[str]) -> Optional[int]:
    """
    The frontend sometimes sends page=false (boolean serialised to string)
    when it wants *all* notifications without pagination.
    Return None in that case so the caller knows to skip pagination.
    """
    if raw is None:
        return 1
    low = raw.lower().strip()
    if low in ("false", "0", ""):
        return None        # signal: no pagination
    try:
        val = int(low)
        return max(val, 1)
    except ValueError:
        return 1           # fallback


# ── GET /notifications/unread-count ──────────────────────
# IMPORTANT: this route MUST be registered before the
# /{notification_id} route, otherwise FastAPI would try to
# match "unread-count" as a notification_id.

@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return the number of unread notifications for the current user."""
    result = await db.execute(
        select(func.count()).where(
            Notification.user_id == current_user.id,
            Notification.read == False,
        )
    )
    count = result.scalar() or 0
    return {"count": count}


# ── GET /notifications ───────────────────────────────────

@router.get("")
async def list_notifications(
    request: Request,
    limit: int = Query(20, ge=1, le=200),
    page_size: int = Query(20, ge=1, le=200),
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    List notifications for the current user.

    The frontend sends ``?page=<val>&limit=<n>``.
    - page can be an integer **or** the string ``"false"`` (meaning "give me everything").
    - ``limit`` maps to the old ``page_size`` parameter.
    """
    # --- parse "page" manually because it can be "false" ----
    raw_page = request.query_params.get("page", "1")
    page = _parse_page(raw_page)

    effective_page_size = limit or page_size

    # Base query
    query = select(Notification).where(Notification.user_id == current_user.id)

    if unread_only:
        query = query.where(Notification.read == False)

    # Total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Unread count (always returned)
    unread_query = select(func.count()).where(
        Notification.user_id == current_user.id,
        Notification.read == False,
    )
    unread_result = await db.execute(unread_query)
    unread_count = unread_result.scalar() or 0

    # Apply ordering
    query = query.order_by(Notification.created_at.desc())

    # Apply pagination only when page is a valid int
    if page is not None:
        offset = (page - 1) * effective_page_size
        query = query.offset(offset).limit(effective_page_size)
    else:
        # page=false → return up to `limit` without offset
        query = query.limit(effective_page_size)

    result = await db.execute(query)
    notifications = result.scalars().all()

    return NotificationListResponse(
        notifications=[NotificationResponse.model_validate(n) for n in notifications],
        total=total,
        unread_count=unread_count,
    )


# ── PUT / PATCH  /{notification_id}/read ─────────────────

@router.put("/{notification_id}/read", response_model=NotificationResponse)
@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Mark a single notification as read (accepts PUT or PATCH)."""
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    notification.read = True
    await db.commit()
    await db.refresh(notification)

    return NotificationResponse.model_validate(notification)


# ── PUT  /mark-all-read  (+ POST /read-all for compat) ───

@router.put("/mark-all-read", response_model=MarkAllReadResponse)
@router.post("/read-all", response_model=MarkAllReadResponse)
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Mark every notification as read for the current user."""
    result = await db.execute(
        update(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.read == False,
        )
        .values(read=True)
    )
    await db.commit()

    return MarkAllReadResponse(updated_count=result.rowcount)


# ── GET /{notification_id} ───────────────────────────────

@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a specific notification by ID."""
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return NotificationResponse.model_validate(notification)


# ── DELETE /{notification_id} ────────────────────────────

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a notification."""
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(notification)
    await db.commit()

    return {"message": "Notification deleted"}


# ── POST /  (create notification) ────────────────────────

@router.post("", response_model=NotificationResponse)
async def create_notification(
    notification_data: NotificationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a notification (typically for system alerts)."""
    notification = Notification(
        user_id=notification_data.user_id,
        type=notification_data.type,
        title=notification_data.title,
        message=notification_data.message,
        link=notification_data.link,
        extra_data=notification_data.metadata or {},
    )

    db.add(notification)
    await db.commit()
    await db.refresh(notification)

    return NotificationResponse.model_validate(notification)
