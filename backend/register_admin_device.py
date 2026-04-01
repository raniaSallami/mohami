"""
Register admin device to skip OTP verification.
Run this once to register your admin account's device and IP.
"""
import asyncio
import os
import sys
from datetime import datetime
from sqlalchemy import select, text

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from app.database import AsyncSessionLocal
from app.models.user import User, KnownDevice
from app.utils.device_security import get_client_ip, parse_device_name
import uuid


async def register_admin_device():
    """Register admin device with current system info."""
    async with AsyncSessionLocal() as db:
        try:
            # Find admin user
            result = await db.execute(
                select(User).where(User.email == "admin@admin.com")
            )
            admin = result.scalar_one_or_none()
            
            if not admin:
                print("❌ Admin user not found")
                return
            
            # Check if device already registered
            existing = await db.execute(
                select(KnownDevice).where(KnownDevice.user_id == admin.id)
            )
            if existing.scalar_one_or_none():
                print(f"✅ Admin device already registered for {admin.email}")
                return
            
            # Create device entry for admin
            # Use generic localhost fingerprint since this is admin
            device = KnownDevice(
                user_id=admin.id,
                fingerprint="admin_device_localhost",
                device_name="Admin Console",
                ip_address="127.0.0.1",
                country="Local",
                city="Local",
            )
            
            db.add(device)
            await db.commit()
            
            print(f"✅ Admin device registered!")
            print(f"   User: {admin.email}")
            print(f"   Device: Admin Console")
            print(f"   IP: 127.0.0.1 (localhost)")
            print(f"\nAdmin will no longer get OTP for local logins")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            await db.rollback()


if __name__ == "__main__":
    print("=" * 60)
    print("REGISTERING ADMIN DEVICE")
    print("=" * 60)
    asyncio.run(register_admin_device())
