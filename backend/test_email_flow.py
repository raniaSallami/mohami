#!/usr/bin/env python
"""Test email queue creation by simulating OTP flow"""
import os
import sys
from datetime import datetime, timedelta
import uuid

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)

TEST_EMAIL = "hamdiayari.backup@gmail.com"  # Change this to your email

print(f"📧 Testing email queue for: {TEST_EMAIL}\n")

try:
    engine = create_engine(DATABASE_URL, echo=False)
    
    with engine.connect() as conn:
        # Check user exists
        result = conn.execute(text("""
            SELECT id, email, role FROM users WHERE email = :email
        """), {"email": TEST_EMAIL})
        
        user = result.first()
        if not user:
            print(f"❌ User not found: {TEST_EMAIL}")
            print("   Please register first")
            engine.dispose()
            exit(1)
        
        user_id, email, role = user
        print(f"✅ User found: {email} (ID: {user_id}, Role: {role})\n")
        
        # Check OTP records for this user
        print("🔍 Checking device OTP records for this user:")
        result = conn.execute(text("""
            SELECT id, user_id, code, expires_at, created_at
            FROM device_otps
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT 3
        """), {"user_id": user_id})
        
        otps = result.fetchall()
        if otps:
            for otp in otps:
                expires = otp[3]
                is_expired = expires < datetime.utcnow() if expires else False
                status = "❌ EXPIRED" if is_expired else "✅ VALID"
                print(f"  {status} - Code: {otp[2]} - Created: {otp[4]}")
        else:
            print("  ℹ️  No OTP records found")
        
        print("\n📧 Checking email queue entries for this user:")
        result = conn.execute(text("""
            SELECT to_email, subject, status, created_at, sent_at
            FROM email_queue
            WHERE to_email = :email
            ORDER BY created_at DESC
            LIMIT 5
        """), {"email": TEST_EMAIL})
        
        emails = result.fetchall()
        if emails:
            for email_rec in emails:
                to, subject, status, created, sent = email_rec
                print(f"  [{status}] {subject}")
                print(f"        to: {to}")
                print(f"        created: {created}")
                if sent:
                    print(f"        sent: {sent}")
                print()
        else:
            print("  ℹ️  No email queue entries found")
        
        print("\nℹ️  To test email delivery:")
        print(f"  1. Try to login with: {TEST_EMAIL}")
        print(f"  2. Use a NEW browser/device (or clear fingerprint)")
        print(f"  3. Check email in spam folder too")
        print(f"  4. Check the database queue using this script again")
        
        conn.commit()
    
    engine.dispose()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
