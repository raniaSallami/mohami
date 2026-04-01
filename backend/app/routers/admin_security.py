"""
Admin Security Dashboard Endpoints
Provides security event reporting and monitoring APIs
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List
import csv
from io import StringIO

from app.database import get_db
from app.utils.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["Admin Security"])


# ═══════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════

class SecurityEventResponse(BaseModel):
    id: int
    ip_address: str
    user_id: str
    event_type: str
    details: str
    created_at: datetime


class SecurityStatsResponse(BaseModel):
    total_events: int
    device_verified: int
    failed_otp: int
    unauthorized_reported: int
    last_24h: int


class SecurityDashboardResponse(BaseModel):
    events: List[SecurityEventResponse]
    stats: SecurityStatsResponse


# ═══════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════

async def verify_admin_access(
    current_user: User = Depends(get_current_user),
):
    """Verify user has admin access"""
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="يتطلب دخول المسؤول المنصة الإدارية"
        )
    return current_user


# ═══════════════════════════════════════════════════════════
# ENDPOINT 1: Get Security Events
# ═══════════════════════════════════════════════════════════

@router.get("/security/events", response_model=SecurityDashboardResponse)
async def get_security_events(
    days: int = Query(7, ge=1, le=90),
    event_type: str = Query("all"),
    admin: User = Depends(verify_admin_access),
    db: AsyncSession = Depends(get_db)
):
    """
    Get security events for dashboard
    
    Args:
        days: Number of days to retrieve (1-90)
        event_type: Filter by event type or 'all'
    """
    
    since = datetime.utcnow() - timedelta(days=days)
    
    # Build query
    query = text("""
        SELECT id, ip_address, user_id, event_type, details, created_at
        FROM security_logs
        WHERE created_at >= :since
    """)
    
    params = {"since": since}
    
    # Add event type filter if not 'all'
    if event_type != "all":
        query = text("""
            SELECT id, ip_address, user_id, event_type, details, created_at
            FROM security_logs
            WHERE created_at >= :since AND event_type = :event_type
            ORDER BY created_at DESC
            LIMIT 1000
        """)
        params["event_type"] = event_type
    else:
        query = text("""
            SELECT id, ip_address, user_id, event_type, details, created_at
            FROM security_logs
            WHERE created_at >= :since
            ORDER BY created_at DESC
            LIMIT 1000
        """)
    
    # Execute query
    result = await db.execute(query, params)
    events_data = result.fetchall()
    
    # Format events
    events = [
        SecurityEventResponse(
            id=row[0],
            ip_address=row[1] or "unknown",
            user_id=row[2] or "system",
            event_type=row[3],
            details=row[4] or "",
            created_at=row[5]
        )
        for row in events_data
    ]
    
    # Get statistics
    stats_query = text("""
        SELECT
            COUNT(*) as total_events,
            SUM(CASE WHEN event_type = 'device_verified' THEN 1 ELSE 0 END) as device_verified,
            SUM(CASE WHEN event_type = 'failed_otp' THEN 1 ELSE 0 END) as failed_otp,
            SUM(CASE WHEN event_type = 'unauthorized_reported' THEN 1 ELSE 0 END) as unauthorized_reported,
            SUM(CASE WHEN created_at >= :last_24h THEN 1 ELSE 0 END) as last_24h
        FROM security_logs
        WHERE created_at >= :since
    """)
    
    stats_params = {
        "since": since,
        "last_24h": datetime.utcnow() - timedelta(hours=24)
    }
    
    stats_result = await db.execute(stats_query, stats_params)
    stats_row = stats_result.fetchone()
    
    stats = SecurityStatsResponse(
        total_events=stats_row[0] or 0,
        device_verified=stats_row[1] or 0,
        failed_otp=stats_row[2] or 0,
        unauthorized_reported=stats_row[3] or 0,
        last_24h=stats_row[4] or 0
    )
    
    return SecurityDashboardResponse(events=events, stats=stats)


# ═══════════════════════════════════════════════════════════
# ENDPOINT 2: Export Security Logs
# ═══════════════════════════════════════════════════════════

@router.get("/security/export")
async def export_security_logs(
    days: int = Query(7, ge=1, le=90),
    admin: User = Depends(verify_admin_access),
    db: AsyncSession = Depends(get_db)
):
    """
    Export security logs as CSV file
    
    Args:
        days: Number of days to export (1-90)
    """
    
    since = datetime.utcnow() - timedelta(days=days)
    
    # Query logs
    result = await db.execute(
        text("""
            SELECT 
                created_at, event_type, ip_address, user_id, details
            FROM security_logs
            WHERE created_at >= :since
            ORDER BY created_at DESC
        """),
        {"since": since}
    )
    
    logs = result.fetchall()
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'التاريخ والوقت',
        'نوع الحدث',
        'عنوان IP',
        'معرف المستخدم',
        'التفاصيل'
    ])
    
    # Write data
    for log in logs:
        writer.writerow([
            log[0].isoformat() if log[0] else '',
            log[1],
            log[2] or 'unknown',
            log[3] or 'system',
            log[4] or ''
        ])
    
    # Return CSV as file
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=security_logs.csv"}
    )


# ═══════════════════════════════════════════════════════════
# ENDPOINT 3: Get Event Details
# ═══════════════════════════════════════════════════════════

@router.get("/security/events/{event_id}")
async def get_event_details(
    event_id: int,
    admin: User = Depends(verify_admin_access),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed information about a specific security event"""
    
    result = await db.execute(
        text("""
            SELECT id, ip_address, user_id, event_type, details, created_at
            FROM security_logs
            WHERE id = :event_id
        """),
        {"event_id": event_id}
    )
    
    event = result.fetchone()
    
    if not event:
        raise HTTPException(status_code=404, detail="الحدث غير موجود")
    
    return SecurityEventResponse(
        id=event[0],
        ip_address=event[1] or "unknown",
        user_id=event[2] or "system",
        event_type=event[3],
        details=event[4] or "",
        created_at=event[5]
    )


# ═══════════════════════════════════════════════════════════
# ENDPOINT 4: Get User Activity
# ═══════════════════════════════════════════════════════════

@router.get("/security/user/{user_id}")
async def get_user_security_activity(
    user_id: str,
    days: int = Query(30, ge=1, le=90),
    admin: User = Depends(verify_admin_access),
    db: AsyncSession = Depends(get_db)
):
    """Get security activity for a specific user"""
    
    since = datetime.utcnow() - timedelta(days=days)
    
    result = await db.execute(
        text("""
            SELECT 
                event_type, COUNT(*) as count,
                MAX(created_at) as last_occurrence
            FROM security_logs
            WHERE user_id = :user_id AND created_at >= :since
            GROUP BY event_type
            ORDER BY last_occurrence DESC
        """),
        {"user_id": user_id, "since": since}
    )
    
    events = result.fetchall()
    
    return {
        "user_id": user_id,
        "period_days": days,
        "events": [
            {
                "event_type": event[0],
                "count": event[1],
                "last_occurrence": event[2]
            }
            for event in events
        ]
    }


# ═══════════════════════════════════════════════════════════
# ENDPOINT 5: Get IP Activity
# ═══════════════════════════════════════════════════════════

@router.get("/security/ip/{ip_address}")
async def get_ip_security_activity(
    ip_address: str,
    days: int = Query(30, ge=1, le=90),
    admin: User = Depends(verify_admin_access),
    db: AsyncSession = Depends(get_db)
):
    """Get security activity from a specific IP address"""
    
    since = datetime.utcnow() - timedelta(days=days)
    
    result = await db.execute(
        text("""
            SELECT 
                event_type, user_id, COUNT(*) as count,
                MAX(created_at) as last_occurrence
            FROM security_logs
            WHERE ip_address = :ip AND created_at >= :since
            GROUP BY event_type, user_id
            ORDER BY last_occurrence DESC
        """),
        {"ip": ip_address, "since": since}
    )
    
    events = result.fetchall()
    
    return {
        "ip_address": ip_address,
        "period_days": days,
        "total_events": len(events),
        "events": [
            {
                "event_type": event[0],
                "user_id": event[1],
                "count": event[2],
                "last_occurrence": event[3]
            }
            for event in events
        ]
    }


# ═══════════════════════════════════════════════════════════
# ENDPOINT 6: Clear Old Logs
# ═══════════════════════════════════════════════════════════

@router.post("/security/cleanup-old-logs")
async def cleanup_old_logs(
    days_to_keep: int = Query(90, ge=30, le=365),
    admin: User = Depends(verify_admin_access),
    db: AsyncSession = Depends(get_db)
):
    """Delete security logs older than specified days"""
    
    cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
    
    result = await db.execute(
        text("""
            DELETE FROM security_logs
            WHERE created_at < :cutoff
            RETURNING id
        """),
        {"cutoff": cutoff_date}
    )
    
    deleted_count = len(result.fetchall())
    await db.commit()
    
    return {
        "message": "تم تنظيف السجلات القديمة بنجاح",
        "deleted_count": deleted_count,
        "kept_logs": f"آخر {days_to_keep} يوم"
    }
