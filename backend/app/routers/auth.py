"""
Authentication routes: login, register, refresh token, password reset.
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from jose import JWTError, jwt

from app.database import get_db
from app.models.user import User, UserRole
from app.models.tenant import PasswordResetOTP
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    Token,
    RefreshTokenRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
)
from app.schemas.user import UserResponse
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_token_pair,
    decode_token,
    get_current_user,
)
from app.config import settings


router = APIRouter(prefix="/auth", tags=["Authentication"])


def generate_otp() -> str:
    """Generate a 6-digit OTP."""
    import random
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return JWT tokens.
    """
    # Find user by email
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    user = result.scalar_one_or_none()
    
    # Verify user exists and password matches
    if not user or not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create tokens
    tokens = create_token_pair(user.id, user.email, user.role)
    
    return LoginResponse(
        token=Token(**tokens),
        user=UserResponse.model_validate(user)
    )


@router.post("/register", response_model=RegisterResponse)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user account.
    """
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = User(
        email=request.email,
        name=request.name,
        password=get_password_hash(request.password),
        role=request.role or UserRole.CLIENT.value,
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create tokens
    tokens = create_token_pair(user.id, user.email, user.role)
    
    return RegisterResponse(
        token=Token(**tokens),
        user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    """
    # Decode refresh token
    payload = decode_token(request.refresh_token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user
    user_id = payload.get("sub")
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create new token pair
    tokens = create_token_pair(user.id, user.email, user.role)
    
    return Token(**tokens)


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout user (client-side token deletion).
    In a more advanced implementation, we could blacklist the token.
    """
    return {"message": "Successfully logged out"}


@router.post("/password-reset/request")
async def request_password_reset(
    request: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Request password reset OTP.
    """
    # Find user by email
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a reset code has been sent"}
    
    # Generate OTP
    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    # Delete old OTPs for this email
    await db.execute(
        PasswordResetOTP.__table__.delete().where(
            PasswordResetOTP.email == request.email
        )
    )
    
    # Create new OTP
    otp = PasswordResetOTP(
        email=request.email,
        otp=otp_code,
        expires_at=expires_at
    )
    db.add(otp)
    await db.commit()
    
    # TODO: Send email with OTP
    # For now, just return success (in production, send email here)
    print(f"Password reset OTP for {request.email}: {otp_code}")
    
    return {"message": "If the email exists, a reset code has been sent"}


@router.post("/password-reset/confirm")
async def confirm_password_reset(
    request: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
):
    """
    Confirm password reset with OTP.
    """
    # Find valid OTP
    result = await db.execute(
        select(PasswordResetOTP).where(
            and_(
                PasswordResetOTP.email == request.email,
                PasswordResetOTP.otp == request.otp,
                PasswordResetOTP.expires_at > datetime.utcnow()
            )
        )
    )
    otp = result.scalar_one_or_none()
    
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    # Find and update user
    user_result = await db.execute(
        select(User).where(User.email == request.email)
    )
    user = user_result.scalar_one_or_none()
    
    if user:
        user.password = get_password_hash(request.new_password)
    
    # Delete used OTP
    await db.delete(otp)
    await db.commit()
    
    return {"message": "Password successfully reset"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    """
    return UserResponse.model_validate(current_user)

