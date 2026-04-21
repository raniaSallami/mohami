"""
Subscriptions router for checkout and payment verification.
"""
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
import uuid

from app.config import settings
from app.database import get_db
from app.models.invoice import Invoice
from app.models.notification import Notification
from app.models.payment_audit import PaymentAuditLog
from app.models.user import User
from app.utils.security import get_current_active_user
from app.utils.email_localization import get_user_lang, get_email_template

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


class SubscriptionCheckoutRequest(BaseModel):
    plan_name: str = Field(..., pattern="^(basic|pro|enterprise)$")
    redirect_base_url: str


class SubscriptionCheckoutResponse(BaseModel):
    orderId: str | None
    formUrl: str | None
    orderNumber: str
    free: bool = False


async def _clictopay_register(order_number: str, amount_minor: int, success_url: str, fail_url: str) -> Dict[str, Any]:
    # Try sending amount as integer (not string)
    payload = {
        "userName": settings.clictopay_user_name,
        "password": settings.clictopay_password,
        "orderNumber": order_number,
        "amount": amount_minor,  # Send as integer (not string)
        "currency": settings.clictopay_currency,
        "returnUrl": success_url,
        "failUrl": fail_url,
        "language": "fr",
    }
    
    # Debug logging
    print(f"DEBUG: ClicToPay payload: {payload}")
    print(f"DEBUG: Amount being sent: {amount_minor} (integer)")
    try:
        async with httpx.AsyncClient(timeout=20.0, verify=False) as client:
            response = await client.post(f"{settings.clictopay_base_url}/register.do", data=payload)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"ClicToPay register connection failed: {exc.__class__.__name__}")
    try:
        data = response.json()
    except Exception:
        raise HTTPException(status_code=502, detail="ClicToPay register returned non-JSON response")
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="ClicToPay register request failed")
    if data.get("errorCode") and data.get("errorCode") != "0":
        # Examples from tests: duplicate order=16, invalid amount=4
        raise HTTPException(status_code=400, detail=f"ClicToPay register error {data.get('errorCode')}: {data.get('errorMessage', 'unknown')}")
    if not data.get("orderId") or not data.get("formUrl"):
        raise HTTPException(status_code=502, detail="ClicToPay register returned invalid response")
    return data


async def _clictopay_status(order_id: str) -> Dict[str, Any]:
    payload = {
        "userName": settings.clictopay_user_name,
        "password": settings.clictopay_password,
        "orderId": order_id,
        "language": "fr",
    }
    try:
        async with httpx.AsyncClient(timeout=20.0, verify=False) as client:
            response = await client.post(f"{settings.clictopay_base_url}/getOrderStatusExtended.do", data=payload)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"ClicToPay status connection failed: {exc.__class__.__name__}")
    try:
        data = response.json()
    except Exception:
        raise HTTPException(status_code=502, detail="ClicToPay status returned non-JSON response")
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="ClicToPay status request failed")
    if data.get("errorCode") and data.get("errorCode") != "0":
        raise HTTPException(status_code=400, detail=f"ClicToPay status error {data.get('errorCode')}: {data.get('errorMessage', 'unknown')}")
    return data


@router.post("/checkout", response_model=SubscriptionCheckoutResponse)
async def checkout_subscription(
    request: SubscriptionCheckoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a subscription invoice and register ClicToPay checkout session."""
    print(f"DEBUG: Checkout request - plan_name: {request.plan_name}, redirect_url: {request.redirect_base_url}")
    
    plan_amounts = {
        "basic": 0.0,
        "pro": 59.0,
        "enterprise": 199.0,
    }
    amount = plan_amounts.get(request.plan_name, 0.0)
    
    # Handle free plan (basic) - no payment processing required
    if amount == 0.0:
        # Create invoice directly for free plan
        invoice = Invoice(
            date=datetime.utcnow().isoformat(),
            amount=0.0,
            plan_name=request.plan_name,
            user_id=current_user.id,
            clictopay_order_id=None,  # No payment gateway for free plan
        )
        db.add(invoice)
        await db.commit()
        await db.refresh(invoice)

        # Update user subscription immediately for free plan
        user_result = await db.execute(select(User).where(User.id == current_user.id))
        user = user_result.scalar_one_or_none()
        if user:
            previous_plan = user.subscription_plan
            user.subscription_plan = invoice.plan_name
            user.subscription_status = "active"
            
            # Log the free subscription activation
            db.add(
                PaymentAuditLog(
                    event_type="subscription_updated",
                    user_id=user.id,
                    order_id=None,
                    details={
                        "invoice_id": invoice.id,
                        "previous_plan": previous_plan,
                        "new_plan": invoice.plan_name,
                        "status": "active",
                        "amount": 0.0,
                        "type": "free_plan"
                    },
                    status="success",
                )
            )
            await db.commit()

            # Send localized success email and notification for free subscription
            try:
                lang = get_user_lang(None)  # Use default or detect from context if possible
                
                notif_title = "Abonnement activé" if lang == "fr" else "تم تفعيل الاشتراك"
                notif_message = "Votre abonnement gratuit a été activé avec succès." if lang == "fr" else "تم تفعيل اشتراكك المجاني بنجاح."
                
                db.add(Notification(
                    user_id=current_user.id,
                    type="success",
                    title=notif_title,
                    message=notif_message,
                    link="/#settings/invoices"
                ))
                await db.commit()
                
                template_func = get_email_template("subscription_success_email", lang)
                if template_func:
                    subject, html_content = template_func(
                        user_name=current_user.name,
                        plan_name=invoice.plan_name,
                        invoice_id=invoice.id
                    )
                    await db.execute(
                        text("""
                            INSERT INTO email_queue (id, to_email, subject, html_content, text_content, status, created_at)
                            VALUES (:id, :to_email, :subject, :html_content, :text_content, :status, :created_at)
                        """),
                        {
                            "id": f"sub_{uuid.uuid4()}",
                            "to_email": current_user.email,
                            "subject": subject,
                            "html_content": html_content,
                            "text_content": f"Votre abonnement {invoice.plan_name} est actif.",
                            "status": "pending",
                            "created_at": datetime.utcnow(),
                        },
                    )
                    await db.commit()
            except Exception as e:
                print(f"❌ Failed to queue subscription email (free): {e}")

        return {
            "orderId": None,
            "formUrl": None,
            "orderNumber": invoice.id,
            "free": True,
        }

    # Process paid plans
    amount_decimal = Decimal(str(amount))
    # Tunisian Dinar (TND) uses 3 decimal places (millimes)
    # 1 TND = 1000 millimes. ClicToPay expects the amount in millimes.
    amount_minor = int((amount_decimal * 1000).to_integral_value()) 
    
    # Debug logging to verify exact amount sent to gateway
    print(f"DEBUG: Checkout - Plan: {request.plan_name}, Amount: {amount} TND, Millimes sent: {amount_minor}")
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid payment amount")

    # Create external order first to avoid local pending invoices when gateway fails.
    # Use timestamp-based numeric order number for ClicToPay compatibility
    timestamp = int(datetime.utcnow().timestamp() * 1000)  # milliseconds since epoch
    local_order_number = str(timestamp)[-12:]  # last 12 digits for reasonable length

    success_url = f"{request.redirect_base_url}/#payment/success"
    fail_url = f"{request.redirect_base_url}/#payment/fail"
    register_result = await _clictopay_register(local_order_number, amount_minor, success_url, fail_url)

    invoice = Invoice(
        date=datetime.utcnow().isoformat(),
        amount=float(f"{amount:.3f}"),  # Ensure exactly 3 decimal places for TND
        plan_name=request.plan_name,
        user_id=current_user.id,
        clictopay_order_id=register_result["orderId"],
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)

    db.add(
        PaymentAuditLog(
            event_type="payment_initiated",
            user_id=current_user.id,
            order_id=invoice.clictopay_order_id,
            details={
                "invoice_id": invoice.id,
                "plan_name": invoice.plan_name,
                "amount": float(invoice.amount),
                "order_number": local_order_number,
            },
            status="pending",
        )
    )
    await db.commit()

    return {
        "orderId": invoice.clictopay_order_id,
        "formUrl": register_result["formUrl"],
        "orderNumber": invoice.id,
        "free": False,
    }


@router.get("/verify")
async def verify_subscription(
    request: Request,
    orderId: str | None = Query(None, alias="orderId"),
    invoiceId: str | None = Query(None, alias="invoiceId"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, str]:
    """Verify payment status via ClicToPay and activate subscription only on status=2."""
    if not orderId and not invoiceId:
        raise HTTPException(status_code=400, detail="orderId or invoiceId is required")

    if orderId:
        result = await db.execute(select(Invoice).where(Invoice.clictopay_order_id == orderId))
    else:
        result = await db.execute(select(Invoice).where(Invoice.id == invoiceId))
    invoice = result.scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail="Order not found")

    if invoice.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to verify this order")

    if not invoice.clictopay_order_id:
        raise HTTPException(status_code=400, detail="Missing ClicToPay order reference")

    orderId = invoice.clictopay_order_id
    status_result = await _clictopay_status(orderId)
    gateway_status = int(status_result.get("orderStatus", -1))

    if gateway_status == 2 and invoice.status != "paid":
        invoice.status = "paid"
        audit_event = PaymentAuditLog(
            event_type="payment_success",
            user_id=current_user.id,
            order_id=invoice.clictopay_order_id,
            details={
                "invoice_id": invoice.id,
                "plan_name": invoice.plan_name,
                "amount": float(invoice.amount),
                "message": "Subscription payment completed successfully",
                "clictopay_order_id": invoice.clictopay_order_id,
            },
            status="success",
        )
        db.add(audit_event)
        if invoice.user_id:
            user_result = await db.execute(select(User).where(User.id == invoice.user_id))
            user = user_result.scalar_one_or_none()
            if user:
                previous_plan = user.subscription_plan
                user.subscription_plan = invoice.plan_name
                user.subscription_status = "active"
                db.add(
                    PaymentAuditLog(
                        event_type="subscription_updated",
                        user_id=user.id,
                        order_id=invoice.clictopay_order_id,
                        details={
                            "invoice_id": invoice.id,
                            "previous_plan": previous_plan,
                            "new_plan": invoice.plan_name,
                            "status": "active",
                        },
                        status="success",
                    )
                )

        await db.commit()

        # Send localized success email and notification
        try:
            lang = get_user_lang(request)
            
            notif_title = "Paiement confirmé avec succès" if lang == "fr" else "تم تأكيد الدفع بنجاح"
            notif_message = (
                "Le paiement a été effectué avec succès ! Vous pouvez consulter et télécharger votre facture depuis les paramètres."
                if lang == "fr"
                else "تمت عملية الدفع بنجاح! يمكنك استشارة وتحميل فاتورتك من الإعدادات."
            )
            
            db.add(Notification(
                user_id=current_user.id,
                type="success",
                title=notif_title,
                message=notif_message,
                link="/#settings/invoices"
            ))
            await db.commit()

            template_func = get_email_template("subscription_success_email", lang)
            if template_func:
                subject, html_content = template_func(
                    user_name=current_user.name,
                    plan_name=invoice.plan_name,
                    invoice_id=invoice.id
                )
                await db.execute(
                    text("""
                        INSERT INTO email_queue (id, to_email, subject, html_content, text_content, status, created_at)
                        VALUES (:id, :to_email, :subject, :html_content, :text_content, :status, :created_at)
                    """),
                    {
                        "id": f"sub_{uuid.uuid4()}",
                        "to_email": current_user.email,
                        "subject": subject,
                        "html_content": html_content,
                        "text_content": f"Votre abonnement {invoice.plan_name} est actif.",
                        "status": "pending",
                        "created_at": datetime.utcnow(),
                    },
                )
                await db.commit()
        except Exception as e:
            print(f"❌ Failed to queue subscription email: {e}")
    elif gateway_status in (3, 6):
        invoice.status = "rejected" if gateway_status == 6 else "cancelled"
        db.add(
            PaymentAuditLog(
                event_type="payment_failed",
                user_id=current_user.id,
                order_id=invoice.clictopay_order_id,
                details={
                    "invoice_id": invoice.id,
                    "order_status": gateway_status,
                    "gateway_response": status_result,
                },
                status="failed",
            )
        )
        await db.commit()
    elif gateway_status == 0:
        # Not paid yet; keep pending.
        pass

    return {
        "orderId": invoice.clictopay_order_id,
        "status": invoice.status,
        "success": "true" if gateway_status == 2 else "false",
        "plan": invoice.plan_name,
        "invoiceId": invoice.id,
        "invoicePdfUrl": f"/api/invoices/{invoice.id}/pdf",
        "gatewayStatus": str(gateway_status),
    }
