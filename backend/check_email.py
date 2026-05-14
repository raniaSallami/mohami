#!/usr/bin/env python3
"""
Script to check and clean up duplicate email registrations
"""
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text, select
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.models.user import User
from app.models.registration_otp import RegistrationEmailOTP

# Create async engine
engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def check_and_clean_email(email: str):
    """Check if email exists and optionally delete it"""
    async with AsyncSessionLocal() as session:
        # Check if user exists
        result = await session.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()
        
        if user:
            print(f"✅ Found user with email: {email}")
            print(f"   - ID: {user.id}")
            print(f"   - Name: {user.name}")
            print(f"   - Email verified: {user.email_verified}")
            print(f"   - Created at: {user.created_at}")
            
            # Check registration OTPs
            otp_result = await session.execute(
                select(RegistrationEmailOTP).where(RegistrationEmailOTP.email == email)
            )
            otps = otp_result.scalars().all()
            if otps:
                print(f"   - Found {len(otps)} OTP records")
            
            return True
        else:
            print(f"❌ No user found with email: {email}")
            
            # Check registration OTPs
            otp_result = await session.execute(
                select(RegistrationEmailOTP).where(RegistrationEmailOTP.email == email)
            )
            otps = otp_result.scalars().all()
            if otps:
                print(f"⚠️  Found {len(otps)} pending OTP records (no user yet)")
                for otp in otps:
                    print(f"   - OTP ID: {otp.id}, Verified: {otp.verified}, Expires: {otp.expires_at}")
            return False

async def main():
    email_to_check = "amaallboukeri@gmail.com"
    print(f"Checking email: {email_to_check}\n")
    
    try:
        exists = await check_and_clean_email(email_to_check)
        
        if exists:
            print(f"\n⚠️  Email already exists in database.")
            print(f"   To use a fresh registration, please use a different email address.")
        else:
            print(f"\n✅ Email is available for registration!")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
