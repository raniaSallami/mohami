"""
Quick migration: add missing columns that the code references.
Run once, then delete.
"""
import asyncio
import sys
import os
import re

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
DATABASE_URL = re.sub(r'[?&](sslmode|channel_binding)=[^&]*', '', DATABASE_URL).rstrip('?&')

engine = create_async_engine(DATABASE_URL, connect_args={"ssl": True, "timeout": 60, "command_timeout": 60})

MIGRATIONS = [
    # Add password_changed_at to users if missing
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'password_changed_at'
        ) THEN
            ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP;
        END IF;
    END $$;
    """,
    # Ensure security_logs has user_id column
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'security_logs' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE security_logs ADD COLUMN user_id VARCHAR(36);
        END IF;
    END $$;
    """,
    # Ensure email_queue table exists
    """
    CREATE TABLE IF NOT EXISTS email_queue (
        id VARCHAR(255) PRIMARY KEY,
        to_email VARCHAR(255) NOT NULL,
        subject VARCHAR(500),
        html_content TEXT,
        text_content TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        error_message TEXT,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
    );
    """,
    # Ensure security_logs table exists
    """
    CREATE TABLE IF NOT EXISTS security_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(36),
        ip_address VARCHAR(100),
        event_type VARCHAR(50),
        details TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    );
    """,
    # Ensure password_reset_otp table exists
    """
    CREATE TABLE IF NOT EXISTS password_reset_otp (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
    );
    """,
    # Ensure refresh_tokens table exists
    """
    CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        token TEXT NOT NULL,
        device_name VARCHAR(255),
        ip_address VARCHAR(100),
        is_revoked BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
    );
    """,
]


async def run_migrations():
    async with engine.begin() as conn:
        for i, sql in enumerate(MIGRATIONS):
            try:
                await conn.execute(text(sql))
                print(f"✅ Migration {i+1}/{len(MIGRATIONS)} OK")
            except Exception as e:
                print(f"⚠️  Migration {i+1}: {e}")
    print("\n✅ All migrations complete!")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run_migrations())
