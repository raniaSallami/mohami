"""
Pydantic schemas for contract operations.
"""
from datetime import datetime
from typing import Optional, List, Union
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class ContractBase(BaseModel):
    """Base contract schema."""
    title: str = Field(..., min_length=1, max_length=500)
    type: str = Field(..., min_length=1, max_length=100)
    parties: str = Field(..., min_length=1, max_length=1000)
    content: str


class ContractCreate(ContractBase):
    """Schema for creating a new contract."""
    pass


class ContractUpdate(BaseModel):
    """Schema for updating contract information."""
    title: Optional[str] = None
    type: Optional[str] = None
    parties: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None


class ContractResponse(BaseModel):
    """Schema for contract response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: Union[str, UUID]
    title: str
    type: str
    parties: str
    content: str
    status: str
    date_created: datetime
    date_updated: Optional[datetime] = None
    user_id: Optional[Union[str, UUID]] = None
    tenant_id: Optional[str] = None


class ContractListResponse(BaseModel):
    """Schema for paginated contract list response."""
    contracts: List[ContractResponse]
    total: int
    page: int
    page_size: int

