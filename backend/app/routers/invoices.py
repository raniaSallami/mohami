"""
Invoice management routes.
"""
from typing import Optional
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.units import inch
from pathlib import Path

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

def _build_invoice_pdf(invoice: Invoice, user: Optional[User]) -> bytes:
    """Generate a refined premium PDF invoice with a professional layout."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    styles.add(ParagraphStyle(name='NavyTitle', parent=styles['Heading1'], textColor=colors.HexColor('#0F172A'), fontSize=20, spaceAfter=20, leading=24))
    styles.add(ParagraphStyle(name='GoldSubtitle', parent=styles['Normal'], textColor=colors.HexColor('#D4AF37'), fontSize=10, fontName='Helvetica-Bold', spaceAfter=6))
    styles.add(ParagraphStyle(name='NormalGrey', parent=styles['Normal'], textColor=colors.HexColor('#475569'), fontSize=10, leading=14))
    styles.add(ParagraphStyle(name='LabelRight', parent=styles['Normal'], alignment=2, textColor=colors.HexColor('#475569'), fontSize=10))
    styles.add(ParagraphStyle(name='ValueRight', parent=styles['Normal'], alignment=2, textColor=colors.HexColor('#0F172A'), fontSize=11, fontName='Helvetica-Bold'))
    
    elements = []

    # Header Section
    logo_path = Path("assets/logo.png")
    header_data = []
    
    # Brand Text Component
    brand_text = Paragraph("<b>MOUHAMI AI</b><br/><font size=10 color='#64748B'>Plateforme Juridique Intelligente</font>", styles['NavyTitle'])
    
    if logo_path.exists():
        logo = Image(str(logo_path), 0.8*inch, 0.7*inch)
        header_data = [[logo, brand_text]]
    else:
        header_data = [[brand_text]]
        
    header_table = Table(header_data, colWidths=[1*inch, 4.5*inch] if logo_path.exists() else [5.5*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 0.3*inch))

    # Format Date
    try:
        dt_obj = datetime.fromisoformat(invoice.date.replace('Z', '+00:00'))
        formatted_date = dt_obj.strftime("%d/%m/%Y")
    except:
        formatted_date = invoice.date

    # Translate Status
    status_map = {
        "paid": "PAYÉE",
        "pending": "EN ATTENTE",
        "rejected": "REFUSÉE"
    }
    translated_status = status_map.get(invoice.status.lower(), invoice.status.upper())

    # Info Grid (Invoice Details & Bill To)
    details_data = [
        [Paragraph("Facturé à :", styles['GoldSubtitle']), Paragraph("Détails de la facture :", styles['GoldSubtitle'])],
        [
            Paragraph(f"<b>{user.name if user else 'Client'}</b><br/>{user.email if user else ''}", styles['NormalGrey']),
            Paragraph(f"<b>N° Facture :</b> {invoice.id[:8].upper()}<br/><b>Date :</b> {formatted_date}<br/><b>État :</b> {translated_status}", styles['NormalGrey'])
        ]
    ]
    details_table = Table(details_data, colWidths=[3*inch, 3*inch])
    details_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(details_table)
    elements.append(Spacer(1, 0.2*inch))

    # Line Items Table
    plan_display = {
        "basic": "Pack Essentiel (Gratuit)",
        "pro": "Pack Professionnel AI",
        "enterprise": "Pack Cabinet Juridique"
    }
    
    table_data = [
        [Paragraph("<b>Description</b>", styles['Normal']), Paragraph("<b>Qté</b>", styles['Normal']), Paragraph("<b>Prix Unitaire</b>", styles['Normal']), Paragraph("<b>Total</b>", styles['Normal'])],
        [Paragraph(plan_display.get(invoice.plan_name, invoice.plan_name), styles['NormalGrey']), "1", f"{float(invoice.amount):.3f} TND", f"{float(invoice.amount):.3f} TND"]
    ]
    
    items_table = Table(table_data, colWidths=[3.2*inch, 0.6*inch, 1.3*inch, 1.3*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, 0), 0.5, colors.HexColor('#E2E8F0')),
        ('LINEBELOW', (0, 1), (-1, 1), 0.5, colors.HexColor('#F1F5F9')),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 0.2*inch))

    # Summary Section (Right Aligned)
    summary_data = [
        [None, None, Paragraph("Total HT", styles['LabelRight']), Paragraph(f"{float(invoice.amount):.3f} TND", styles['NormalGrey'])],
        [None, None, Paragraph("TVA (0%)", styles['LabelRight']), Paragraph("0.000 TND", styles['NormalGrey'])],
        [None, None, Paragraph("TOTAL À PAYER", styles['LabelRight']), Paragraph(f"{float(invoice.amount):.3f} TND", styles['ValueRight'])]
    ]
    summary_table = Table(summary_data, colWidths=[2.2*inch, 1.2*inch, 1.5*inch, 1.5*inch])
    summary_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('RIGHTPADDING', (-1, 0), (-1, -1), 0),
    ]))
    elements.append(summary_table)
    
    # Footer
    elements.append(Spacer(1, 1.2*inch))
    footer_text = "Si vous avez des questions concernant cette facture, merci de nous contacter à support@mouhami-ai.tn"
    elements.append(Paragraph(footer_text, ParagraphStyle(name='Footer', parent=styles['Normal'], alignment=1, textColor=colors.grey, fontSize=8)))
    elements.append(Paragraph("<b>Merci de votre confiance !</b>", ParagraphStyle(name='Thanks', parent=styles['Normal'], alignment=1, spaceBefore=10, fontSize=11)))

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()


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
        query = query.where(Invoice.user_id == current_user.id)
    
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
    from sqlalchemy.orm import selectinload
    
    query = select(Invoice).where(Invoice.status == "pending").options(selectinload(Invoice.user))
    
    count_query = select(func.count()).select_from(
        select(Invoice).where(Invoice.status == "pending").subquery()
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Invoice.date.asc())
    
    result = await db.execute(query)
    invoices = result.scalars().all()
    
    # Build response with user info
    invoice_responses = []
    for inv in invoices:
        resp = InvoiceResponse.model_validate(inv)
        if inv.user:
            resp.user_name = inv.user.name
            resp.user_email = inv.user.email
        invoice_responses.append(resp)
    
    return InvoiceListResponse(
        invoices=invoice_responses,
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


@router.get("/{invoice_id}/pdf")
async def download_invoice_pdf(
    invoice_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Download invoice as PDF with all payment details."""
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if current_user.role != "ADMIN" and invoice.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    user = None
    if invoice.user_id:
        user_result = await db.execute(select(User).where(User.id == invoice.user_id))
        user = user_result.scalar_one_or_none()

    pdf_content = _build_invoice_pdf(invoice, user)
    filename = f"invoice-{invoice.id}.pdf"
    return StreamingResponse(
        BytesIO(pdf_content),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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


@router.delete("/{invoice_id}")
async def delete_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a specific invoice."""
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Check access - users can only delete their own invoices, admins can delete any
    if current_user.role != "ADMIN" and invoice.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this invoice")
    
    await db.delete(invoice)
    await db.commit()
    
    return {"message": "Invoice deleted successfully"}


@router.delete("")
async def delete_all_invoices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete all invoices for the current user (admin can delete all)."""
    from sqlalchemy import delete
    
    if current_user.role == "ADMIN":
        # Admin can delete all invoices
        delete_stmt = delete(Invoice)
        result = await db.execute(delete_stmt)
        count = result.rowcount
    else:
        # Regular users can only delete their own invoices
        delete_stmt = delete(Invoice).where(Invoice.user_id == current_user.id)
        result = await db.execute(delete_stmt)
        count = result.rowcount
    
    await db.commit()
    
    return {"message": f"Deleted {count} invoice(s) successfully"}

