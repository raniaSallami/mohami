"""Quick script to check email queue status"""
import asyncio
import re
import os
import sys
from io import StringIO

# Set UTF-8 encoding for output
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv('..\\.env')
DATABASE_URL = os.getenv('DATABASE_URL', '')
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql+asyncpg://', 1)
elif DATABASE_URL.startswith('postgresql://'):
    DATABASE_URL = DATABASE_URL.replace('postgresql://', 'postgresql+asyncpg://', 1)

# Clean up any extra parameters
DATABASE_URL_CLEAN = re.sub(r'[?&](sslmode|channel_binding)=[^&]*', '', DATABASE_URL).rstrip('?&')

async def check_queue():
    try:
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
        async with AsyncSessionLocal() as db:
            result = await db.execute(text('SELECT id, to_email, subject, status, error_message, created_at FROM email_queue ORDER BY created_at DESC LIMIT 20'))
            rows = result.mappings().all()
            if not rows:
                print('✅ Email queue is EMPTY')
            else:
                print(f'📧 Found {len(rows)} email(s) in queue:\n')
                for row in rows:
                    print(f"  ID: {row['id']}")
                    print(f"  To: {row['to_email']}")
                    print(f"  Subject: {row['subject'][:50]}...")
                    print(f"  Status: {row['status']}")
                    if row['error_message']:
                        print(f"  Error: {row['error_message']}")
                    print(f"  Created: {row['created_at']}\n")
        await engine.dispose()
    except Exception as e:
        print(f'❌ Error: {e}')
        import traceback
        traceback.print_exc()

asyncio.run(check_queue())
