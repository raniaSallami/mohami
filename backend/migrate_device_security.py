"""
Database Migration Script - Device Security System
Ensures all required tables exist with proper schema
"""

import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from parent directory
parent_dir = Path(__file__).parent.parent
env_file = parent_dir / ".env"
load_dotenv(env_file)

DATABASE_URL = os.getenv("DATABASE_URL")

async def create_tables():
    """Create all required tables for device security system"""
    
    import re
    
    # Convert postgresql to postgresql+asyncpg if needed
    db_url = DATABASE_URL
    if db_url and db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
    
    # Remove query parameters (sslmode, channel_binding, etc.) to avoid asyncpg errors
    db_url = re.sub(r'\?.*$', '', db_url)
    
    engine = create_async_engine(
        db_url, 
        echo=False,
        connect_args={
            "ssl": "prefer",
            "timeout": 60,
            "command_timeout": 60
        },
        pool_timeout=60,
        pool_recycle=300
    )
    
    try:
        async with engine.begin() as conn:
            print("\n" + "="*60)
            print("DATABASE MIGRATION - Device Security System")
            print("="*60)
            
            # Table 1: login_email_otp
            print("\n✅ Ensuring login_email_otp table...")
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS login_email_otp (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    otp VARCHAR(6) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_user_id (user_id),
                    INDEX idx_expires_at (expires_at)
                );
            """))
            print("   ✓ login_email_otp table ready")
            
            # Table 2: known_devices
            print("\n✅ Ensuring known_devices table...")
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS known_devices (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    fingerprint VARCHAR(255) NOT NULL,
                    device_name VARCHAR(255),
                    ip_address VARCHAR(100),
                    country VARCHAR(100),
                    city VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_user_id (user_id),
                    INDEX idx_fingerprint (fingerprint),
                    INDEX idx_last_seen (last_seen)
                );
            """))
            print("   ✓ known_devices table ready")
            
            # Table 3: security_logs
            print("\n✅ Ensuring security_logs table...")
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS security_logs (
                    id VARCHAR(36) PRIMARY KEY,
                    ip_address VARCHAR(100),
                    user_id VARCHAR(36),
                    event_type VARCHAR(50) NOT NULL,
                    details TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            # Ensure user_id exists for backward compatibility
            await conn.execute(text("ALTER TABLE security_logs ADD COLUMN IF NOT EXISTS user_id VARCHAR(36);"))
            
            await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs (event_type);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address ON security_logs (ip_address);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs (user_id);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs (created_at);"))
            
            # Table 4: refresh_tokens (if not exists)
            print("\n✅ Ensuring refresh_tokens table...")
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS refresh_tokens (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    token VARCHAR(500) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);"))
            print("   ✓ refresh_tokens table ready")
            
            # Table 5: email_queue (if not exists)
            print("\n✅ Ensuring email_queue table...")
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS email_queue (
                    id VARCHAR(100) PRIMARY KEY,
                    to_email VARCHAR(255) NOT NULL,
                    subject VARCHAR(255) NOT NULL,
                    html_content TEXT NOT NULL,
                    text_content TEXT,
                    status VARCHAR(50) DEFAULT 'pending',
                    retry_count INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    sent_at TIMESTAMP
                );
            """))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue (status);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue (created_at);"))
            print("   ✓ email_queue table ready")

            # Add columns to users table if missing
        print("\n✅ Checking users table for device security columns...")
        try:
            await conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT FALSE;
            """))
            print("   ✓ password_reset_required column added")
        except Exception as e:
            print(f"   ℹ password_reset_required column already exists or error: {e}")

        print("\n" + "="*60)
        print("✅ DATABASE MIGRATION COMPLETE")
        print("="*60)
        print("\nTables Ready:")
        print("  - login_email_otp (OTP storage)")
        print("  - known_devices (Trusted device fingerprints)")
        print("  - security_logs (Audit trail)")
        print("  - refresh_tokens (Active sessions)")
        print("  - email_queue (Email delivery)")
        print("  - users (Enhanced with password_reset_required)")
        print("\nDevice Security System is ready for production!")
    except Exception as e:
        print(f"\n❌ Database migration error: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_tables())
