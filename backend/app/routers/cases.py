"""
Case management routes.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from app.database import get_db
from app.models.user import User
from app.models.case import Case
from app.schemas.case import (
    CaseCreate,
    CaseUpdate,
    CaseResponse,
    CaseListResponse,
)
from app.utils.security import get_current_active_user
from app.utils.tenants import require_tenant_access


router = APIRouter(prefix="/cases", tags=["Cases"])


@router.get("", response_model=CaseListResponse)
async def list_cases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    case_status: Optional[str] = None,
    case_type: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List cases for the current user/organization."""
    tenant_id = None
    if current_user.role != "ADMIN":
        tenant_id = current_user.organization_owner_id or current_user.id
    
    query = select(Case)
    
    if tenant_id:
        query = query.where(
            or_(
                Case.tenant_id == tenant_id,
                Case.user_id == str(current_user.id)
            )
        )
    
    if current_user.role == "CLIENT":
        query = query.where(Case.user_id == str(current_user.id))
    elif current_user.role == "LAWYER":
        query = query.where(
            or_(
                Case.created_by_user_id == str(current_user.id),
                Case.assigned_to_user_id == str(current_user.id)
            )
        )
    
    if case_status:
        query = query.where(Case.status == case_status)
    if case_type:
        query = query.where(Case.type == case_type)
    if search:
        query = query.where(
            or_(
                Case.title.ilike(f"%{search}%"),
                Case.client_name.ilike(f"%{search}%")
            )
        )
    
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Case.date_created.desc())
    
    result = await db.execute(query)
    cases = result.scalars().all()
    
    return CaseListResponse(
        cases=[CaseResponse.model_validate(c) for c in cases],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific case by ID."""
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if current_user.role == "CLIENT" and case.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return CaseResponse.model_validate(case)


@router.post("", response_model=CaseResponse)
async def create_case(
    case_data: CaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new case and notify the user."""
    from app.models.notification import Notification
    
    tenant_id = current_user.organization_owner_id or current_user.id
    
    case = Case(
        title=case_data.title,
        client_name=case_data.client_name,
        type=case_data.type,
        status=case_data.status or "pending",
        description=case_data.description,
        user_id=current_user.id,
        created_by_user_id=current_user.id,
        tenant_id=tenant_id
    )
    
    db.add(case)
    
    # Create notification
    notification = Notification(
        user_id=current_user.id,
        type="case",
        title="قضية جديدة",
        message=f"تم إنشاء ملف قضية جديد بنجاح: {case.title}",
        link=f"/cases"
    )
    db.add(notification)
    
    await db.commit()
    await db.refresh(case)
    
    return CaseResponse.model_validate(case)


@router.patch("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: str,
    case_update: CaseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a case and notify if status changed."""
    from app.models.notification import Notification
    
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if current_user.role == "CLIENT" and case.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    old_status = case.status
    update_data = case_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(case, field, value)
    
    # If status changed, create notification
    if "status" in update_data and update_data["status"] != old_status:
        status_map = {
            "active": "نشطة",
            "pending": "بانتظار الإجراء",
            "closed": "منتهية"
        }
        new_status_ar = status_map.get(update_data["status"], update_data["status"])
        
        notification = Notification(
            user_id=case.user_id,
            type="info",
            title="تحديث حالة القضة",
            message=f"تمت تحديث حالة القضية '{case.title}' إلى {new_status_ar}",
            link=f"/cases"
        )
        db.add(notification)
    
    await db.commit()
    await db.refresh(case)
    
    return CaseResponse.model_validate(case)


@router.delete("/{case_id}")
async def delete_case(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a case."""
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if current_user.role not in ["ADMIN", "LAWYER"] and case.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.delete(case)
    await db.commit()
    
    return {"message": "Case deleted successfully"}

