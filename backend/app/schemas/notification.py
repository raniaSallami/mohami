"""
Pydantic schemas for notification operations.
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict


class NotificationBase(BaseModel):
    """Base notification schema."""
    type: str = Field(..., pattern="^(info|warning|error|success)$")
    title: str = Field(..., min_length=1, max_length=200)
    message: str


class NotificationCreate(NotificationBase):
    """Schema for creating a new notification."""
    user_id: str
    link: Optional[str] = None
    metadata: Optional[dict] = None


class NotificationUpdate(BaseModel):
    """Schema for updating notification."""
    read: Optional[bool] = None


class NotificationResponse(BaseModel):
    """Schema for notification response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    type: str
    title: str
    message: str
    read: bool
    link: Optional[str] = None
    metadata: dict = {}
    created_at: datetime


class NotificationListResponse(BaseModel):
    """Schema for notification list response."""
    notifications: List[NotificationResponse]
    total: int
    unread_count: int


class MarkAllReadResponse(BaseModel):
    """Schema for marking all notifications as read."""
    updated_count: int

