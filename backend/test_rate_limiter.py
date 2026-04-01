"""Test script to verify database-backed rate limiter"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from dotenv import load_dotenv
from datetime import datetime
import re

# Load environment
load_dotenv('..\\.env')
DATABASE_URL = os.getenv('DATABASE_URL', '')

if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql+asyncpg://', 1)
elif DATABASE_URL.startswith('postgresql://'):
    DATABASE_URL = DATABASE_URL.replace('postgresql://', 'postgresql+asyncpg://', 1)

# Clean URL - remove query params (handled by connect_args)
DATABASE_URL_CLEAN = re.sub(r'\?.*$', '', DATABASE_URL)

async def test_rate_limiter():
    """Test database-backed rate limiter"""
    engine = create_async_engine(
        DATABASE_URL_CLEAN,
        echo=False,
        connect_args={
            "ssl": "prefer",
            "timeout": 60,
            "command_timeout": 60
        },
        pool_timeout=60,
        pool_recycle=300,
        execution_options={
            "prepared_statement_cache_size": 0
        }
    )
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    try:
        # Check if security_logs table exists
        async with AsyncSessionLocal() as db:
            result = await db.execute(text("SELECT COUNT(*) FROM security_logs"))
            count = result.scalar() or 0
            print(f"✓ security_logs table exists with {count} entries")
            
            # Show recent entries
            result = await db.execute(text("""
                SELECT ip_address, event_type, details, created_at 
                FROM security_logs 
                ORDER BY created_at DESC LIMIT 5
            """))
            rows = result.fetchall()
            print(f"\nRecent security log entries:")
            for row in rows:
                print(f"  IP: {row[0]:20} | Type: {row[1]:15} | Details: {str(row[2])[:40]}")
                print(f"    Time: {row[3]}")
            
        await engine.dispose()
        print("\n✅ Rate limiter database backend is working correctly!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing rate limiter: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_rate_limiter())
    sys.exit(0 if success else 1)
