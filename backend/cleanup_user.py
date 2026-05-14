#!/usr/bin/env python3
"""
Script to remove a user and their associated OTP records
"""
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, delete
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.models.user import User
from app.models.registration_otp import RegistrationEmailOTP
from app.database import engine, AsyncSessionLocal

async def remove_user_by_email(email: str):
    """Remove user and all associated OTP records"""
    async with AsyncSessionLocal() as session:
        try:
            from sqlalchemy import text
            
            # Find user by email
            result = await session.execute(
                select(User).where(User.email == email)
            )
            user = result.scalar_one_or_none()
            
            if user:
                user_id = str(user.id)
                print(f"🗑️  Deleting associated records for user: {user.name} ({email})")
                
                # Delete related records in proper order (cascade handling)
                try:
                    # Delete cases
                    await session.execute(
                        text("DELETE FROM cases WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    )
                    await session.commit()
                    print("   ✓ Cases deleted")
                except Exception as e:
                    print(f"   ⚠️  Could not delete cases: {type(e).__name__} - {e}")
                    await session.rollback()
                
                try:
                    # Delete invoices
                    await session.execute(
                        text("DELETE FROM invoices WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    )
                    await session.commit()
                    print("   ✓ Invoices deleted")
                except Exception as e:
                    print(f"   ⚠️  Could not delete invoices: {type(e).__name__} - {e}")
                    await session.rollback()
                
                try:
                    # Delete user profile
                    await session.execute(
                        text("DELETE FROM user_profiles WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    )
                    await session.commit()
                    print("   ✓ User profile deleted")
                except Exception as e:
                    print(f"   ⚠️  Could not delete profile: {type(e).__name__} - {e}")
                    await session.rollback()
                
                try:
                    # Delete refresh tokens
                    await session.execute(
                        text("DELETE FROM refresh_tokens WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    )
                    await session.commit()
                    print("   ✓ Refresh tokens deleted")
                except Exception as e:
                    print(f"   ⚠️  Could not delete refresh tokens: {type(e).__name__} - {e}")
                    await session.rollback()
                
                try:
                    # Delete known device records
                    await session.execute(
                        text("DELETE FROM known_devices WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    )
                    await session.commit()
                    print("   ✓ Known devices deleted")
                except Exception as e:
                    print(f"   ⚠️  Could not delete known devices: {type(e).__name__} - {e}")
                    await session.rollback()
                
                try:
                    # Delete login history
                    await session.execute(
                        text("DELETE FROM login_history WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    )
                    await session.commit()
                    print("   ✓ Login history deleted")
                except Exception as e:
                    print(f"   ⚠️  Could not delete login history: {type(e).__name__} - {e}")
                    await session.rollback()
                
                try:
                    # Delete user (main table)
                    await session.execute(
                        text("DELETE FROM users WHERE id = :user_id"),
                        {"user_id": user_id}
                    )
                    await session.commit()
                    print("   ✓ User deleted")
                except Exception as e:
                    print(f"   ⚠️  Could not delete user: {type(e).__name__} - {e}")
                    await session.rollback()
                
                print(f"✅ User and associated records deletion attempted")
            else:
                print(f"⚠️  No user found with email: {email}")
            
            # Delete all OTP records for this email
            result = await session.execute(
                select(RegistrationEmailOTP).where(RegistrationEmailOTP.email == email)
            )
            otps = result.scalars().all()
            
            if otps:
                print(f"🗑️  Deleting {len(otps)} OTP records...")
                for otp in otps:
                    await session.delete(otp)
                await session.commit()
                print(f"✅ OTP records deleted")
            
            print(f"\n✅ Cleanup complete! Email is now available for registration.")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            await session.rollback()

async def main():
    email_to_remove = "amaallboukeri@gmail.com"
    print(f"Removing user and OTP records for: {email_to_remove}\n")
    
    try:
        await remove_user_by_email(email_to_remove)
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
