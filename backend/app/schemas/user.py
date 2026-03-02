"""
Pydantic schemas for user operations.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# User schemas
class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    name: str


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=6)
    role: Optional[str] = "CLIENT"
    organization_owner_id: Optional[str] = None


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None


class UserUpdateByAdmin(BaseModel):
    """Schema for admin to update any user."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    subscription_plan: Optional[str] = None
    subscription_status: Optional[str] = None
    avatar: Optional[str] = None
    allowed_ip: Optional[str] = None


class UserResponse(BaseModel):
    """Schema for user response (excludes sensitive data)."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    email: str
    name: str
    role: str
    subscription_plan: str
    subscription_status: str
    avatar: Optional[str] = None
    phone: Optional[str] = None
    allowed_ip: Optional[str] = None
    organization_owner_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class UserListResponse(BaseModel):
    """Schema for paginated user list response."""
    users: List[UserResponse]
    total: int
    page: int
    page_size: int


class ChangePasswordRequest(BaseModel):
    """Schema for changing user password."""
    current_password: str
    new_password: str = Field(..., min_length=6)


class UpdatePlanRequest(BaseModel):
    """Schema for updating user subscription plan."""
    plan: str = Field(..., pattern="^(basic|pro|enterprise)$")

