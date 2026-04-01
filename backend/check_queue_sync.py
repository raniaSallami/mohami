#!/usr/bin/env python
"""Check email queue status"""
import os
import sys
from dotenv import load_dotenv

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

load_dotenv()

# Use sync SQLAlchemy to check queue
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "")

# Convert to sync driver
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    pass  # Already sync
else:
    print(f"❌ Invalid DATABASE_URL: {DATABASE_URL}")
    exit(1)

print(f"📧 Connecting to database: {DATABASE_URL[:50]}...")

try:
    engine = create_engine(DATABASE_URL, echo=False)
    
    with engine.connect() as conn:
        print("✅ Database connection successful\n")
        
        # Check email_queue table stats
        print("📊 Email Queue Statistics:")
        result = conn.execute(text("""
            SELECT COUNT(*) as total, 
                   SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                   SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                   SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM email_queue
        """))
        
        row = result.first()
        print(f"  Total emails: {row[0]}")
        print(f"  Pending: {row[1]}")
        print(f"  Sent: {row[2]}")
        print(f"  Failed: {row[3]}\n")
        
        # Show pending emails
        if row[1] > 0:
            print("⏳ Pending emails to send:")
            result = conn.execute(text("""
                SELECT id, to_email, subject, created_at, last_attempt
                FROM email_queue
                WHERE status = 'pending'
                ORDER BY created_at DESC
                LIMIT 5
            """))
            
            for email_row in result:
                print(f"  - To: {email_row[1]}")
                print(f"    Subject: {email_row[2]}")
                print(f"    Created: {email_row[3]}")
                print(f"    Last attempt: {email_row[4]}\n")
        else:
            print("✅ No pending emails\n")
            
        # Show failed emails
        result = conn.execute(text("""
            SELECT COUNT(*) FROM email_queue WHERE status = 'failed'
        """))
        failed_count = result.first()[0]
        
        if failed_count > 0:
            print(f"❌ Failed emails: {failed_count}")
            result = conn.execute(text("""
                SELECT id, to_email, subject, error_message, last_attempt
                FROM email_queue
                WHERE status = 'failed'
                ORDER BY last_attempt DESC
                LIMIT 3
            """))
            
            for email_row in result:
                print(f"  - To: {email_row[1]}")
                print(f"    Subject: {email_row[2]}")
                print(f"    Error: {email_row[3]}")
                print(f"    Last attempt: {email_row[4]}\n")
        
        conn.commit()
    
    engine.dispose()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
