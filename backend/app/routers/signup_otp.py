"""
Signup Email OTP endpoints.
Handles email verification during registration:
- POST /auth/signup-email-otp  → send OTP to email
- POST /auth/verify-signup-otp → verify OTP
"""

import uuid
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel, EmailStr, Field

from app.database import get_db
from app.utils.device_security import parse_device_name, get_location_from_ip, get_client_ip

router = APIRouter(prefix="/auth", tags=["Signup OTP"])


# ═══════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════

class SignupOTPRequest(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=255)
    recaptcha_token: str = ""


class SignupOTPResponse(BaseModel):
    message: str


class VerifySignupOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class VerifySignupOTPResponse(BaseModel):
    message: str


# ═══════════════════════════════════════════════════════════
# ROUTE 1 — Send signup OTP
# ═══════════════════════════════════════════════════════════

@router.post("/signup-email-otp", response_model=SignupOTPResponse)
async def send_signup_otp(
    request: SignupOTPRequest,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    """Send a 6-digit OTP to the provided email for signup verification."""
    # Optional reCAPTCHA verification
    if request.recaptcha_token:
        from app.utils.security import verify_recaptcha
        if not await verify_recaptcha(request.recaptcha_token):
            raise HTTPException(status_code=400, detail="reCAPTCHA verification failed")

    # Check if email is already registered
    from app.models.user import User
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="البريد الإلكتروني مستخدم بالفعل."
        )

    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Clean up old OTPs for this email
    try:
        await db.execute(
            text("DELETE FROM signup_email_otp WHERE email = :email"),
            {"email": request.email}
        )
    except Exception:
        pass

    await db.execute(
        text("""
            INSERT INTO signup_email_otp (id, email, otp, expires_at, created_at)
            VALUES (:id, :email, :otp, :expires_at, :created_at)
        """),
        {
            "id": str(uuid.uuid4()),
            "email": request.email,
            "otp": otp_code,
            "expires_at": expires_at,
            "created_at": datetime.utcnow(),
        }
    )
    await db.commit()
    print(f"✅ Signup OTP created for {request.email}: {otp_code}")

    # Queue the verification email
    try:
        ip = get_client_ip(req)
        ua = req.headers.get("User-Agent", "") if req else ""
        device_name = parse_device_name(ua)
        now = datetime.utcnow().strftime("%d/%m/%Y - %H:%M UTC")

        html_content = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:40px 20px;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">
<tr><td style="background:linear-gradient(135deg,#1e40af,#1e3a8a);padding:40px;text-align:center;">
<p style="color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 10px 0;">MOUHAMI AI</p>
<h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">تفعيل حسابك الجديد</h1>
</td></tr>
<tr><td style="padding:40px;">
<p style="color:#1e293b;font-size:15px;font-weight:600;margin:0 0 8px 0;">مرحباً {request.name}،</p>
<p style="color:#475569;font-size:14px;line-height:1.8;margin:0 0 28px 0;">
شكراً لتسجيلك في منصة المحامي الذكية. استخدم الرمز أدناه لتأكيد بريدك الإلكتروني.
</p>
<div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
<p style="color:#15803d;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 14px 0;">رمز التحقق</p>
<div style="background:#fff;border:2px dashed #16a34a;border-radius:8px;padding:16px;margin-bottom:14px;">
<span style="font-size:44px;font-weight:800;letter-spacing:10px;color:#1e293b;font-family:'Courier New',monospace;">{otp_code}</span>
</div>
<p style="color:#15803d;font-size:13px;margin:0;font-weight:600;">هذا الرمز صالح لمدة 10 دقائق فقط</p>
</div>
<div style="background:#fef9ec;border-right:4px solid #d97706;border-radius:8px;padding:16px 20px;">
<p style="color:#92400e;font-size:13px;margin:0;font-weight:600;">
إذا لم تكن أنت من طلب إنشاء الحساب، يرجى تجاهل هذا البريد.
</p>
</div>
</td></tr>
<tr><td style="background:#1e293b;padding:20px 40px;text-align:center;">
<p style="color:#94a3b8;font-size:11px;margin:0;">منصة المحامي الذكية &copy; 2026 &middot; <a href="https://mouhami-ai.tn" style="color:#d97706;text-decoration:none;">mouhami-ai.tn</a></p>
</td></tr>
</table></td></tr></table>
</body></html>"""

        await db.execute(
            text("""
                INSERT INTO email_queue (id, to_email, subject, html_content, text_content, status, created_at)
                VALUES (:id, :to_email, :subject, :html_content, :text_content, :status, :created_at)
            """),
            {
                "id": f"signup_{uuid.uuid4()}",
                "to_email": request.email,
                "subject": "تفعيل حسابك — رمز التحقق",
                "html_content": html_content,
                "text_content": f"رمز التحقق لتفعيل حسابك: {otp_code} — صالح 10 دقائق.",
                "status": "pending",
                "created_at": datetime.utcnow(),
            },
        )
        await db.commit()
        print(f"✅ Signup OTP email queued for {request.email}")
    except Exception as e:
        print(f"❌ Failed to queue signup email: {e}")

    return SignupOTPResponse(
        message="تم إرسال رمز التحقق إلى بريدك الإلكتروني."
    )


# ═══════════════════════════════════════════════════════════
# ROUTE 2 — Verify signup OTP
# ═══════════════════════════════════════════════════════════

@router.post("/verify-signup-otp", response_model=VerifySignupOTPResponse)
async def verify_signup_otp(
    request: VerifySignupOTPRequest,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    """Verify the signup OTP code."""
    otp_result = await db.execute(
        text("""
            SELECT otp, expires_at FROM signup_email_otp
            WHERE email = :email
            ORDER BY created_at DESC LIMIT 1
        """),
        {"email": request.email}
    )
    otp_row = otp_result.fetchone()

    if not otp_row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="لم يتم العثور على رمز تحقق. يرجى طلب رمز جديد."
        )

    otp_value, expires_at = otp_row
    if datetime.utcnow() > expires_at:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد."
        )

    if request.otp != otp_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="رمز التحقق غير صحيح."
        )

    # OTP verified — clean up
    await db.execute(
        text("DELETE FROM signup_email_otp WHERE email = :email"),
        {"email": request.email}
    )
    await db.commit()

    return VerifySignupOTPResponse(
        message="تم التحقق بنجاح. يمكنك الآن إنشاء حسابك."
    )
