#!/usr/bin/env python
"""Check recent emails sent"""
import os
import sys
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(__file__))
load_dotenv()

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "")

if DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)

print("📧 Récents emails envoyés:\n")

try:
    engine = create_engine(DATABASE_URL, echo=False)
    
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id, to_email, subject, status, sent_at, created_at
            FROM email_queue
            WHERE status = 'sent'
            ORDER BY sent_at DESC
            LIMIT 10
        """))
        
        for i, email_row in enumerate(result, 1):
            print(f"{i}. To: {email_row[1]}")
            print(f"   Subject: {email_row[2]}")
            print(f"   Status: {email_row[3]}")
            print(f"   Sent at: {email_row[4]}")
            print(f"   Created at: {email_row[5]}")
            print()
        
        conn.commit()
    
    engine.dispose()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
