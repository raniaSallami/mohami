#!/usr/bin/env python3
"""
Debug script for forgot-password endpoint
"""
import asyncio
import sys
import os
sys.path.append('.')

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from pathlib import Path

# Load environment
parent_dir = Path(__file__).parent.parent
env_file = parent_dir / ".env"
load_dotenv(env_file)

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
DATABASE_URL = DATABASE_URL.split('?')[0] if '?' in DATABASE_URL else DATABASE_URL

async def debug_forgot_password():
    print("=== DEBUG FORGOT PASSWORD ===")

    # Test database connection
    try:
        engine = create_async_engine(DATABASE_URL, echo=True)
        async with engine.begin() as conn:
            print("✅ Database connection OK")

            # Test email_queue table
            result = await conn.execute("SELECT COUNT(*) FROM email_queue")
            count = result.scalar()
            print(f"✅ email_queue table OK, {count} records")

        await engine.dispose()
    except Exception as e:
        print(f"❌ Database error: {e}")
        return

    # Test imports
    try:
        from app.utils.security import verify_recaptcha
        print("✅ verify_recaptcha import OK")

        from app.database import get_db
        print("✅ get_db import OK")

        from app.routers.password_reset import _send_reset_otp_email
        print("✅ _send_reset_otp_email import OK")

    except Exception as e:
        print(f"❌ Import error: {e}")
        import traceback
        traceback.print_exc()
        return

    # Test reCAPTCHA
    try:
        result = await verify_recaptcha("test_token")
        print(f"✅ reCAPTCHA test OK, result: {result}")
    except Exception as e:
        print(f"❌ reCAPTCHA error: {e}")

    print("=== DEBUG COMPLETE ===")

if __name__ == "__main__":
    asyncio.run(debug_forgot_password())