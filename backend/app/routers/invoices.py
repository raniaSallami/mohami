"""
Invoice management routes.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from app.database import get_db
from app.models.user import User
from app.models.invoice import Invoice
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceResponse,
    InvoiceListResponse,
)
from app.utils.security import get_current_active_user, require_role


router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.get("", response_model=InvoiceListResponse)
async def list_invoices(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List invoices for the current user/organization."""
    query = select(Invoice)
    
    # Apply role-based filtering
    if current_user.role != "ADMIN":
        query = query.where(Invoice.user_id == str(current_user.id))
    
    if status:
        query = query.where(Invoice.status == status)
    
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Invoice.date.desc())
    
    result = await db.execute(query)
    invoices = result.scalars().all()
    
    return InvoiceListResponse(
        invoices=[InvoiceResponse.model_validate(i) for i in invoices],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/pending", response_model=InvoiceListResponse)
async def list_pending_invoices(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """List pending invoices (admin only)."""
    query = select(Invoice).where(Invoice.status == "pending")
    
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Invoice.date.asc())
    
    result = await db.execute(query)
    invoices = result.scalars().all()
    
    return InvoiceListResponse(
        invoices=[InvoiceResponse.model_validate(i) for i in invoices],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific invoice by ID."""
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Check access
    if current_user.role != "ADMIN" and invoice.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return InvoiceResponse.model_validate(invoice)


@router.post("", response_model=InvoiceResponse)
async def create_invoice(
    invoice_data: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """Create a new invoice (admin only)."""
    invoice = Invoice(
        date=invoice_data.date,
        amount=invoice_data.amount,
        plan_name=invoice_data.plan_name,
        user_id=invoice_data.user_id
    )
    
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    
    return InvoiceResponse.model_validate(invoice)


@router.post("/{invoice_id}/approve")
async def approve_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """Approve an invoice (admin only)."""
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    invoice.status = "paid"
    
    # Update user's subscription plan
    if invoice.user_id:
        user_result = await db.execute(select(User).where(User.id == invoice.user_id))
        user = user_result.scalar_one_or_none()
        if user:
            user.subscription_plan = invoice.plan_name
            user.subscription_status = "active"
    
    await db.commit()
    
    return {"message": "Invoice approved"}


@router.post("/{invoice_id}/reject")
async def reject_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """Reject an invoice (admin only)."""
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    invoice.status = "rejected"
    await db.commit()
    
    return {"message": "Invoice rejected"}

