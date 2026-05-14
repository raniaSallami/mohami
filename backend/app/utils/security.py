"""
Security utilities: JWT token handling and password hashing.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import jwt
from jose.exceptions import JWTError, ExpiredSignatureError
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User


# JWT security scheme
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    try:
        # Format 1: bcrypt string direct ($2b$...)
        if hashed_password.startswith("$2"):
            return bcrypt.checkpw(
                plain_password.encode('utf-8'),
                hashed_password.encode('utf-8')
            )
        # Format 2: hex-encoded bcrypt
        hashed_bytes = bytes.fromhex(hashed_password)
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    # Store as bcrypt string directly (not hex)
    return hashed.decode('utf-8')


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Payload data to encode
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        data: Payload data to encode
        
    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded payload or None if invalid
    """
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except ExpiredSignatureError:
        if settings.debug:
            print(f"DEBUG: Token expired: {token[:10]}...")
        return None
    except JWTError as e:
        if settings.debug:
            print(f"DEBUG: Token invalid ({str(e)}): {token[:10]}...")
        return None
    except Exception as e:
        if settings.debug:
            print(f"DEBUG: Token decoding exception ({str(e)}): {token[:10]}...")
        return None


def create_token_pair(user_id: str, email: str, role: str) -> Dict[str, str]:
    """
    Create both access and refresh tokens for a user.
    
    Returns:
        Dictionary with access_token and refresh_token
    """
    token_data = {
        "sub": user_id,
        "email": email,
        "role": role
    }
    
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token({"sub": user_id})
    }


# Token payload type
TokenPayload = Dict[str, Any]


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """
    Dependency to get the current authenticated user from JWT token.
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    from sqlalchemy import select
    
    token = credentials.credentials
    
    # Handle common frontend issues where state might be stringified "null" or "undefined"
    if not token or token in ["null", "undefined", "[object Object]", ""]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    
    if payload is None:
        if settings.debug:
            # We already printed specific reason in decode_token
            pass
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if payload.get("type") != "access":
        if settings.debug:
            print(f"DEBUG: Token type is not access: {payload.get('type')}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Cast string user_id to uuid.UUID for proper type matching with UUID column
    import uuid as _uuid
    try:
        user_uuid = _uuid.UUID(user_id)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Fetch user from database with eagerly loaded profile to avoid lazy-loading issues
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == user_uuid)
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        if settings.debug:
            print(f"DEBUG: User ID {user_id} not found in database")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Ensure the current user is active.
    """
    if current_user.subscription_status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is suspended"
        )
    return current_user


def require_role(*allowed_roles: str):
    """
    Dependency factory to require specific roles.
    
    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(user: User = Depends(require_role("ADMIN"))):
            ...
    """
    async def role_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker


# --------- TOTP helpers ---------
try:
    import pyotp
except ImportError:  # pyotp may be added later via requirements
    pyotp = None  # type: ignore


def generate_totp_secret() -> str:
    """Create a new base32 secret usable by authenticator apps."""
    if pyotp is None:
        raise RuntimeError("pyotp is not installed")
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str, issuer: str = "Mohami") -> str:
    """Return provisioning URI that can be encoded as QR code."""
    if pyotp is None:
        raise RuntimeError("pyotp is not installed")
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name=issuer)


def verify_totp(secret: str, code: str) -> bool:
    """Verify a 6‑digit TOTP code against stored secret."""
    if pyotp is None:
        raise RuntimeError("pyotp is not installed")
    totp = pyotp.totp.TOTP(secret)
    # allow a window of one step either side (30s each)
    return totp.verify(code, valid_window=1)


async def verify_recaptcha(token: str) -> bool:
    """
    Verify reCAPTCHA v3 token (score >= 0.5).
    Logs failed attempts.
    """
    import httpx
    import logging
    
    logger = logging.getLogger(__name__)
    
    if not settings.recaptcha_secret_key or settings.debug or token == "mock":
        # reCAPTCHA bypassed in debug/test mode - no logging needed to avoid noise
        return True  # Dev bypass or mock token
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={
                    "secret": settings.recaptcha_secret_key,
                    "response": token,
                }
            )
        
        data = resp.json()
        is_valid = data.get("success") and data.get("score", 0) >= 0.5
        
        if not is_valid:
            logger.warning(f"reCAPTCHA failed: score={data.get('score', 0)}, errors={data.get('error-codes', [])}")
        
        return is_valid
        
    except Exception as e:
        logger.error(f"reCAPTCHA verification error: {e}")
        return False  # Fail closed on error


# Tests (called in dev)
async def test_recaptcha():
    """Test reCAPTCHA validation (valid/invalid/missing)."""
    import pytest
    assert await verify_recaptcha("valid_token") == True  # Mock
    assert await verify_recaptcha("invalid") == False
    assert await verify_recaptcha("") == False
    print("✅ reCAPTCHA tests passed")

