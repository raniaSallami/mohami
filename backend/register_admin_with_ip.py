"""
Register admin device with custom IP address.
Allows bypassing OTP for specific IP ranges.
"""
import asyncio
import sys
import os
from datetime import datetime
from sqlalchemy import select

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from app.database import AsyncSessionLocal
from app.models.user import User, KnownDevice
import uuid


async def register_admin_with_ip(custom_ip: str):
    """Register admin device with a specific IP address."""
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
            
            # Check if this IP is already registered
            existing = await db.execute(
                select(KnownDevice).where(
                    KnownDevice.user_id == admin.id,
                    KnownDevice.ip_address == custom_ip
                )
            )
            if existing.scalar_one_or_none():
                print(f"✅ Admin device already registered for IP {custom_ip}")
                return
            
            # Create device entry with custom IP
            device = KnownDevice(
                user_id=admin.id,
                fingerprint=f"admin_device_{custom_ip}",
                device_name="Admin Home Device",
                ip_address=custom_ip,
                country="Home",
                city="Local",
            )
            
            db.add(device)
            await db.commit()
            
            print(f"✅ Admin device registered!")
            print(f"   User: {admin.email}")
            print(f"   Device: Admin Home Device")
            print(f"   IP: {custom_ip}")
            print(f"\nAdmin will no longer get OTP when logging in from {custom_ip}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            await db.rollback()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python register_admin_with_ip.py <IP_ADDRESS>")
        print("Example: python register_admin_with_ip.py 203.0.113.42")
        sys.exit(1)
    
    custom_ip = sys.argv[1]
    print("=" * 60)
    print(f"REGISTERING ADMIN DEVICE FOR IP: {custom_ip}")
    print("=" * 60)
    asyncio.run(register_admin_with_ip(custom_ip))
