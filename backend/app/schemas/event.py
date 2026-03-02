"""
Pydantic schemas for event operations.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class EventBase(BaseModel):
    """Base event schema."""
    title: str = Field(..., min_length=1, max_length=500)
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")  # YYYY-MM-DD
    time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")  # HH:MM
    type: str
    description: Optional[str] = None


class EventCreate(EventBase):
    """Schema for creating a new event."""
    case_id: Optional[str] = None


class EventUpdate(BaseModel):
    """Schema for updating event information."""
    title: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    case_id: Optional[str] = None


class EventResponse(BaseModel):
    """Schema for event response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    title: str
    date: str
    time: Optional[str] = None
    type: str
    description: Optional[str] = None
    reminder_sent: bool = False
    user_id: Optional[str] = None
    case_id: Optional[str] = None
    tenant_id: Optional[str] = None


class EventListResponse(BaseModel):
    """Schema for paginated event list response."""
    events: List[EventResponse]
    total: int
    page: int
    page_size: int

