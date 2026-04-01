"""Quick SMTP connectivity test"""
import smtplib
import os
from dotenv import load_dotenv

load_dotenv('..\\.env')

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

print(f"Testing SMTP connection to {SMTP_HOST}:{SMTP_PORT}")
print(f"User: {SMTP_USER}")

try:
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
        print("✓ Connected to SMTP server")
        
        server.ehlo()
        print("✓ EHLO command successful")
        
        server.starttls()
        print("✓ STARTTLS enabled (TLS encryption active)")
        
        server.ehlo()
        print("✓ Second EHLO successful")
        
        server.login(SMTP_USER, SMTP_PASSWORD)
        print(f"✓ Successfully authenticated as {SMTP_USER}")
        
    print("\n✅ SMTP connectivity verified successfully!")
    print("   All email systems are operational.")
    
except smtplib.SMTPAuthenticationError as e:
    print(f"\n❌ SMTP Authentication failed: {e}")
    print("   Check SMTP_USER and SMTP_PASSWORD in .env")
    
except smtplib.SMTPException as e:
    print(f"\n❌ SMTP error: {e}")
    
except Exception as e:
    print(f"\n❌ Connection error: {e}")
