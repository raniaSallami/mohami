"""
Rate Limiter - Protection contre le brute force.
Fichier : backend/app/utils/rate_limiter.py
"""
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.utils.device_security import get_client_ip


MAX_ATTEMPTS   = 8
WINDOW_MINUTES = 15
BLOCK_MINUTES  = 30


async def check_rate_limit(request: Request, db: AsyncSession, email: str = "") -> None:
    ip = get_client_ip(request)

    result = await db.execute(
        text("""
            SELECT COUNT(*) FROM security_logs
            WHERE ip_address = :ip
              AND event_type = 'blocked'
              AND created_at > :since
              AND details LIKE :email_pattern
        """),
        {
            "ip": ip,
            "since": datetime.utcnow() - timedelta(minutes=BLOCK_MINUTES),
            "email_pattern": f"%{email}%"
        }
    )
    blocked_count = result.scalar()

    if blocked_count and blocked_count > 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"تم تجاوز الحد الأقصى لمحاولات الدخول. يرجى الانتظار {BLOCK_MINUTES} دقيقة ثم المحاولة مجدداً.",
        )


async def record_failed_attempt(request: Request, db: AsyncSession, email: str = "") -> None:
    ip = get_client_ip(request)
    since = datetime.utcnow() - timedelta(minutes=WINDOW_MINUTES)

    result = await db.execute(
        text("""
            SELECT COUNT(*) FROM security_logs
            WHERE ip_address = :ip
              AND event_type = 'failed_login'
              AND created_at > :since
              AND details LIKE :email_pattern
        """),
        {"ip": ip, "since": since, "email_pattern": f"%{email}%"}
    )
    failed_count = result.scalar() or 0

    await db.execute(
        text("""
            INSERT INTO security_logs (ip_address, event_type, details, created_at)
            VALUES (:ip, 'failed_login', :details, :now)
        """),
        {
            "ip": ip,
            "details": f"Failed login attempt for email: {email}",
            "now": datetime.utcnow()
        }
    )

    current_attempt = failed_count + 1

    if current_attempt >= MAX_ATTEMPTS:
        await db.execute(
            text("""
                INSERT INTO security_logs (ip_address, event_type, details, created_at)
                VALUES (:ip, 'blocked', :details, :now)
            """),
            {
                "ip": ip,
                "details": f"تم حظر هذا العنوان بعد {MAX_ATTEMPTS} محاولات فاشلة. البريد: {email}",
                "now": datetime.utcnow()
            }
        )
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="تم قفل حسابك مؤقتاً بسبب عدة محاولات دخول غير ناجحة. يرجى المحاولة مرة أخرى لاحقاً.",
        )

    remaining = MAX_ATTEMPTS - current_attempt

    if current_attempt >= 5 and current_attempt <= 7:
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"تنبيه أمني: تبقت {remaining} محاولة قبل قفل الحساب المؤقت.",
        )

    await db.commit()
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="محاولة فاشلة. يرجى التحقق من بيانات الدخول والمحاولة مرة أخرى.",
    )


async def reset_failed_attempts(request: Request, db: AsyncSession, email: str = "") -> None:
    ip = get_client_ip(request)

    await db.execute(
        text("""
            DELETE FROM security_logs
            WHERE ip_address = :ip
              AND event_type IN ('failed_login', 'blocked')
              AND details LIKE :email_pattern
        """),
        {"ip": ip, "email_pattern": f"%{email}%"}
    )
    await db.commit()
