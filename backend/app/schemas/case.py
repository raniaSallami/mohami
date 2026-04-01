"""
Pydantic schemas for case operations.
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict


# Case schemas
class CaseBase(BaseModel):
    """Base case schema."""
    title: str = Field(..., min_length=1, max_length=500)
    client_name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., pattern="^(civil|criminal|commercial|family|labor|administrative|course|other)$")
    description: Optional[str] = None


class CaseCreate(CaseBase):
    """Schema for creating a new case."""
    status: Optional[str] = "pending"


class CaseUpdate(BaseModel):
    """Schema for updating case information."""
    title: Optional[str] = None
    client_name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    analysis: Optional[str] = None
    documents: Optional[List[dict]] = None
    chat_history: Optional[List[dict]] = None
    assigned_to_user_id: Optional[str] = None


class CaseResponse(BaseModel):
    """Schema for case response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    title: str
    client_name: str
    type: str
    status: str
    description: Optional[str] = None
    analysis: Optional[str] = None
    documents: List[Any] = []
    chat_history: List[Any] = []
    date_created: datetime
    date_updated: Optional[datetime] = None
    user_id: Optional[str] = None
    created_by_user_id: Optional[str] = None
    assigned_to_user_id: Optional[str] = None
    tenant_id: Optional[str] = None


class CaseListResponse(BaseModel):
    """Schema for paginated case list response."""
    cases: List[CaseResponse]
    total: int
    page: int
    page_size: int


class CaseFilter(BaseModel):
    """Schema for filtering cases."""
    status: Optional[str] = None
    type: Optional[str] = None
    user_id: Optional[str] = None
    assigned_to_user_id: Optional[str] = None
    search: Optional[str] = None

