"""
FLUX 1 : CHANGEMENT DE MOT DE PASSE (Simple, pas d'OTP)
FLUX 2 : NOUVEL APPAREIL (OTP par email + 2 actions)
FLUX 3 : LOGIN step1 / step2 (compatible frontend)
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, text
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field, EmailStr

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import Token, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, SendRegistrationOTPRequest, SendRegistrationOTPResponse, VerifyRegistrationOTPRequest, VerifyRegistrationOTPResponse
from app.schemas.user import UserResponse
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_token_pair,
    get_current_user,
)
from app.utils.device_security import (
    check_known_device,
    save_known_device,
    parse_device_name,
    get_location_from_ip,
)
from app.utils.token_manager import save_refresh_token, verify_refresh_token
from app.utils.password_validator import validate_password
from app.utils.rate_limiter import check_rate_limit, record_failed_attempt, reset_failed_attempts
from app.utils.otp_manager import create_login_otp
from app.utils.email_localization import get_user_lang, get_email_template

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ═══════════════════════════════════════════════════════════
# RATE LIMITING — Database-backed (persistent & scalable)
# ═══════════════════════════════════════════════════════════

def _get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxies"""
    if not request:
        return "unknown"
        
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip: return cf_ip.strip()
        
    real_ip = request.headers.get("X-Real-IP")
    if real_ip: return real_ip.strip()
        
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
        
    return request.client.host if request.client else "unknown"


# ═══════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════

class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)
    logout_all_devices: bool = False


class ChangePasswordResponse(BaseModel):
    message: str
    tokens: Optional[Token] = None
    user: Optional[UserResponse] = None


class NewDeviceOTPRequest(BaseModel):
    user_id: str
    otp: str = Field(..., min_length=6, max_length=6)
    action: str = Field(..., pattern="^(confirm|secure)$")


class NewDeviceOTPResponse(BaseModel):
    message: str
    tokens: Optional[Token] = None
    user: Optional[UserResponse] = None


class EmergencyResetRequest(BaseModel):
    email: EmailStr
    new_password: str = Field(..., min_length=8)
    logout_all_devices: bool = True


class EmergencyResetResponse(BaseModel):
    message: str


class LoginStep1Request(BaseModel):
    email: EmailStr
    password: str
    fingerprint: Optional[str] = None
    recaptcha_token: str  # obligatoire


class LoginStep1Response(BaseModel):
    needs_otp: bool
    user_id: Optional[str] = None
    message: Optional[str] = None
    user: Optional[UserResponse] = None
    token: Optional[Token] = None


class LoginStep2Request(BaseModel):
    user_id: str
    otp: str = Field(..., min_length=6, max_length=6)
    fingerprint: Optional[str] = None


class LoginStep2Response(BaseModel):
    user: Optional[UserResponse] = None
    token: Optional[Token] = None
    message: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., min_length=10)


class RefreshTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 900  # 15 minutes in seconds


class LogoutRequest(BaseModel):
    logout_all_devices: bool = False


class LogoutResponse(BaseModel):
    message: str


# ═══════════════════════════════════════════════════════════
# HELPER OTP
# ═══════════════════════════════════════════════════════════

async def _create_and_send_device_otp(user: User, req: Request, db: AsyncSession) -> None:
    """
    Create OTP for new device and send alert email with professional template.
    
    Flow:
    1. Generate 6-digit OTP (5 minute expiry)
    2. Store in login_email_otp table
    3. Send professional Arabic email with OTP and action buttons
    """
    try:
        # Create OTP (using manager to ensure consistency)
        otp_code = await create_login_otp(user.id, db, expiry_minutes=5)
        
        # Detect language
        lang = get_user_lang(req)
        
        # Send email with template
        await send_new_device_otp_email(user.email, user.name, otp_code, req, db, lang=lang)
        
        print(f"✅ New device OTP sent to {user.email} (Lang: {lang})")
    except Exception as e:
        print(f"❌ Error in _create_and_send_device_otp: {e}")


# ═══════════════════════════════════════════════════════════
# EMAILS
# ═══════════════════════════════════════════════════════════

async def send_password_change_email(
    user_email: str,
    user_name: str,
    request: Request,
    db: AsyncSession,
    logged_out_all: bool = False
) -> None:
    try:
        lang = get_user_lang(request)
        ip = _get_client_ip(request)
        ua = request.headers.get("User-Agent", "") if request else ""
        device_name = parse_device_name(ua)
        location = await get_location_from_ip(ip)
        
        if lang == "fr":
            now = datetime.utcnow().strftime("%d/%m/%Y - %H:%M UTC")
            subject = "Avis de sécurité : Mot de passe modifié"
            body_text = f"Bonjour {user_name}, votre mot de passe a été modifié avec succès le {now}."
            logout_txt = "Vous avez été déconnecté de tous les autres appareils." if logged_out_all else ""
            
            html_content = f"""<!DOCTYPE html>
<html dir="ltr" lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>Mot de passe modifié avec succès</h2>
    <p>Bonjour <strong>{user_name}</strong>,</p>
    <p>Votre mot de passe a été mis à jour le {now}.</p>
    <p>Appareil : {device_name}<br>IP : {ip}</p>
    <p>{logout_txt}</p>
    <p>Si ce n'est pas vous, contactez-nous immédiatement.</p>
</body></html>"""
        else:
            now = datetime.utcnow().strftime("%d/%m/%Y - %H:%M UTC")
            subject = "إشعار: تم تغيير كلمة المرور"
            body_text = "تم تغيير كلمة المرور بنجاح."
            logout_notice = (
                "تم تسجيل خروجك من <strong>جميع الأجهزة الأخرى</strong> بناءً على طلبك."
                if logged_out_all else
                "جلسة تسجيل الدخول الحالية نشطة."
            )
            html_content = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; padding: 20px; text-align: right;">
    <h2>تم تغيير كلمة المرور بنجاح</h2>
    <p>مرحباً <strong>{user_name}</strong>،</p>
    <p>تم تغيير كلمة المرور الخاصة بكم في {now}.</p>
    <p>الجهاز: {device_name}<br>IP: {ip}</p>
    <p>{logout_notice}</p>
</body></html>"""

        await db.execute(
            text("""
                INSERT INTO email_queue (id, to_email, subject, html_content, text_content, status, created_at)
                VALUES (:id, :to_email, :subject, :html_content, :text_content, :status, :created_at)
            """),
            {
                "id": f"changepass_{datetime.utcnow().timestamp()}",
                "to_email": user_email,
                "subject": subject,
                "html_content": html_content,
                "text_content": body_text,
                "status": "pending",
                "created_at": datetime.utcnow(),
            },
        )
        await db.commit()
    except Exception:
        pass


async def send_new_device_otp_email(
    user_email: str,
    user_name: str,
    otp_code: str,
    request: Request,
    db: AsyncSession,
    lang: str = "ar"
) -> None:
    try:
        # Get template based on lang
        template_fn = get_email_template("new_device_login_alert", lang)
        
        ip = _get_client_ip(request)
        ua = request.headers.get("User-Agent", "") if request else ""
        device_name = parse_device_name(ua)
        location = await get_location_from_ip(ip)
        now_dt = datetime.utcnow()
        
        if lang == "fr":
            login_time = f"{now_dt.strftime('%d/%m/%Y')} à {now_dt.strftime('%H:%M')}"
        else:
            login_time = f"{now_dt.strftime('%d/%m/%Y')} الساعة {now_dt.strftime('%H:%M')}"
            
        # Generate device confirmation link
        os_name = ua.split(";")[1].strip() if ";" in ua else "En Inconnu" if lang == "fr" else "غير معروف"
        
        # Call template function
        subject, html_content = template_fn(
            user_name=user_name,
            user_email=user_email,
            device_name=device_name,
            os_name=os_name,
            ip_address=ip,
            city=location.get('city', 'Unknown'),
            country=location.get('country', 'Unknown'),
            login_time=login_time,
            otp_code=otp_code
        )
        
        await db.execute(
            text("""
                INSERT INTO email_queue (id, to_email, subject, html_content, text_content, status, created_at)
                VALUES (:id, :to_email, :subject, :html_content, :text_content, :status, :created_at)
            """),
            {
                "id": f"newdevice_{datetime.utcnow().timestamp()}",
                "to_email": user_email,
                "subject": subject,
                "html_content": html_content,
                "text_content": f"OTP: {otp_code}",
                "status": "pending",
                "created_at": datetime.utcnow(),
            },
        )
        await db.commit()
    except Exception as e:
        print(f"Error sending new device OTP email: {e}")


# ═══════════════════════════════════════════════════════════
# ROUTE LOGIN/STEP1
# ═══════════════════════════════════════════════════════════

@router.post("/login/step1", response_model=LoginStep1Response)
async def login_step1(
    request: LoginStep1Request,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    from app.utils.security import verify_recaptcha
    if not await verify_recaptcha(request.recaptcha_token):
        raise HTTPException(status_code=400, detail="reCAPTCHA verification failed")
    
    # ✓ Check rate limit (blocks if IP has exceeded attempts)
    await check_rate_limit(req, db, request.email)

    result = await db.execute(select(User).where(User.email == request.email).options(selectinload(User.profile)))
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.password):
        # ✗ Record failed attempt (raises HTTPException with appropriate message)
        await record_failed_attempt(req, db, request.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="البريد الإلكتروني أو كلمة المرور غير صحيحة."
        )

    if user.role not in (UserRole.LAWYER.value, UserRole.ADMIN.value, UserRole.CLIENT.value):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="هذا الحساب غير مصرح له بالوصول إلى المنصة."
        )

    # ✓ Extract device fingerprint and IP address
    fingerprint = request.fingerprint or req.headers.get("User-Agent", "unknown")
    ip_address = _get_client_ip(req)
    
    # ✓ Check if IP is known (only IP verification, not fingerprint)
    from app.utils.device_security import check_ip_known
    is_ip_known = await check_ip_known(user.id, ip_address, db)

    # ✓ SKIP new device alert for admin@admin.com only
    if not is_ip_known and user.email.lower() != "admin@admin.com":
        await _create_and_send_device_otp(user, req, db)
        return LoginStep1Response(
            needs_otp=True,
            user_id=user.id,
            message="تم إرسال رمز التحقق إلى بريدكم الإلكتروني. يرجى إدخاله للمتابعة."
        )

    # ✓ Reset rate limit attempts on successful login
    await reset_failed_attempts(req, db, request.email)
    tokens = create_token_pair(str(user.id), user.email, user.role)
    await save_refresh_token(str(user.id), tokens["refresh_token"], req, db)

    return LoginStep1Response(
        needs_otp=False,
        user=UserResponse.model_validate(user),
        token=Token(**tokens)
    )


# ═══════════════════════════════════════════════════════════
# ROUTE LOGIN/STEP2
# ═══════════════════════════════════════════════════════════

@router.post("/login/step2", response_model=LoginStep2Response)
async def login_step2(
    request: LoginStep2Request,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == request.user_id).options(selectinload(User.profile)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود.")

    otp_result = await db.execute(
        text("""
            SELECT otp, expires_at FROM login_email_otp
            WHERE user_id = :user_id
            ORDER BY created_at DESC LIMIT 1
        """),
        {"user_id": request.user_id}
    )
    otp_row = otp_result.fetchone()

    if not otp_row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="لم يتم العثور على رمز تحقق. يرجى إعادة تسجيل الدخول."
        )

    otp_value, expires_at = otp_row
    if datetime.utcnow() > expires_at:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="انتهت صلاحية رمز التحقق. يرجى إعادة تسجيل الدخول."
        )

    if request.otp != otp_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="رمز التحقق غير صحيح."
        )

    await db.execute(
        text("DELETE FROM login_email_otp WHERE user_id = :user_id"),
        {"user_id": request.user_id}
    )
    await db.commit()

    fingerprint = request.fingerprint or req.headers.get("User-Agent", "unknown")
    await save_known_device(str(user.id), fingerprint, req, db)

    tokens = create_token_pair(str(user.id), user.email, user.role)
    await save_refresh_token(str(user.id), tokens["refresh_token"], req, db)

    return LoginStep2Response(
        user=UserResponse.model_validate(user),
        token=Token(**tokens)
    )


# ═══════════════════════════════════════════════════════════
# ROUTE LOGIN (fallback direct)
# ═══════════════════════════════════════════════════════════

@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    # Use database-backed rate limiter
    await check_rate_limit(req, db, request.email)

    result = await db.execute(select(User).where(User.email == request.email).options(selectinload(User.profile)))
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.password):
        await record_failed_attempt(req, db, request.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="البريد الإلكتروني أو كلمة المرور غير صحيحة."
        )

    if user.role not in (UserRole.LAWYER.value, UserRole.ADMIN.value, UserRole.CLIENT.value):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="هذا الحساب غير مصرح له بالوصول إلى المنصة."
        )

    await reset_failed_attempts(req, db, request.email)
    tokens = create_token_pair(str(user.id), user.email, user.role)
    await save_refresh_token(str(user.id), tokens["refresh_token"], req, db)

    return LoginResponse(
        token=Token(**tokens),
        user=UserResponse.model_validate(user)
    )


# ═══════════════════════════════════════════════════════════
# ROUTE REGISTER
# ═══════════════════════════════════════════════════════════

@router.post("/register", response_model=RegisterResponse)
async def register(
    request: RegisterRequest,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    from app.utils.security import verify_recaptcha
    from app.models import RegistrationEmailOTP
    
    if not await verify_recaptcha(request.recaptcha_token):
        raise HTTPException(status_code=400, detail="reCAPTCHA verification failed")
    
    # Verify that OTP was verified for this email
    otp_result = await db.execute(
        select(RegistrationEmailOTP)
        .where(
            and_(
                RegistrationEmailOTP.email == request.email,
                RegistrationEmailOTP.verified == True
            )
        )
        .order_by(RegistrationEmailOTP.created_at.desc())
    )
    otp_record = otp_result.scalars().first()
    
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="يجب التحقق من البريد الإلكتروني أولاً."
        )
    
    # Validate password meets security requirements
    validation = validate_password(request.password)
    if not validation.is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=" | ".join(validation.errors)
        )
    
    result = await db.execute(select(User).where(User.email == request.email).options(selectinload(User.profile)))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="البريد الإلكتروني مستخدم بالفعل."
        )

    allowed_roles = {UserRole.LAWYER.value, UserRole.CLIENT.value}
    role = request.role if request.role in allowed_roles else UserRole.LAWYER.value

    user = User(
        email=request.email,
        password=get_password_hash(request.password),
        name=request.name,
        role=role,
        phone=request.phone,
        subscription_plan=request.subscription_plan or "basic",
        email_verified=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create UserProfile with account-specific metadata
    from app.models import UserProfile
    user_profile = UserProfile(
        user_id=user.id,
        account_type=request.account_type,
        bar_number=request.bar_number,
        cabinet_name=request.cabinet_name,
        bar_registration_number=request.bar_registration_number,
        office_address=request.office_address,
        number_of_lawyers=request.number_of_lawyers,
        university=request.university,
    )
    db.add(user_profile)
    await db.commit()

    # Register the current device so user doesn't get OTP on first login
    fingerprint = req.headers.get("User-Agent", "unknown")
    await save_known_device(str(user.id), fingerprint, req, db)

    tokens = create_token_pair(str(user.id), user.email, user.role)
    await save_refresh_token(str(user.id), tokens["refresh_token"], req, db)
    
    # Clean up the OTP record after successful registration
    await db.delete(otp_record)
    await db.commit()

    return RegisterResponse(
        token=Token(**tokens),
        user=UserResponse.model_validate(user)
    )


# ═══════════════════════════════════════════════════════════
# REGISTRATION OTP ENDPOINTS
# ═══════════════════════════════════════════════════════════

async def add_email_to_queue(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: str = "",
    db: AsyncSession = None
) -> None:
    """
    Add an email to the email_queue for async processing.
    """
    if not db:
        return
    
    import uuid
    queue_id = str(uuid.uuid4())
    
    await db.execute(
        text("""
            INSERT INTO email_queue (id, to_email, subject, html_content, text_content, status, created_at)
            VALUES (:id, :to_email, :subject, :html_content, :text_content, 'pending', :created_at)
        """),
        {
            "id": queue_id,
            "to_email": to_email,
            "subject": subject,
            "html_content": html_content,
            "text_content": text_content,
            "created_at": datetime.utcnow()
        }
    )
    await db.commit()


@router.post("/register/send-otp", response_model=SendRegistrationOTPResponse)
async def send_registration_otp(
    request: SendRegistrationOTPRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Step 1 of registration: validate email and send OTP.
    User provides email, password, name, phone, and account_type.
    """
    print(f"📝 Registration OTP request for email: {request.email} (type: {request.account_type})")
    
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == request.email).options(selectinload(User.profile)))
    if result.scalar_one_or_none():
        print(f"❌ Email already registered: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="عذراً، هذا البريد مسجل مسبقاً، يرجى استخدام بريد آخر"
        )
    
    # Generate OTP
    from app.utils.otp_manager import generate_otp
    otp = await generate_otp()
    print(f"✅ Generated OTP for {request.email}: {otp}")
    
    # Clean up old OTPs for this email (keep only recent ones)
    try:
        await db.execute(
            text("DELETE FROM registration_email_otp WHERE email = :email AND verified = false"),
            {"email": request.email}
        )
        await db.commit()
    except Exception as e:
        print(f"⚠️  Could not clean old OTPs: {e}")
    
    # Save OTP to database
    from app.models import RegistrationEmailOTP
    import uuid
    otp_expires_at = datetime.utcnow() + timedelta(minutes=10)  # 10 minute expiry
    
    registration_otp = RegistrationEmailOTP(
        id=str(uuid.uuid4()),
        email=request.email,
        otp=otp,
        expires_at=otp_expires_at,
        verified=False
    )
    db.add(registration_otp)
    await db.commit()
    print(f"💾 OTP saved to database for {request.email}")
    
    # Send OTP via email
    html_content = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:40px 20px;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">
                <tr><td style="background:linear-gradient(135deg,#D4941C,#B87F1A);padding:40px;text-align:center;">
                    <p style="color:#fff;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 10px 0;">MOUHAMI AI</p>
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
                            <span style="font-size:44px;font-weight:800;letter-spacing:10px;color:#1e293b;font-family:'Courier New',monospace;">{otp}</span>
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
                    <p style="color:#94a3b8;font-size:11px;margin:0;">منصة المحامي الذكية &copy; 2026</p>
                </td></tr>
            </table>
        </td></tr>
    </table>
</body>
</html>"""
    
    text_content = f"رمز التحقق الخاص بك: {otp}\nهذا الرمز صالح لمدة 10 دقائق."
    
    await add_email_to_queue(
        to_email=request.email,
        subject="رمز التحقق - موهمي",
        html_content=html_content,
        text_content=text_content,
        db=db
    )
    
    print(f"📧 OTP email queued for {request.email}")
    return SendRegistrationOTPResponse(message="تم إرسال رمز التحقق إلى بريدك الإلكتروني")


@router.post("/register/verify-otp", response_model=VerifyRegistrationOTPResponse)
async def verify_registration_otp(
    request: VerifyRegistrationOTPRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify OTP during registration (Step 2.5).
    User provides email and OTP code.
    """
    from app.models import RegistrationEmailOTP
    
    print(f"🔐 Verifying OTP for email: {request.email}")
    
    # Find the latest OTP for this email
    result = await db.execute(
        select(RegistrationEmailOTP)
        .where(RegistrationEmailOTP.email == request.email)
        .order_by(RegistrationEmailOTP.created_at.desc())
    )
    otp_record = result.scalars().first()
    
    if not otp_record:
        print(f"❌ No OTP found for {request.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لم يتم طلب أي رمز تحقق لهذا البريد الإلكتروني. يرجى طلب رمز جديد."
        )
    
    # Check if OTP is expired
    if datetime.utcnow() > otp_record.expires_at:
        print(f"❌ OTP expired for {request.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد."
        )
    
    # Verify OTP code
    if otp_record.otp != request.otp:
        print(f"❌ Invalid OTP for {request.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="رمز التحقق غير صحيح. يرجى التحقق من الرمز المرسل إلى بريدك."
        )
    
    # Mark OTP as verified
    otp_record.verified = True
    await db.commit()
    
    print(f"✅ OTP verified successfully for {request.email}")
    return VerifyRegistrationOTPResponse(
        verified=True,
        message="تم التحقق من البريد الإلكتروني بنجاح. يمكنك الآن إكمال التسجيل."
    )


# ═══════════════════════════════════════════════════════════
# ROUTE CHANGEMENT MOT DE PASSE
# ═══════════════════════════════════════════════════════════

@router.post("/change-password", response_model=ChangePasswordResponse)
async def change_password(
    request: ChangePasswordRequest,
    req: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Validate new password meets security requirements
        validation = validate_password(request.new_password)
        if not validation.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=" | ".join(validation.errors)
            )

        if request.old_password == request.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="كلمة المرور الجديدة يجب أن تختلف عن كلمة المرور الحالية."
            )

        if not verify_password(request.old_password, current_user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="كلمة المرور الحالية غير صحيحة."
            )

        current_user.password = get_password_hash(request.new_password)
        current_user.password_changed_at = datetime.utcnow()
        db.add(current_user)
        await db.commit()
        await db.refresh(current_user)

        if request.logout_all_devices:
            await db.execute(
                text("UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = :user_id"),
                {"user_id": current_user.id}
            )
            await db.commit()

        try:
            await send_password_change_email(
                user_email=current_user.email,
                user_name=current_user.name,
                request=req,
                db=db,
                logged_out_all=request.logout_all_devices
            )
        except Exception:
            pass

        new_tokens = create_token_pair(str(current_user.id), current_user.email, current_user.role)
        await save_refresh_token(str(current_user.id), new_tokens["refresh_token"], req, db)

        return ChangePasswordResponse(
            message="تم تغيير كلمة المرور بنجاح.",
            tokens=Token(**new_tokens),
            user=UserResponse.model_validate(current_user)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ═══════════════════════════════════════════════════════════
# ROUTE VALIDER OTP NOUVEL APPAREIL
# ═══════════════════════════════════════════════════════════

@router.post("/verify-new-device-otp", response_model=NewDeviceOTPResponse)
async def verify_new_device_otp(
    request: NewDeviceOTPRequest,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(select(User).where(User.id == request.user_id).options(selectinload(User.profile)))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="المستخدم غير موجود.")

        otp_result = await db.execute(
            text("""
                SELECT otp, expires_at FROM login_email_otp
                WHERE user_id = :user_id
                ORDER BY created_at DESC LIMIT 1
            """),
            {"user_id": request.user_id}
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
                detail="انتهت صلاحية رمز التحقق. يرجى تسجيل الدخول مجدداً."
            )

        if request.otp != otp_value:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="رمز التحقق غير صحيح."
            )

        await db.execute(
            text("DELETE FROM login_email_otp WHERE user_id = :user_id"),
            {"user_id": request.user_id}
        )
        await db.commit()

        if request.action == "confirm":
            fingerprint = req.headers.get("User-Agent", "unknown")
            await save_known_device(str(user.id), fingerprint, req, db)
            tokens = create_token_pair(str(user.id), user.email, user.role)
            await save_refresh_token(str(user.id), tokens["refresh_token"], req, db)
            return NewDeviceOTPResponse(
                message="تم التحقق بنجاح. مرحباً بكم في منصة المحامي الذكية.",
                tokens=Token(**tokens),
                user=UserResponse.model_validate(user)
            )

        elif request.action == "secure":
            import secrets
            temp_password = secrets.token_urlsafe(12)
            user.password = get_password_hash(temp_password)
            user.password_changed_at = datetime.utcnow()
            db.add(user)
            await db.commit()

            await db.execute(
                text("DELETE FROM refresh_tokens WHERE user_id = :user_id"),
                {"user_id": user.id}
            )
            await db.commit()

            html = f"""<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;padding:40px 20px;">
<table width="100%"><tr><td align="center">
<table width="560" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#991b1b,#7f1d1d);padding:32px 40px;text-align:center;">
<h1 style="color:#fff;font-size:20px;font-weight:700;margin:0;">تم تأمين حسابكم بنجاح</h1>
</td></tr>
<tr><td style="padding:36px 40px;">
<p style="color:#475569;font-size:14px;line-height:1.8;margin-bottom:24px;">
المحامي/ة <strong style="color:#1e293b;">{user.name}</strong>،<br>
تم تأمين حسابكم وتسجيل الخروج من جميع الأجهزة. كلمة المرور المؤقتة:
</p>
<div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
<span style="font-size:20px;font-weight:700;letter-spacing:4px;font-family:monospace;color:#1e293b;">{temp_password}</span>
</div>
<p style="color:#94a3b8;font-size:13px;">يُرجى تغيير هذه الكلمة المؤقتة فوراً بعد تسجيل الدخول.</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;">
<p style="color:#94a3b8;font-size:11px;margin:0;">منصة المحامي الذكية &middot; mouhami-ai.tn</p>
</td></tr>
</table></td></tr></table></body></html>"""

            await db.execute(
                text("""
                    INSERT INTO email_queue (id, to_email, subject, html_content, text_content, status, created_at)
                    VALUES (:id, :to_email, :subject, :html_content, :text_content, :status, :created_at)
                """),
                {
                    "id": f"secure_{datetime.utcnow().timestamp()}",
                    "to_email": user.email,
                    "subject": "تأمين الحساب: كلمة مرور مؤقتة",
                    "html_content": html,
                    "text_content": "تم تأمين حسابكم.",
                    "status": "pending",
                    "created_at": datetime.utcnow(),
                }
            )
            await db.commit()

            return NewDeviceOTPResponse(
                message="تم تأمين حسابكم بنجاح. تم إرسال كلمة مرور مؤقتة إلى بريدكم الإلكتروني.",
                tokens=None,
                user=None
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ═══════════════════════════════════════════════════════════
# ROUTE GET CURRENT USER
# ═══════════════════════════════════════════════════════════

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user info"""
    return UserResponse.model_validate(current_user)


# ═══════════════════════════════════════════════════════════
# ENDPOINT: Refresh Token - Renouveler l'access token
# ═══════════════════════════════════════════════════════════

@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_access_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Renouvelle l'access token en utilisant un refresh token valide.
    
    Le refresh token doit:
    - Exister en base de données
    - Ne pas être révoqué
    - Ne pas être expiré
    
    Returns: Nouvel access token (15 minutes)
    """
    from app.utils.security import decode_token
    
    # Vérifier que le refresh token est valide et existe
    user_id = await verify_refresh_token(request.refresh_token, db)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="رمز التحديث غير صالح أو منتهي الصلاحية"
        )
    
    # Récupérer l'utilisateur
    result = await db.execute(select(User).where(User.id == user_id).options(selectinload(User.profile)))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="المستخدم غير موجود"
        )
    
    # Créer un nouvel access token
    from app.utils.security import create_access_token
    new_access_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    })
    
    return RefreshTokenResponse(
        access_token=new_access_token,
        token_type="bearer",
        expires_in=900  # 15 minutes
    )


# ═══════════════════════════════════════════════════════════
# ENDPOINT: Logout - Révoquer les tokens
# ═══════════════════════════════════════════════════════════

@router.post("/logout", response_model=LogoutResponse)
async def logout(
    request: LogoutRequest,
    current_user: User = Depends(get_current_user),
    req: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Logout l'utilisateur en révoquant son/ses refresh token(s).
    
    Paramètres:
    - logout_all_devices: Si True, révoque TOUS les refresh tokens
                         Si False, révoque seulement le token actuel (déjà supprimé côté client)
    
    Returns: Message de confirmation
    """
    try:
        if request.logout_all_devices:
            # Révoquer TOUS les tokens de tous les appareils
            await db.execute(
                text("UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = :user_id"),
                {"user_id": current_user.id}
            )
            message = "تم تسجيل الخروج من جميع الأجهزة بنجاح"
        else:
            # Simplement confirmer le logout (token supprimé côté client)
            message = "تم تسجيل الخروج بنجاح"
        
        await db.commit()
        
        # Log the logout event
        await db.execute(
            text("""
                INSERT INTO security_logs (user_id, ip_address, event_type, details, created_at)
                VALUES (:user_id, :ip, :event, :details, :now)
            """),
            {
                "user_id": current_user.id,
                "ip": _get_client_ip(req),
                "event": "logout",
                "details": f"User logged out. Logout all devices: {request.logout_all_devices}",
                "now": datetime.utcnow()
            }
        )
        await db.commit()
        
        return LogoutResponse(message=message)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="حدث خطأ أثناء تسجيل الخروج"
        )


# ═══════════════════════════════════════════════════════════
# ENDPOINT: Emergency Reset (Compte sécurisé - pas moi)
# ═══════════════════════════════════════════════════════════

@router.post("/emergency-reset", response_model=EmergencyResetResponse)
async def emergency_reset(
    request: EmergencyResetRequest,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Security flow "Ce n'est pas moi" (Not me):
    1. User receives email about suspicious login
    2. Clicks "Ce n'est pas moi" button
    3. Frontend redirects to security page
    4. User changes password (new strong password)
    5. Optional: Logout from all devices
    
    This endpoint secures the account immediately
    """
    try:
        # Validate new password meets security requirements
        validation = validate_password(request.new_password)
        if not validation.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=" | ".join(validation.errors)
            )

        # Find user by email
        result = await db.execute(select(User).where(User.email == request.email).options(selectinload(User.profile)))
        user = result.scalar_one_or_none()
        
        if not user:
            # For security, don't reveal if email exists
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="البريد الإلكتروني أو بيانات الدخول غير صحيحة"
            )
        
        # Change password
        user.password = get_password_hash(request.new_password)
        user.password_changed_at = datetime.utcnow()
        db.add(user)
        await db.commit()
        
        # Log security action
        await db.execute(
            text("""
                INSERT INTO security_logs (ip_address, event_type, details, created_at)
                VALUES (:ip, :event, :details, :now)
            """),
            {
                "ip": _get_client_ip(req),
                "event": "emergency_reset",
                "details": f"Emergency reset performed for user: {user.email}. Logout all devices: {request.logout_all_devices}",
                "now": datetime.utcnow()
            }
        )
        
        # If requested, logout from all devices
        if request.logout_all_devices:
            await db.execute(
                text("DELETE FROM refresh_tokens WHERE user_id = :user_id"),
                {"user_id": user.id}
            )
        
        await db.commit()
        
        # Send confirmation email
        try:
            from app.templates.email_templates_ar import security_alert_response
            
            subject, html_content = security_alert_response(
                user_name=user.name,
                reset_time=f"{datetime.utcnow().strftime('%d/%m/%Y')} الساعة {datetime.utcnow().strftime('%H:%M')}",
                ip_address=_get_client_ip(req),
                logout_all=request.logout_all_devices
            )
            
            await db.execute(
                text("""
                    INSERT INTO email_queue (id, to_email, subject, html_content, text_content, status, created_at)
                    VALUES (:id, :to_email, :subject, :html_content, :text_content, :status, :created_at)
                """),
                {
                    "id": f"emergency_reset_{datetime.utcnow().timestamp()}",
                    "to_email": user.email,
                    "subject": subject,
                    "html_content": html_content,
                    "text_content": f"تم تغيير كلمة المرور بنجاح في {datetime.utcnow().strftime('%d/%m/%Y')} الساعة {datetime.utcnow().strftime('%H:%M')}",
                    "status": "pending",
                    "created_at": datetime.utcnow()
                }
            )
            await db.commit()
        except Exception as e:
            print(f"Warning: Could not send confirmation email: {e}")
        
        return EmergencyResetResponse(
            message="تم تأمين حسابك بنجاح. تم تغيير كلمة المرور." + 
                   (" سيتم تسجيل الخروج من جميع الأجهزة الأخرى." if request.logout_all_devices else "")
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Emergency reset error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="حدث خطأ أثناء تأمين الحساب"
        )

# ═══════════════════════════════════════════════════════════
# IP & DEVICE SECURITY (Frontend Migration Compatibility)
# ═══════════════════════════════════════════════════════════

@router.get("/current-ip")
async def get_current_ip(request: Request):
    """Retrieve the current client IP address."""
    ip = _get_client_ip(request)
    return {"ip": ip}

@router.get("/ip-info")
async def get_ip_info(ip: str):
    """Retrieve details for a specific IP address."""
    location = await get_location_from_ip(ip)
    return {
        "ip": ip,
        "country": location.get("country", "Unknown"),
        "city": location.get("city", "Unknown")
    }

class SendIPVerificationRequest(BaseModel):
    email: EmailStr

@router.post("/send-ip-verification")
async def send_ip_verification(request: SendIPVerificationRequest, db: AsyncSession = Depends(get_db)):
    """Mock endpoint to send IP verification to email."""
    result = await db.execute(select(User).where(User.email == request.email).options(selectinload(User.profile)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود.")
    return {"message": "Verification sent."}

class VerifyIPOTPRequest(BaseModel):
    code: str
    ip: str

@router.post("/verify-ip-otp")
async def verify_ip_otp(request: VerifyIPOTPRequest, current_user: User = Depends(get_current_user)):
    """Mock endpoint to verify an IP OTP code."""
    return {"verified": True}
