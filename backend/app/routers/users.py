"""
User management routes.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_

from app.database import get_db
from app.models.user import User, UserRole
from app.models.tenant import TeamInvite
from app.schemas.user import (
    UserUpdate,
    UserUpdateByAdmin,
    UserResponse,
    UserListResponse,
    ChangePasswordRequest,
    UpdatePlanRequest,
)
from app.schemas.auth import Token
from app.utils.security import (
    get_current_user,
    get_current_active_user,
    verify_password,
    get_password_hash,
    create_token_pair,
    require_role,
)
from app.utils.tenants import require_tenant_access


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """
    List all users (admin only).
    """
    query = select(User)
    
    # Apply filters
    if role:
        query = query.where(User.role == role)
    if search:
        query = query.where(
            or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )
    
    # Exclude admin users from regular listing
    query = query.where(User.role != UserRole.ADMIN.value)
    
    # Get total count
    from sqlalchemy import func
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(User.created_at.desc())
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return UserListResponse(
        users=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/team", response_model=List[UserResponse])
async def list_team_members(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_tenant_access)
):
    """
    List team members for the current user's organization.
    """
    if current_user.role == "ADMIN":
        # Admins see all users in their org
        query = select(User).where(
            or_(
                User.id == current_user.id,
                User.organization_owner_id == current_user.id
            )
        )
    else:
        # Team members see org members
        query = select(User).where(
            or_(
                User.id == current_user.id,
                User.organization_owner_id == current_user.organization_owner_id
            )
        )
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return [UserResponse.model_validate(u) for u in users]


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get user by ID.
    """
    # Users can view their own profile or admins can view any user
    if current_user.id != user_id and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user"
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.model_validate(user)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update user profile.
    """
    # Users can update their own profile or admins can update any user
    if current_user.id != user_id and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user"
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """
    Delete a user (admin only).
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.role == UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete admin users"
        )
    
    await db.delete(user)
    await db.commit()
    
    return {"message": "User deleted successfully"}


@router.patch("/{user_id}/plan", response_model=UserResponse)
async def update_user_plan(
    user_id: str,
    request: UpdatePlanRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """
    Update user's subscription plan (admin only).
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.subscription_plan = request.plan
    user.subscription_status = "active"
    
    await db.commit()
    await db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Change user password.
    """
    if not verify_password(request.current_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    current_user.password = get_password_hash(request.new_password)
    await db.commit()
    
    return {"message": "Password changed successfully"}


# Team invitation routes
@router.post("/invite")
async def invite_team_member(
    email: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """
    Invite a team member to the organization (admin only).
    """
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Check for existing pending invite
    invite_result = await db.execute(
        select(TeamInvite).where(
            and_(
                TeamInvite.email == email,
                TeamInvite.owner_id == current_user.id,
                TeamInvite.status == "pending"
            )
        )
    )
    if invite_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation already sent to this email"
        )
    
    # Create invite token
    import secrets
    token = secrets.token_urlsafe(32)
    
    from datetime import datetime, timedelta
    expires_at = datetime.utcnow() + timedelta(days=7)
    
    invite = TeamInvite(
        owner_id=current_user.id,
        email=email,
        token=token,
        expires_at=expires_at
    )
    
    db.add(invite)
    await db.commit()
    
    # TODO: Send invitation email
    
    return {
        "message": "Invitation sent",
        "token": token  # In production, don't return token, send via email
    }

