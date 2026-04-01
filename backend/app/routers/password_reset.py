"""
FLUX MOT DE PASSE OUBLIÉ
- /auth/forgot-password  → envoie OTP par email
- /auth/verify-reset-otp → vérifie OTP
- /auth/reset-password   → change le mot de passe
"""

import uuid
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from pydantic import BaseModel, EmailStr, Field

from app.database import get_db
from app.models.user import User
from app.utils.security import get_password_hash
from app.utils.device_security import parse_device_name, get_location_from_ip, get_client_ip
from app.utils.rate_limiter import check_rate_limit, record_failed_attempt, reset_failed_attempts
from app.utils.password_validator import validate_password

router = APIRouter(prefix="/auth", tags=["Password Reset"])

# ═══════════════════════════════════════════════════════════
# RATE LIMITING — Database-backed (persistent & scalable)
# ═══════════════════════════════════════════════════════════


# reset_failed_attempts from rate_limiter is used instead of this removed broken function


# ═══════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    recaptcha_token: str = None  # Optional for step1 calls


class ForgotPasswordStep2Request(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)


class ForgotPasswordResponse(BaseModel):
    message: str


class VerifyResetOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class VerifyResetOTPResponse(BaseModel):
    message: str
    reset_token: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str = Field(..., min_length=8)


class ResetPasswordResponse(BaseModel):
    message: str


# ═══════════════════════════════════════════════════════════
# HELPER — envoie OTP dans email_queue
# ═══════════════════════════════════════════════════════════

async def _send_reset_otp_email(
    user_email: str,
    user_name: str,
    otp_code: str,
    request: Request,
    db: AsyncSession
) -> None:
    try:
        ip = get_client_ip(request)
        ua = request.headers.get("User-Agent", "") if request else ""
        device_name = parse_device_name(ua)
        location = await get_location_from_ip(ip)
        now = datetime.utcnow().strftime("%d/%m/%Y - %H:%M UTC")

        html_content = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:40px 20px;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">
<tr><td style="background:linear-gradient(135deg,#1e40af,#1e3a8a);padding:40px;text-align:center;">
<p style="color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 10px 0;">MOUHAMI AI</p>
<h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">إعادة تعيين كلمة المرور</h1>
</td></tr>
<tr><td style="padding:40px;">
<p style="color:#1e293b;font-size:15px;font-weight:600;margin:0 0 8px 0;">المحامي/ة {user_name}،</p>
<p style="color:#475569;font-size:14px;line-height:1.8;margin:0 0 28px 0;">
تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابكم. استخدم الرمز أدناه لإتمام العملية.
</p>
<div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
<p style="color:#15803d;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 14px 0;">رمز التحقق</p>
<div style="background:#fff;border:2px dashed #16a34a;border-radius:8px;padding:16px;margin-bottom:14px;">
<span style="font-size:44px;font-weight:800;letter-spacing:10px;color:#1e293b;font-family:'Courier New',monospace;">{otp_code}</span>
</div>
<p style="color:#15803d;font-size:13px;margin:0;font-weight:600;">هذا الرمز صالح لمدة 15 دقيقة فقط</p>
</div>
<div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
<table width="100%" cellpadding="6">
<tr><td style="color:#64748b;font-size:13px;width:130px;">التاريخ والوقت</td><td style="color:#1e293b;font-size:13px;font-weight:600;">{now}</td></tr>
<tr style="background:#f8fafc;"><td style="color:#64748b;font-size:13px;">الجهاز</td><td style="color:#1e293b;font-size:13px;font-weight:600;">{device_name}</td></tr>
<tr><td style="color:#64748b;font-size:13px;">الموقع</td><td style="color:#1e293b;font-size:13px;font-weight:600;">{location.get('country', 'غير معروف')} — {location.get('city', 'غير معروف')}</td></tr>
<tr style="background:#f8fafc;"><td style="color:#64748b;font-size:13px;">عنوان IP</td><td style="color:#1e293b;font-size:13px;font-weight:600;font-family:monospace;">{ip}</td></tr>
</table>
</div>
<div style="background:#fef9ec;border-right:4px solid #d97706;border-radius:8px;padding:16px 20px;">
<p style="color:#92400e;font-size:13px;margin:0;font-weight:600;">
إذا لم تكن أنت من طلب إعادة التعيين، يرجى تجاهل هذا البريد وتأمين حسابك فوراً.
</p>
</div>
</td></tr>
<tr><td style="background:#1e293b;padding:20px 40px;text-align:center;">
<p style="color:#94a3b8;font-size:11px;margin:0;">منصة المحامي الذكية &copy; 2024 &middot; <a href="https://mouhami-ai.tn" style="color:#d97706;text-decoration:none;">mouhami-ai.tn</a></p>
</td></tr>
</table></td></tr></table>
</body></html>"""

        await db.execute(
            text("""
                INSERT INTO email_queue (id, to_email, subject, html_content, text_content, status, created_at)
                VALUES (:id, :to_email, :subject, :html_content, :text_content, :status, :created_at)
            """),
            {
                "id": f"resetpwd_{uuid.uuid4()}",
                "to_email": user_email,
                "subject": "إعادة تعيين كلمة المرور — رمز التحقق",
                "html_content": html_content,
                "text_content": f"رمز إعادة تعيين كلمة المرور: {otp_code} — صالح 15 دقيقة.",
                "status": "pending",
                "created_at": datetime.utcnow(),
            },
        )
        await db.commit()
    except Exception as e:
        print(f"❌ Failed to queue reset email: {e}")
        raise


# ═══════════════════════════════════════════════════════════
# ROUTE 1 — demander OTP
# ═══════════════════════════════════════════════════════════

async def _handle_forgot_password_logic(
    email: str,
    recaptcha_token: str | None,
    req: Request,
    db: AsyncSession
) -> ForgotPasswordResponse:
    """Shared logic for forgot-password and forgot-password/step1"""
    # Optional reCAPTCHA verification
    if recaptcha_token:
        from app.utils.security import verify_recaptcha
        if not await verify_recaptcha(recaptcha_token):
            raise HTTPException(status_code=400, detail="reCAPTCHA verification failed")

    # Rate limit check
    await check_rate_limit(req, db, email)

    # Always respond OK to prevent email enumeration
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user:
        otp_code = str(random.randint(100000, 999999))
        expires_at = datetime.utcnow() + timedelta(minutes=15)

        # Clean up old OTPs for this user
        try:
            await db.execute(
                text("DELETE FROM password_reset_otp WHERE email = :email"),
                {"email": user.email}
            )
        except Exception as e:
            print(f"Could not delete old OTPs: {e}")

        await db.execute(
            text("""
                INSERT INTO password_reset_otp (id, email, otp, expires_at, created_at)
                VALUES (:id, :email, :otp, :expires_at, :created_at)
            """),
            {
                "id": str(uuid.uuid4()),
                "email": user.email,
                "otp": otp_code,
                "expires_at": expires_at,
                "created_at": datetime.utcnow(),
            }
        )
        await db.commit()
        print(f"✅ OTP created for {user.email}: {otp_code}")

        # *** SEND the email (this was the missing critical call) ***
        try:
            await _send_reset_otp_email(user.email, user.name, otp_code, req, db)
            print(f"✅ Reset OTP email queued for {user.email}")
        except Exception as e:
            print(f"❌ Failed to queue reset email: {e}")

    return ForgotPasswordResponse(
        message="إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رمز التحقق إليه."
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    return await _handle_forgot_password_logic(request.email, request.recaptcha_token, req, db)


@router.post("/forgot-password/step1", response_model=ForgotPasswordResponse)
async def forgot_password_step1(
    request: ForgotPasswordRequest,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    """Step 1: Send OTP to email (frontend-compatible route)"""
    return await _handle_forgot_password_logic(request.email, request.recaptcha_token, req, db)


@router.post("/forgot-password/step2", response_model=ResetPasswordResponse)
async def forgot_password_step2(
    request: ForgotPasswordStep2Request,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    """Step 2: Verify OTP and reset password in one call (frontend-compatible route)"""
    # Validate password
    validation = validate_password(request.new_password)
    if not validation.is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=" | ".join(validation.errors)
        )

    # Find user
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="البريد الإلكتروني غير موجود.")

    # Verify OTP
    otp_result = await db.execute(
        text("""
            SELECT otp, expires_at FROM password_reset_otp
            WHERE email = :email
            ORDER BY created_at DESC LIMIT 1
        """),
        {"email": user.email}
    )
    otp_row = otp_result.fetchone()

    if not otp_row:
        await record_failed_attempt(req, db, request.email)
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
        await record_failed_attempt(req, db, request.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="رمز التحقق غير صحيح."
        )

    # OTP valid — update password
    user.password = get_password_hash(request.new_password)
    user.password_changed_at = datetime.utcnow()
    db.add(user)

    # Revoke all refresh tokens
    await db.execute(
        text("UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = :user_id"),
        {"user_id": user.id}
    )

    # Delete OTP
    await db.execute(
        text("DELETE FROM password_reset_otp WHERE email = :email"),
        {"email": user.email}
    )

    await db.commit()

    return ResetPasswordResponse(
        message="تم إعادة تعيين كلمة المرور بنجاح. يمكنكم تسجيل الدخول الآن."
    )


# ═══════════════════════════════════════════════════════════
# ROUTE 2 — vérifier OTP
# ═══════════════════════════════════════════════════
# ROUTE 2 — vérifier OTP
# ═══════════════════════════════════════════════════════════

@router.post("/verify-reset-otp", response_model=VerifyResetOTPResponse)
async def verify_reset_otp(
    request: VerifyResetOTPRequest,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    # ✓ Check rate limit
    await check_rate_limit(req, db, request.email)

    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="البريد الإلكتروني غير موجود.")

    otp_result = await db.execute(
        text("""
            SELECT otp, expires_at FROM password_reset_otp
            WHERE email = :email
            ORDER BY created_at DESC LIMIT 1
        """),
        {"email": user.email}
    )
    otp_row = otp_result.fetchone()

    if not otp_row:
        await record_failed_attempt(req, db, request.email)
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
        await record_failed_attempt(req, db, request.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="رمز التحقق غير صحيح."
        )

    # OTP valide — génère un token temporaire de reset
    reset_token = str(uuid.uuid4())
    await db.execute(
        text("""
            UPDATE password_reset_otp
            SET otp = :reset_token, expires_at = :expires_at
            WHERE email = :email
        """),
        {
            "reset_token": reset_token,
            "expires_at": datetime.utcnow() + timedelta(minutes=10),
            "email": user.email,
        }
    )
    await db.commit()

    # Reset rate limit attempts for this user/IP on successful OTP verification
    await reset_failed_attempts(req, db, request.email)

    return VerifyResetOTPResponse(
        message="تم التحقق بنجاح. يمكنك الآن إعادة تعيين كلمة المرور.",
        reset_token=reset_token
    )


# ═══════════════════════════════════════════════════════════
# ROUTE 3 — réinitialiser le mot de passe
# ═══════════════════════════════════════════════════════════

@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    request: ResetPasswordRequest,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    # Validate password meets security requirements
    validation = validate_password(request.new_password)
    if not validation.is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=" | ".join(validation.errors)
        )

    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="البريد الإلكتروني غير موجود.")

    otp_result = await db.execute(
        text("""
            SELECT otp, expires_at FROM password_reset_otp
            WHERE email = :email
            ORDER BY created_at DESC LIMIT 1
        """),
        {"email": user.email}
    )
    otp_row = otp_result.fetchone()

    if not otp_row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="جلسة إعادة التعيين غير صالحة. يرجى البدء من جديد."
        )

    token_value, expires_at = otp_row
    if datetime.utcnow() > expires_at:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="انتهت صلاحية جلسة إعادة التعيين. يرجى البدء من جديد."
        )

    if request.reset_token != token_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="رمز إعادة التعيين غير صالح."
        )

    # Mise à jour du mot de passe
    user.password = get_password_hash(request.new_password)
    user.password_changed_at = datetime.utcnow()
    db.add(user)

    # Révocation de tous les refresh tokens
    await db.execute(
        text("UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = :user_id"),
        {"user_id": user.id}
    )

    # Suppression de l'OTP
    await db.execute(
        text("DELETE FROM password_reset_otp WHERE email = :email"),
        {"email": user.email}
    )

    await db.commit()

    return ResetPasswordResponse(
        message="تم إعادة تعيين كلمة المرور بنجاح. يمكنكم تسجيل الدخول الآن."
    )