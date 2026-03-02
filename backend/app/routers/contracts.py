"""
Contract management routes.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from app.database import get_db
from app.models.user import User
from app.models.contract import Contract
from app.schemas.contract import (
    ContractCreate,
    ContractUpdate,
    ContractResponse,
    ContractListResponse,
)
from app.utils.security import get_current_active_user


router = APIRouter(prefix="/contracts", tags=["Contracts"])


@router.get("", response_model=ContractListResponse)
async def list_contracts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List contracts for the current user/organization."""
    tenant_id = None
    if current_user.role != "ADMIN":
        tenant_id = current_user.organization_owner_id or current_user.id
    
    query = select(Contract)
    
    if tenant_id:
        query = query.where(
            or_(
                Contract.tenant_id == tenant_id,
                Contract.user_id == current_user.id
            )
        )
    
    if search:
        query = query.where(
            or_(
                Contract.title.ilike(f"%{search}%"),
                Contract.parties.ilike(f"%{search}%")
            )
        )
    
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Contract.date_created.desc())
    
    result = await db.execute(query)
    contracts = result.scalars().all()
    
    return ContractListResponse(
        contracts=[ContractResponse.model_validate(c) for c in contracts],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(
    contract_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific contract by ID."""
    result = await db.execute(select(Contract).where(Contract.id == contract_id))
    contract = result.scalar_one_or_none()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    return ContractResponse.model_validate(contract)


@router.post("", response_model=ContractResponse)
async def create_contract(
    contract_data: ContractCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new contract."""
    tenant_id = current_user.organization_owner_id or current_user.id
    
    contract = Contract(
        title=contract_data.title,
        type=contract_data.type,
        parties=contract_data.parties,
        content=contract_data.content,
        user_id=current_user.id,
        tenant_id=tenant_id
    )
    
    db.add(contract)
    await db.commit()
    await db.refresh(contract)
    
    return ContractResponse.model_validate(contract)


@router.patch("/{contract_id}", response_model=ContractResponse)
async def update_contract(
    contract_id: str,
    contract_update: ContractUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a contract."""
    result = await db.execute(select(Contract).where(Contract.id == contract_id))
    contract = result.scalar_one_or_none()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    update_data = contract_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contract, field, value)
    
    await db.commit()
    await db.refresh(contract)
    
    return ContractResponse.model_validate(contract)


@router.delete("/{contract_id}")
async def delete_contract(
    contract_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a contract."""
    result = await db.execute(select(Contract).where(Contract.id == contract_id))
    contract = result.scalar_one_or_none()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    await db.delete(contract)
    await db.commit()
    
    return {"message": "Contract deleted successfully"}

