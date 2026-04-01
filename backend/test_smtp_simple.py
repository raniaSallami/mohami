#!/usr/bin/env python
"""Test SMTP connectivity and check email config"""
import smtplib
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

print(f"🔍 Testing SMTP Configuration")
print(f"  Host: {SMTP_HOST}")
print(f"  Port: {SMTP_PORT}")
print(f"  User: {SMTP_USER}")
print(f"  Password: {'*' * len(SMTP_PASSWORD) if SMTP_PASSWORD else 'NOT SET'}")

if not SMTP_USER or not SMTP_PASSWORD:
    print("❌ SMTP credentials missing!")
    exit(1)

try:
    print("\n📡 Attempting to connect to SMTP server...")
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
        print("✅ Connection established")
        
        print("📡 Sending EHLO...")
        server.ehlo()
        print("✅ EHLO sent")
        
        print("📡 Starting TLS...")
        server.starttls()
        print("✅ TLS started")
        
        print("📡 Sending EHLO again...")
        server.ehlo()
        print("✅ EHLO sent")
        
        print("📡 Attempting login...")
        server.login(SMTP_USER, SMTP_PASSWORD)
        print("✅ LOGIN successful!")
        
        print("✅ SMTP Server is ready and working!")
        
except TimeoutError as e:
    print(f"❌ Timeout: {e}")
except smtplib.SMTPAuthenticationError as e:
    print(f"❌ Authentication error: {e}")
    print("   Check your SMTP_USER and SMTP_PASSWORD")
except smtplib.SMTPException as e:
    print(f"❌ SMTP error: {e}")
except Exception as e:
    print(f"❌ Connection error: {e}")
    import traceback
    traceback.print_exc()
