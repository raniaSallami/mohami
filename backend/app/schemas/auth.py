"""
Pydantic schemas for authentication.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


# Token schemas
class Token(BaseModel):
    """JWT token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """JWT token payload schema."""
    sub: str  # user_id
    email: Optional[str] = None
    role: str
    exp: Optional[datetime] = None
    type: str = "access"


class RefreshTokenRequest(BaseModel):
    """Request schema for refreshing access token."""
    refresh_token: str


# Login schemas
class LoginRequest(BaseModel):
    """User login request schema."""
    email: EmailStr
    password: str
    totp_code: Optional[str] = None

    @field_validator('totp_code')
    def check_totp_length(cls, v):
        if v is not None and len(v) != 6:
            raise ValueError('Invalid TOTP code format')
        return v


class LoginResponse(BaseModel):
    """User login response schema."""
    token: Token
    user: "UserResponse"


# Registration schemas
class RegisterRequest(BaseModel):
    """User registration request schema."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=2, max_length=255)
    role: Optional[str] = "CLIENT"

    @field_validator('password')
    def password_complexity(cls, v: str):
        import re
        if not re.search(r'[A-Z]', v) or not re.search(r'[a-z]', v) or not re.search(r'\d', v):
            raise ValueError('Password must contain upper case, lower case and a digit')
        return v


class RegisterResponse(BaseModel):
    """User registration response schema."""
    token: Token
    user: "UserResponse"


# Password reset schemas
class PasswordResetRequest(BaseModel):
    """Request password reset OTP."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Confirm password reset with OTP."""
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)

    @field_validator('new_password')
    def new_password_complexity(cls, v: str):
        import re
        if not re.search(r'[A-Z]', v) or not re.search(r'[a-z]', v) or not re.search(r'\d', v):
            raise ValueError('Password must contain upper case, lower case and a digit')
        return v


# Import UserResponse for forward reference
from app.schemas.user import UserResponse
RegisterResponse.model_rebuild()
LoginResponse.model_rebuild()

