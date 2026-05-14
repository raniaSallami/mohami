"""
Device Security Endpoints - New Device Verification & Management
POST /device/verify-otp
POST /device/confirm
POST /device/report-unauthorized
POST /device/logout-all
GET /device/trusted-list
DELETE /device/{device_id}
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, text

from app.database import get_db
from app.models.user import User, KnownDevice
from app.utils.security import get_current_user, create_token_pair
from app.utils.device_security import (
    get_location_from_ip,
    parse_device_name,
    save_known_device,
    get_client_ip,
)
from app.utils.email_localization import get_user_lang, get_email_template

router = APIRouter(prefix="/device-security", tags=["Device Security"])

# ═══════════════════════════════════════════════════════════
# IP & DEVICE SECURITY (Frontend Migration Compatibility)
# ═══════════════════════════════════════════════════════════

class VerifyIPRequest(BaseModel):
    ip: str

@router.post("/verify-ip")
async def verify_ip(request: VerifyIPRequest, current_user: User = Depends(get_current_user)):
    """Mock endpoint to verify if an IP is trusted."""
    return {"verified": True}

class TrustIPRequest(BaseModel):
    ip: str
    label: str = None

@router.post("/trust-ip")
async def trust_ip(request: TrustIPRequest, current_user: User = Depends(get_current_user)):
    """Mock endpoint to trust an IP."""
    return {"message": "IP trusted."}

class UntrustIPRequest(BaseModel):
    ip: str

@router.delete("/untrust-ip")
async def untrust_ip(request: UntrustIPRequest, current_user: User = Depends(get_current_user)):
    """Mock endpoint to untrust an IP."""
    return {"message": "IP removed."}

@router.get("/trusted-ips")
async def get_trusted_ips(current_user: User = Depends(get_current_user)):
    """Mock endpoint to get trusted IPs list."""
    return {"trusted_ips": []}

@router.post("/create-ip-otp")
async def create_ip_otp(request: UntrustIPRequest, current_user: User = Depends(get_current_user)):
    """Mock endpoint to trigger IP OTP creation."""
    return {"message": "OTP created"}


# ═══════════════════════════════════════════════════════════
# REQUEST/RESPONSE SCHEMAS
# ═══════════════════════════════════════════════════════════

class VerifyOTPRequest(BaseModel):
    """Verify OTP for new device confirmation"""
    user_id: str
    otp: str
    fingerprint: str


class VerifyOTPResponse(BaseModel):
    message: str
    tokens: dict = None


class ConfirmDeviceRequest(BaseModel):
    """Confirm and trust new device"""
    user_id: str
    fingerprint: str
    device_name: str = None


class ReportUnauthorizedRequest(BaseModel):
    """Report suspicious activity"""
    user_id: str
    logout_all_devices: bool = True
    force_password_reset: bool = True


class TrustedDeviceResponse(BaseModel):
    device_id: str
    device_name: str
    ip_address: str
    country: str
    city: str
    last_seen: datetime


class ResendOTPRequest(BaseModel):
    user_id: str


# ═══════════════════════════════════════════════════════════
# ENDPOINT 1: Verify OTP (after clicking confirm button in email)
# ═══════════════════════════════════════════════════════════

@router.post("/resend-otp")
async def resend_new_device_otp(
    request: ResendOTPRequest,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Resend OTP email for new device verification.
    """
    result = await db.execute(select(User).where(User.id == request.user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود.")
        
    # Import locally to avoid circular import since auth imports from device_security
    from app.routers.auth import _create_and_send_device_otp
    await _create_and_send_device_otp(user, req, db)
    
    return {"message": "تم إرسال رمز التحقق الجديد بنجاح."}

@router.post("/verify-otp", response_model=VerifyOTPResponse)
async def verify_new_device_otp(
    request: VerifyOTPRequest,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify OTP for new device detection flow.
    
    Flow:
    1. User receives email with new device login alert
    2. Clicks 'This is me' button → sent to frontend OTP verification
    3. Frontend calls this endpoint with OTP
    4. If valid → device is marked as trusted
    """
    
    # Get the OTP record
    result = await db.execute(
        text("""
            SELECT otp, expires_at FROM login_email_otp
            WHERE user_id = :user_id
            ORDER BY created_at DESC LIMIT 1
        """),
        {"user_id": request.user_id}
    )
    otp_row = result.fetchone()
    
    if not otp_row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="لم يتم العثور على رمز تحقق. يرجى إعادة محاولة تسجيل الدخول."
        )
    
    otp_value, expires_at = otp_row
    
    # Check if OTP expired
    if datetime.utcnow() > expires_at:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد."
        )
    
    # Check if OTP matches
    if request.otp != otp_value:
        # Log failed OTP attempt
        await db.execute(
            text("""
                INSERT INTO security_logs (ip_address, event_type, details, created_at)
                VALUES (:ip, 'failed_otp', :details, :now)
            """),
            {
                "ip": get_client_ip(req),
                "details": f"Failed OTP verification for user: {request.user_id}",
                "now": datetime.utcnow()
            }
        )
        await db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="رمز التحقق غير صحيح."
        )
    
    # OTP valid → Mark device as trusted
    result = await db.execute(select(User).where(User.id == request.user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود.")
    
    # Save as known device
    await save_known_device(request.user_id, request.fingerprint, req, db)
    
    # Delete OTP after successful verification
    await db.execute(
        text("DELETE FROM login_email_otp WHERE user_id = :user_id"),
        {"user_id": request.user_id}
    )
    
    # Log successful verification
    await db.execute(
        text("""
            INSERT INTO security_logs (ip_address, event_type, details, created_at)
            VALUES (:ip, 'device_verified', :details, :now)
        """),
        {
            "ip": get_client_ip(req),
            "details": f"Device verified via OTP for user: {request.user_id}",
            "now": datetime.utcnow()
        }
    )
    await db.commit()
    
    # Generate tokens for successful login
    tokens = create_token_pair(str(user.id), user.email, user.role)
    
    # Send confirmation email
    try:
        lang = get_user_lang(req, user)
        device_name = parse_device_name(req.headers.get("User-Agent", ""))
        now_dt = datetime.utcnow()
        now_str = f"{now_dt.strftime('%d/%m/%Y')} {'à' if lang == 'fr' else 'الساعة'} {now_dt.strftime('%H:%M')}"
        template_fn = get_email_template("device_confirmed_alert", lang)
        if not template_fn:
            template_fn = get_email_template("device_confirmed_alert", "ar")
        subject, html_content = template_fn(
            user_name=user.name,
            device_name=device_name,
            confirmation_time=now_str
        )
        await db.execute(
            text("""
                INSERT INTO email_queue (id, to_email, subject, html_content, text_content, status, created_at)
                VALUES (:id, :to_email, :subject, :html_content, :text_content, 'pending', :now)
            """),
            {
                "id": f"device_confirmed_{datetime.utcnow().timestamp()}",
                "to_email": user.email,
                "subject": subject,
                "html_content": html_content,
                "text_content": f"تم تأكيد الجهاز: {device_name}",
                "now": datetime.utcnow()
            }
        )
        await db.commit()
    except Exception as e:
        print(f"Warning: Could not send confirmation email: {e}")
    
    return VerifyOTPResponse(
        message="تم التحقق من الجهاز بنجاح. يمكنك الآن الوصول إلى حسابك.",
        tokens=tokens
    )


# ═══════════════════════════════════════════════════════════
# ENDPOINT 2: Confirm Device (Manual confirmation)
# ═══════════════════════════════════════════════════════════

@router.post("/confirm", response_model=dict)
async def confirm_device(
    request: ConfirmDeviceRequest,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Manually confirm and trust a new device.
    Called when user clicks 'This is me' before OTP step.
    """
    
    result = await db.execute(select(User).where(User.id == request.user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود.")
    
    # Save device as trusted
    await save_known_device(request.user_id, request.fingerprint, req, db)
    
    # Log device confirmation
    await db.execute(
        text("""
            INSERT INTO security_logs (ip_address, event_type, details, created_at)
            VALUES (:ip, 'device_confirmed', :details, :now)
        """),
        {
            "ip": get_client_ip(req),
            "details": f"Device manually confirmed for user: {request.user_id}",
            "now": datetime.utcnow()
        }
    )
    await db.commit()
    
    return {"message": "تم تأكيد الجهاز بنجاح."}


# ═══════════════════════════════════════════════════════════
# ENDPOINT 3: Report Unauthorized Access
# ═══════════════════════════════════════════════════════════

@router.post("/report-unauthorized")
async def report_unauthorized_access(
    request: ReportUnauthorizedRequest,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Report suspicious activity and take immediate security measures.
    
    Actions:
    1. Block the suspicious login attempt
    2. Invalidate all active sessions (if requested)
    3. Force password reset (if requested)
    4. Log security incident
    5. Send alert email
    """
    
    result = await db.execute(select(User).where(User.id == request.user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود.")
    
    ip = get_client_ip(req)
    location = await get_location_from_ip(ip)
    device_name = parse_device_name(req.headers.get("User-Agent", ""))
    now_str = datetime.utcnow().strftime("%d/%m/%Y الساعة %H:%M")
    
    # Log the security incident
    await db.execute(
        text("""
            INSERT INTO security_logs (ip_address, event_type, details, created_at)
            VALUES (:ip, 'unauthorized_reported', :details, :now)
        """),
        {
            "ip": ip,
            "details": f"User {request.user_id} reported unauthorized access from {device_name}",
            "now": datetime.utcnow()
        }
    )
    
    # Logout from all devices if requested
    if request.logout_all_devices:
        # Mark all refresh tokens as invalid (assuming you have this mechanism)
        await db.execute(
            text("""
                DELETE FROM refresh_tokens
                WHERE user_id = :user_id
            """),
            {"user_id": request.user_id}
        )
    
    # Force password reset if requested
    if request.force_password_reset:
        user.password_reset_required = True
        db.add(user)
    
    await db.commit()
    
    # Send alert email  
    try:
        lang = get_user_lang(req, user)
        template_fn = get_email_template("suspicious_activity_alert", lang)
        if not template_fn:
            template_fn = get_email_template("suspicious_activity_alert", "ar")
        subject, html_content = template_fn(
            user_name=user.name,
            device_name=device_name,
            ip_address=ip,
            city=location.get("city", "Unknown"),
            country=location.get("country", "Unknown"),
            detection_time=now_str,
            immediate_actions_link="https://mouhami-ai.tn/settings/security"
        )
        
        await db.execute(
            text("""
                INSERT INTO email_queue (id, to_email, subject, html_content, text_content, status, created_at)
                VALUES (:id, :to_email, :subject, :html_content, :text_content, 'pending', :now)
            """),
            {
                "id": f"fraud_alert_{datetime.utcnow().timestamp()}",
                "to_email": user.email,
                "subject": subject,
                "html_content": html_content,
                "text_content": f"تنبيه: نشاط مريب من {device_name} في {ip}",
                "now": datetime.utcnow()
            }
        )
        await db.commit()
    except Exception as e:
        print(f"Warning: Could not send alert email: {e}")
    
    return {
        "message": "تم تسجيل التقرير بنجاح. تم اتخاذ إجراءات أمنية فورية.",
        "actions_taken": {
            "logout_all_devices": request.logout_all_devices,
            "password_reset_required": request.force_password_reset
        }
    }


# ═══════════════════════════════════════════════════════════
# ENDPOINT 4: Get Trusted Devices List
# ═══════════════════════════════════════════════════════════

@router.get("/trusted-devices", response_model=list[TrustedDeviceResponse])
async def get_trusted_devices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all trusted devices for current user.
    """
    
    result = await db.execute(
        select(KnownDevice)
        .where(KnownDevice.user_id == str(current_user.id))
        .order_by(KnownDevice.last_seen.desc())
    )
    devices = result.scalars().all()
    
    return [
        TrustedDeviceResponse(
            device_id=str(device.id),
            device_name=device.device_name,
            ip_address=device.ip_address,
            country=device.country,
            city=device.city,
            last_seen=device.last_seen
        )
        for device in devices
    ]


# ═══════════════════════════════════════════════════════════
# ENDPOINT 5: Remove Trusted Device
# ═══════════════════════════════════════════════════════════

@router.delete("/trusted-devices/{device_id}")
async def remove_trusted_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove a device from trusted list.
    User will need to verify again when logging in from that device.
    """
    
    result = await db.execute(
        select(KnownDevice)
        .where(
            KnownDevice.id == device_id,
            KnownDevice.user_id == str(current_user.id)
        )
    )
    device = result.scalar_one_or_none()
    
    if not device:
        raise HTTPException(status_code=404, detail="الجهاز غير موجود.")
    
    await db.delete(device)
    
    # Log device removal
    await db.execute(
        text("""
            INSERT INTO security_logs (ip_address, event_type, details, created_at)
            VALUES (:ip, 'device_removed', :details, :now)
        """),
        {
            "ip": "system",
            "details": f"Device {device_id} removed by user {current_user.id}",
            "now": datetime.utcnow()
        }
    )
    
    await db.commit()
    
    return {"message": "تم حذف الجهاز بنجاح."}


# ═══════════════════════════════════════════════════════════
# ENDPOINT 6: Logout from All Devices
# ═══════════════════════════════════════════════════════════

@router.post("/logout-all-devices")
async def logout_all_devices(
    current_user: User = Depends(get_current_user),
    req: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Logout user from ALL devices immediately.
    Invalidates all refresh tokens and active sessions.
    """
    
    # Invalidate all refresh tokens
    await db.execute(
        text("""
            DELETE FROM refresh_tokens
            WHERE user_id = :user_id
        """),
        {"user_id": current_user.id}
    )
    
    # Log the action
    await db.execute(
        text("""
            INSERT INTO security_logs (ip_address, event_type, details, created_at)
            VALUES (:ip, 'logout_all_devices', :details, :now)
        """),
        {
            "ip": get_client_ip(req),
            "details": f"User {current_user.id} logged out from all devices",
            "now": datetime.utcnow()
        }
    )
    
    await db.commit()
    
    return {
        "message": "تم تسجيل الخروج من جميع الأجهزة بنجاح.",
        "action": "يرجى تسجيل الدخول مجدداً من جهازك الحالي."
    }
