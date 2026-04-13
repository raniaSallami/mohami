"""
Pydantic schemas for authentication.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    email: Optional[str] = None
    role: str
    exp: Optional[datetime] = None
    type: str = "access"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    recaptcha_token: str
    totp_code: Optional[str] = None
    fingerprint: Optional[str] = None

    @field_validator('totp_code')
    def check_totp_length(cls, v):
        if v is not None and len(v) != 6:
            raise ValueError('Invalid TOTP code format')
        return v


class LoginResponse(BaseModel):
    token: Token
    user: "UserResponse"


class RegisterRequest(BaseModel):
    email: EmailStr
    recaptcha_token: str
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., description="User phone number")
    account_type: str = Field(..., description="Account type: lawyer, cabinet, or student")
    role: Optional[str] = "LAWYER"  # Rôle par défaut : avocat
    subscription_plan: Optional[str] = "basic"  # Default subscription plan
    
    # Account-specific fields (optional based on account_type)
    bar_number: Optional[str] = None  # For lawyers
    cabinet_name: Optional[str] = None  # For cabinet accounts
    bar_registration_number: Optional[str] = None  # For cabinet accounts
    office_address: Optional[str] = None  # For cabinet accounts
    number_of_lawyers: Optional[int] = None  # For cabinet accounts
    university: Optional[str] = None  # For student accounts

    @field_validator('password')
    def password_complexity(cls, v: str):
        import re
        if not re.search(r'[A-Z]', v) or not re.search(r'[a-z]', v) or not re.search(r'\d', v):
            raise ValueError('كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم على الأقل.')
        return v

    @field_validator('role')
    def validate_role(cls, v: str):
        allowed = {"LAWYER", "CLIENT"}
        if v and v.upper() not in allowed:
            return "LAWYER"
        return v.upper() if v else "LAWYER"
    
    @field_validator('account_type')
    def validate_account_type(cls, v: str):
        allowed = {"lawyer", "cabinet", "student"}
        if v.lower() not in allowed:
            raise ValueError('Account type must be one of: lawyer, cabinet, student')
        return v.lower()
    
    @field_validator('subscription_plan')
    def validate_subscription_plan(cls, v: Optional[str]):
        if v:
            allowed = {"basic", "pro", "enterprise"}
            if v.lower() not in allowed:
                return "basic"
            return v.lower()
        return "basic"


class RegisterResponse(BaseModel):
    token: Token
    user: "UserResponse"


class PasswordResetRequest(BaseModel):
    email: EmailStr
    recaptcha_token: str


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)

    @field_validator('new_password')
    def new_password_complexity(cls, v: str):
        import re
        if not re.search(r'[A-Z]', v) or not re.search(r'[a-z]', v) or not re.search(r'\d', v):
            raise ValueError('كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم على الأقل.')
        return v


class SendRegistrationOTPRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., description="User phone number")
    account_type: str = Field(..., description="Account type: lawyer, cabinet, or student")
    
    @field_validator('password')
    def password_complexity(cls, v: str):
        import re
        if not re.search(r'[A-Z]', v) or not re.search(r'[a-z]', v) or not re.search(r'\d', v):
            raise ValueError('كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم على الأقل.')
        return v
    
    @field_validator('account_type')
    def validate_account_type(cls, v: str):
        allowed = {"lawyer", "cabinet", "student"}
        if v.lower() not in allowed:
            raise ValueError('Account type must be one of: lawyer, cabinet, student')
        return v.lower()


class SendRegistrationOTPResponse(BaseModel):
    message: str = "OTP sent to email"
    

class VerifyRegistrationOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class VerifyRegistrationOTPResponse(BaseModel):
    verified: bool
    message: str


# Import UserResponse for forward reference
from app.schemas.user import UserResponse
RegisterResponse.model_rebuild()
LoginResponse.model_rebuild()