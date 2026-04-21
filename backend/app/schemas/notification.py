"""
Pydantic schemas for notification operations.
"""
from datetime import datetime
from typing import Optional, List, Any, Union
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class NotificationBase(BaseModel):
    """Base notification schema."""
    type: str = Field(...)
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
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    id: Union[str, UUID]
    user_id: Union[str, UUID]
    type: str
    title: str
    message: str
    read: bool
    link: Optional[str] = None
    metadata: dict = Field(default={}, validation_alias="extra_data")
    created_at: datetime


class NotificationListResponse(BaseModel):
    """Schema for notification list response."""
    notifications: List[NotificationResponse]
    total: int
    unread_count: int


class MarkAllReadResponse(BaseModel):
    """Schema for marking all notifications as read."""
    updated_count: int

