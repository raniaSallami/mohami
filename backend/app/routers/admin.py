"""
Admin routes for platform management and statistics.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from app.database import get_db
from app.models.user import User, UserRole
from app.models.case import Case
from app.models.contract import Contract
from app.models.invoice import Invoice
from app.models.tenant import PlatformVisitor
from app.utils.security import require_role


router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """Get overall platform statistics (admin only)."""
    # User counts
    users_result = await db.execute(
        select(func.count(User.id)).where(User.role != UserRole.ADMIN.value)
    )
    total_users = users_result.scalar() or 0
    
    lawyers_result = await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.LAWYER.value)
    )
    total_lawyers = lawyers_result.scalar() or 0
    
    # Invoice stats
    pending_result = await db.execute(
        select(func.count(Invoice.id)).where(Invoice.status == "pending")
    )
    pending_invoices = pending_result.scalar() or 0
    
    # Revenue
    revenue_result = await db.execute(
        select(func.sum(Invoice.amount)).where(Invoice.status == "paid")
    )
    total_revenue = float(revenue_result.scalar() or 0)
    
    # Visitor stats
    visitors_result = await db.execute(select(func.count(PlatformVisitor.id)))
    total_visitors = visitors_result.scalar() or 0
    
    unique_result = await db.execute(
        select(func.count(func.distinct(PlatformVisitor.session_id)))
    )
    unique_visitors = unique_result.scalar() or 0
    
    # Case counts
    cases_result = await db.execute(select(func.count(Case.id)))
    total_cases = cases_result.scalar() or 0
    
    # Contract counts
    contracts_result = await db.execute(select(func.count(Contract.id)))
    total_contracts = contracts_result.scalar() or 0
    
    # Plan breakdown
    plan_result = await db.execute(
        select(User.subscription_plan, func.count(User.id))
        .where(User.role != UserRole.ADMIN.value)
        .group_by(User.subscription_plan)
    )
    plan_breakdown = {row[0]: row[1] for row in plan_result.fetchall()}
    
    return {
        "users": {
            "total": total_users,
            "lawyers": total_lawyers
        },
        "pendingInvoices": pending_invoices,
        "visitors": {
            "totalVisits": total_visitors,
            "uniqueVisitors": unique_visitors
        },
        "advancedStats": {
            "revenueTotal": total_revenue,
            "totalCases": total_cases,
            "totalContracts": total_contracts,
            "planBreakdown": plan_breakdown
        }
    }


@router.get("/stats/visitors")
async def get_visitor_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """Get visitor statistics (admin only)."""
    from datetime import datetime, timedelta
    
    now = datetime.utcnow()
    today = now.strftime("%Y-%m-%d")
    week_start = (now - timedelta(days=now.weekday())).strftime("%Y-%m-%d")
    month_start = now.strftime("%Y-%m-01")
    
    # Total
    total_result = await db.execute(select(func.count(PlatformVisitor.id)))
    total = total_result.scalar() or 0
    
    # Unique
    unique_result = await db.execute(
        select(func.count(func.distinct(PlatformVisitor.session_id)))
    )
    unique = unique_result.scalar() or 0
    
    # Today
    today_result = await db.execute(
        select(func.count(PlatformVisitor.id)).where(
            PlatformVisitor.visit_date >= f"{today} 00:00:00"
        )
    )
    today_visits = today_result.scalar() or 0
    
    # This week
    week_result = await db.execute(
        select(func.count(PlatformVisitor.id)).where(
            PlatformVisitor.visit_date >= f"{week_start} 00:00:00"
        )
    )
    week_visits = week_result.scalar() or 0
    
    # This month
    month_result = await db.execute(
        select(func.count(PlatformVisitor.id)).where(
            PlatformVisitor.visit_date >= f"{month_start} 00:00:00"
        )
    )
    month_visits = month_result.scalar() or 0
    
    return {
        "totalVisits": total,
        "uniqueVisitors": unique,
        "visitsToday": today_visits,
        "visitsThisWeek": week_visits,
        "visitsThisMonth": month_visits
    }


@router.get("/stats/visits-chart")
async def get_visits_chart(
    days: int = Query(14, ge=7, le=90),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """Get visits chart data (admin only)."""
    from datetime import datetime, timedelta
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    result = await db.execute(
        text("""
            SELECT SUBSTRING(visit_date, 1, 10) as d, COUNT(*) as c 
            FROM platform_visitors 
            WHERE visit_date >= :start_date
            GROUP BY SUBSTRING(visit_date, 1, 10) 
            ORDER BY d
        """),
        {"start_date": start_date.strftime("%Y-%m-%d")}
    )
    
    # Build map with all dates
    visits_map = {}
    for i in range(days):
        d = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        visits_map[d] = 0
    
    for row in result.fetchall():
        if row[0] in visits_map:
            visits_map[row[0]] = row[1]
    
    return [
        {"date": date, "visits": count}
        for date, count in sorted(visits_map.items())
    ]


@router.get("/stats/registrations-chart")
async def get_registrations_chart(
    months: int = Query(6, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """Get user registrations chart (admin only)."""
    from datetime import datetime, timedelta
    
    # Get all non-admin users
    result = await db.execute(
        select(User.id, User.created_at).where(User.role != UserRole.ADMIN.value)
    )
    
    now = datetime.utcnow()
    month_counts = {}
    
    # Initialize months
    for i in range(months):
        d = datetime(now.year, now.month - i, 1)
        key = d.strftime("%Y-%m")
        month_counts[key] = 0
    
    for row in result.fetchall():
        if row[1]:
            created = row[1] if isinstance(row[1], datetime) else datetime.fromisoformat(str(row[1]))
            key = created.strftime("%Y-%m")
            if key in month_counts:
                month_counts[key] += 1
    
    return [
        {"month": month, "count": count}
        for month, count in sorted(month_counts.items())
    ]


@router.get("/users", response_model=dict)
async def get_all_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """Get all users (admin only)."""
    query = select(User).where(User.role != UserRole.ADMIN.value)
    
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(User.created_at.desc())
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    from app.schemas.user import UserResponse
    return {
        "users": [UserResponse.model_validate(u) for u in users],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.patch("/users/{user_id}")
async def update_user_by_admin(
    user_id: str,
    name: Optional[str] = None,
    email: Optional[str] = None,
    subscription_plan: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """Update user by admin (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        return {"error": "User not found"}, 404
    
    if name:
        user.name = name
    if email:
        user.email = email
    if subscription_plan:
        user.subscription_plan = subscription_plan
    
    await db.commit()
    
    return {"ok": True}


@router.delete("/users/{user_id}")
async def delete_user_by_admin(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """Delete a user (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        return {"error": "User not found"}, 404
    
    if user.role == UserRole.ADMIN.value:
        return {"error": "Cannot delete admin users"}, 400
    
    await db.delete(user)
    await db.commit()
    
    return {"ok": True}

