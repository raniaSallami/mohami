"""
Pydantic schemas for invoice operations.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class InvoiceBase(BaseModel):
    """Base invoice schema."""
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    amount: float = Field(..., gt=0)
    plan_name: str = Field(..., pattern="^(basic|pro|enterprise)$")


class InvoiceCreate(InvoiceBase):
    """Schema for creating a new invoice."""
    user_id: Optional[str] = None


class InvoiceUpdate(BaseModel):
    """Schema for updating invoice information."""
    status: Optional[str] = None
    receipt_data: Optional[str] = None


class InvoiceResponse(BaseModel):
    """Schema for invoice response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    date: str
    amount: float
    status: str
    plan_name: str
    receipt_data: Optional[str] = None
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class InvoiceListResponse(BaseModel):
    """Schema for paginated invoice list response."""
    invoices: List[InvoiceResponse]
    total: int
    page: int
    page_size: int


class InvoiceApproveRequest(BaseModel):
    """Schema for approving an invoice."""
    pass


class InvoiceRejectRequest(BaseModel):
    """Schema for rejecting an invoice."""
    reason: Optional[str] = None

