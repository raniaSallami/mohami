"""
OTP (One-Time Password) Management Utilities
Handles OTP generation, verification, and cleanup for:
- New device login verification
- Password reset
- Signup verification
"""

import random
import string
import uuid
from datetime import datetime, timedelta
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def generate_otp(length: int = 6) -> str:
    """
    Generate a random OTP of specified length.
    Default: 6 digits
    """
    return ''.join(random.choices(string.digits, k=length))


async def create_login_otp(
    user_id: str,
    db: AsyncSession,
    expiry_minutes: int = 5
) -> str:
    """
    Create a new OTP for device login verification.
    
    Args:
        user_id: User UUID
        db: Database session
        expiry_minutes: OTP expiry time in minutes (default: 5)
    
    Returns:
        Generated OTP code
    """
    otp = await generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=expiry_minutes)
    
    await db.execute(
        text("""
            INSERT INTO login_email_otp (id, user_id, otp, expires_at, created_at)
            VALUES (:id, :user_id, :otp, :expires_at, :now)
        """),
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "otp": otp,
            "expires_at": expires_at,
            "now": datetime.utcnow()
        }
    )
    await db.commit()
    
    return otp


async def get_latest_login_otp(user_id: str, db: AsyncSession) -> tuple[str, datetime] | None:
    """
    Get the latest OTP record for a user.
    
    Returns:
        Tuple of (otp_code, expires_at) or None if not found
    """
    result = await db.execute(
        text("""
            SELECT otp, expires_at FROM login_email_otp
            WHERE user_id = :user_id
            ORDER BY created_at DESC LIMIT 1
        """),
        {"user_id": user_id}
    )
    row = result.fetchone()
    
    if row:
        return row[0], row[1]
    return None


async def verify_login_otp(
    user_id: str,
    otp_code: str,
    db: AsyncSession
) -> bool:
    """
    Verify a login OTP code.
    Checks both code match and expiry.
    
    Returns:
        True if valid and not expired
    """
    result = await db.execute(
        text("""
            SELECT otp, expires_at FROM login_email_otp
            WHERE user_id = :user_id
            ORDER BY created_at DESC LIMIT 1
        """),
        {"user_id": user_id}
    )
    row = result.fetchone()
    
    if not row:
        return False
    
    stored_otp, expires_at = row
    
    # Check expiry
    if datetime.utcnow() > expires_at:
        return False
    
    # Check code
    return stored_otp == otp_code


async def delete_login_otp(user_id: str, db: AsyncSession) -> None:
    """
    Delete OTP record after successful verification.
    """
    await db.execute(
        text("DELETE FROM login_email_otp WHERE user_id = :user_id"),
        {"user_id": user_id}
    )
    await db.commit()


async def cleanup_expired_otps(db: AsyncSession) -> int:
    """
    Delete all expired OTP records.
    
    Returns:
        Number of records deleted
    """
    result = await db.execute(
        text("""
            DELETE FROM login_email_otp
            WHERE expires_at < :now
            RETURNING id
        """),
        {"now": datetime.utcnow()}
    )
    deleted_count = len(result.fetchall())
    await db.commit()
    
    return deleted_count
