"""
Multi-tenant utilities for organization-based data isolation.
"""
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.user import User
from app.database import get_db
from app.utils.security import get_current_active_user


# Tenant context - stores the current tenant ID for the request
_tenant_context: Optional[str] = None


def get_current_tenant_id() -> Optional[str]:
    """
    Get the current tenant ID from context.
    Returns None for admin users who can access all tenants.
    """
    return _tenant_context


def set_current_tenant_id(tenant_id: Optional[str]):
    """Set the current tenant ID in context."""
    global _tenant_context
    _tenant_context = tenant_id


def clear_tenant_context():
    """Clear the tenant context after request."""
    global _tenant_context
    _tenant_context = None


class TenantMixin:
    """
    Mixin class to add tenant isolation to SQLAlchemy models.
    Add tenant_id column to models that need multi-tenant isolation.
    """
    
    @classmethod
    async def get_by_id(cls, db: AsyncSession, id: str, tenant_id: Optional[str] = None):
        """Get a record by ID with tenant filtering."""
        query = select(cls).where(cls.id == id)
        
        # Apply tenant filter for non-admin users
        if tenant_id and hasattr(cls, 'tenant_id'):
            query = query.where(cls.tenant_id == tenant_id)
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    @classmethod
    async def get_all(
        cls, 
        db: AsyncSession, 
        tenant_id: Optional[str] = None,
        skip: int = 0, 
        limit: int = 100
    ):
        """Get all records with optional tenant filtering."""
        query = select(cls)
        
        # Apply tenant filter
        if tenant_id and hasattr(cls, 'tenant_id'):
            query = query.where(cls.tenant_id == tenant_id)
        
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()


async def get_tenant_from_user(
    current_user: User = Depends(get_current_active_user)
) -> Optional[str]:
    """
    Dependency to extract tenant ID from current user.
    Returns None for admin users (they can access all tenants).
    """
    if current_user.role == "ADMIN":
        return None
    return current_user.organization_owner_id or current_user.id


async def require_tenant_access(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> str:
    """
    Dependency to ensure user has tenant access.
    Returns the tenant ID that should be used for data filtering.
    
    For ADMIN: returns None (can access all)
    For LAWYER/CLIENT: returns their organization_owner_id or their own ID
    """
    if current_user.role == "ADMIN":
        return None
    
    # For team members, use the organization's owner ID
    tenant_id = current_user.organization_owner_id or current_user.id
    
    # Verify the organization still exists
    if current_user.organization_owner_id:
        result = await db.execute(
            select(User).where(
                and_(
                    User.id == current_user.organization_owner_id,
                    User.role == "ADMIN"
                )
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Organization not found"
            )
    
    return tenant_id


class TenantFilter:
    """
    Helper class to add tenant filtering to queries.
    """
    
    @staticmethod
    def apply(query, tenant_id: Optional[str], model_class):
        """Apply tenant filter to a query if the model has tenant_id."""
        if tenant_id and hasattr(model_class, 'tenant_id'):
            return query.where(model_class.tenant_id == tenant_id)
        return query
    
    @staticmethod
    def get_user_tenant_ids(db: AsyncSession, user_id: str) -> List[str]:
        """
        Get all tenant IDs a user has access to.
        Includes the user's own ID and any organizations they belong to.
        """
        from sqlalchemy import or_
        
        result = await db.execute(
            select(User.id).where(
                or_(
                    User.id == user_id,
                    User.organization_owner_id == user_id
                )
            )
        )
        return [row[0] for row in result.fetchall()]

