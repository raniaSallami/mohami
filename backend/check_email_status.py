#!/usr/bin/env python
"""Check email queue and worker status"""
import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env")
    exit(1)

async def check_email_status():
    print(f"📧 Connecting to database...")
    
    try:
        engine = create_async_engine(
            DATABASE_URL,
            echo=False,
            connect_args={
                "timeout": 10,
                "ssl": True,
                "server_settings": {"application_name": "email_status_checker"}
            }
        )
        
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session() as session:
            # Check email_queue
            print("\n📮 Checking email_queue table:")
            result = await session.execute(text("""
                SELECT COUNT(*) as total, 
                       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                       SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
                FROM email_queue
            """))
            
            row = result.first()
            if row:
                print(f"  Total: {row[0]}")
                print(f"  Pending: {row[1]}")
                print(f"  Sent: {row[2]}")
                print(f"  Failed: {row[3]}")
            
            # Show pending emails with details
            print("\n⏳ Pending emails:")
            result = await session.execute(text("""
                SELECT id, recipient, subject, status, error_message, created_at, last_attempt
                FROM email_queue
                WHERE status = 'pending'
                ORDER BY created_at DESC
                LIMIT 5
            """))
            
            rows = result.fetchall()
            if rows:
                for row in rows:
                    print(f"\n  ID: {row[0]}")
                    print(f"  To: {row[1]}")
                    print(f"  Subject: {row[2]}")
                    print(f"  Status: {row[3]}")
                    if row[4]:
                        print(f"  Error: {row[4]}")
                    print(f"  Created: {row[5]}")
                    print(f"  Last attempt: {row[6]}")
            else:
                print("  ✓ No pending emails")
            
            # Show recently failed emails
            print("\n❌ Recently failed emails:")
            result = await session.execute(text("""
                SELECT id, recipient, subject, error_message, created_at
                FROM email_queue
                WHERE status = 'failed'
                ORDER BY created_at DESC
                LIMIT 3
            """))
            
            rows = result.fetchall()
            if rows:
                for row in rows:
                    print(f"\n  ID: {row[0]}")
                    print(f"  To: {row[1]}")
                    print(f"  Subject: {row[2]}")
                    print(f"  Error: {row[3]}")
                    print(f"  Created: {row[4]}")
            else:
                print("  ✓ No failed emails")
        
        await engine.dispose()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_email_status())
