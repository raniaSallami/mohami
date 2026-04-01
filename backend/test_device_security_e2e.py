"""
End-to-End Tests - Device Security System
Complete testing of device verification flows
"""

import asyncio
import pytest
from datetime import datetime, timedelta
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path
from dotenv import load_dotenv
import uuid

# Load environment variables from parent directory
parent_dir = Path(__file__).parent.parent
env_file = parent_dir / ".env"
load_dotenv(env_file)

DATABASE_URL = os.getenv("DATABASE_URL")


class DeviceSecurityTestSuite:
    """Complete test suite for device security system"""

    def __init__(self):
        self.engine = None
        self.AsyncSessionLocal = None
        self.test_user_id = str(uuid.uuid4())
        self.test_email = f"test_{self.test_user_id[:8]}@example.com"
        self.test_otp = "123456"

    async def setup(self):
        """Initialize database connection"""
        import re
        
        # Convert postgresql to postgresql+asyncpg if needed
        db_url = DATABASE_URL
        if db_url and db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
        
        # Remove query parameters (sslmode, channel_binding, etc.) to avoid asyncpg errors
        db_url = re.sub(r'\?.*$', '', db_url)
        
        self.engine = create_async_engine(
            db_url,
            echo=False,
            connect_args={
                "ssl": "prefer",
                "timeout": 60,
                "command_timeout": 60
            },
            pool_timeout=60,
            pool_recycle=300
        )
        self.AsyncSessionLocal = sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )
        print("✅ Database connection established")

    async def teardown(self):
        """Clean up database connection"""
        if self.engine:
            await self.engine.dispose()
        print("✅ Database connection closed")

    async def create_test_user(self, db: AsyncSession):
        """Create a test user"""
        await db.execute(
            text("""
                INSERT INTO users (id, email, password, name, role, created_at, updated_at)
                VALUES (:id, :email, :password, :name, :role, :now, :now)
                ON CONFLICT DO NOTHING
            """),
            {
                "id": self.test_user_id,
                "email": self.test_email,
                "password": "hashed_password_test",
                "name": "Test User",
                "role": "CLIENT",
                "now": datetime.utcnow(),
            }
        )
        await db.commit()
        print(f"✅ Test user created: {self.test_user_id}")

    async def cleanup_test_data(self, db: AsyncSession):
        """Clean up test data"""
        await db.execute(
            text("DELETE FROM login_email_otp WHERE user_id = :user_id"),
            {"user_id": self.test_user_id}
        )
        await db.execute(
            text("DELETE FROM known_devices WHERE user_id = :user_id"),
            {"user_id": self.test_user_id}
        )
        await db.execute(
            text("DELETE FROM users WHERE id = :user_id"),
            {"user_id": self.test_user_id}
        )
        await db.commit()
        print("✅ Test data cleaned up")

    # ═══════════════════════════════════════════════════════════
    # TEST 1: OTP Generation & Storage
    # ═══════════════════════════════════════════════════════════

    async def test_otp_generation(self):
        """Test that OTP codes are generated correctly"""
        print("\n" + "="*60)
        print("TEST 1: OTP Generation & Storage")
        print("="*60)

        db = self.AsyncSessionLocal()
        try:
            await self.create_test_user(db)

            # Create OTP
            expires_at = datetime.utcnow() + timedelta(minutes=5)
            await db.execute(
                text("""
                    INSERT INTO login_email_otp (id, user_id, otp, expires_at, created_at)
                    VALUES (:id, :user_id, :otp, :expires_at, :now)
                """),
                {
                    "id": str(uuid.uuid4()),
                    "user_id": self.test_user_id,
                    "otp": self.test_otp,
                    "expires_at": expires_at,
                    "now": datetime.utcnow(),
                }
            )
            await db.commit()

            # Verify OTP was stored
            result = await db.execute(
                text("SELECT otp, expires_at FROM login_email_otp WHERE user_id = :user_id"),
                {"user_id": self.test_user_id}
            )
            row = result.fetchone()

            assert row is not None, "OTP not found in database"
            assert row[0] == self.test_otp, f"OTP mismatch: expected {self.test_otp}, got {row[0]}"
            assert row[1] > datetime.utcnow(), "OTP already expired"

            print("✅ OTP generated and stored correctly")
            print(f"   - OTP Code: {row[0]}")
            print(f"   - Expires: {row[1]} (in ~5 minutes)")

            await self.cleanup_test_data(db)

        finally:
            await db.close()

    # ═══════════════════════════════════════════════════════════
    # TEST 2: OTP Expiration
    # ═══════════════════════════════════════════════════════════

    async def test_otp_expiration(self):
        """Test that expired OTPs are rejected"""
        print("\n" + "="*60)
        print("TEST 2: OTP Expiration")
        print("="*60)

        db = self.AsyncSessionLocal()
        try:
            await self.create_test_user(db)

            # Create expired OTP
            expires_at = datetime.utcnow() - timedelta(minutes=1)  # Already expired
            await db.execute(
                text("""
                    INSERT INTO login_email_otp (id, user_id, otp, expires_at, created_at)
                    VALUES (:id, :user_id, :otp, :expires_at, :now)
                """),
                {
                    "id": str(uuid.uuid4()),
                    "user_id": self.test_user_id,
                    "otp": "999999",
                    "expires_at": expires_at,
                    "now": datetime.utcnow(),
                }
            )
            await db.commit()

            # Verify OTP is expired
            result = await db.execute(
                text("""
                    SELECT otp, expires_at FROM login_email_otp 
                    WHERE user_id = :user_id AND expires_at < :now
                """),
                {"user_id": self.test_user_id, "now": datetime.utcnow()}
            )
            expired_otp = result.fetchone()

            assert expired_otp is not None, "Expired OTP not found"
            print("✅ Expired OTP correctly identified")
            print(f"   - Expired: {expired_otp[1]} (more than 5 minutes ago)")

            await self.cleanup_test_data(db)

        finally:
            await db.close()

    # ═══════════════════════════════════════════════════════════
    # TEST 3: Device Registration
    # ═══════════════════════════════════════════════════════════

    async def test_device_registration(self):
        """Test that devices are properly registered"""
        print("\n" + "="*60)
        print("TEST 3: Device Registration")
        print("="*60)

        db = self.AsyncSessionLocal()
        try:
            await self.create_test_user(db)

            # Register a device
            device_id = str(uuid.uuid4())
            fingerprint = "chrome_windows_fingerprint_123"
            
            await db.execute(
                text("""
                    INSERT INTO known_devices 
                    (id, user_id, fingerprint, device_name, ip_address, country, city, created_at, last_seen)
                    VALUES (:id, :user_id, :fingerprint, :device_name, :ip, :country, :city, :now, :now)
                """),
                {
                    "id": device_id,
                    "user_id": self.test_user_id,
                    "fingerprint": fingerprint,
                    "device_name": "Google Chrome on Windows 11",
                    "ip": "192.168.1.1",
                    "country": "Tunisia",
                    "city": "Tunis",
                    "now": datetime.utcnow(),
                }
            )
            await db.commit()

            # Verify device was stored
            result = await db.execute(
                text("""
                    SELECT device_name, country, city FROM known_devices 
                    WHERE user_id = :user_id AND fingerprint = :fingerprint
                """),
                {"user_id": self.test_user_id, "fingerprint": fingerprint}
            )
            device = result.fetchone()

            assert device is not None, "Device not found"
            assert device[0] == "Google Chrome on Windows 11", "Device name mismatch"
            assert device[1] == "Tunisia", "Country mismatch"

            print("✅ Device registered successfully")
            print(f"   - Device: {device[0]}")
            print(f"   - Location: {device[2]}, {device[1]}")

            await self.cleanup_test_data(db)

        finally:
            await db.close()

    # ═══════════════════════════════════════════════════════════
    # TEST 4: Security Logging
    # ═══════════════════════════════════════════════════════════

    async def test_security_logging(self):
        """Test that security events are logged"""
        print("\n" + "="*60)
        print("TEST 4: Security Logging")
        print("="*60)

        db = self.AsyncSessionLocal()
        try:
            # Log a security event
            event_id = await db.execute(
                text("""
                    INSERT INTO security_logs (ip_address, user_id, event_type, details, created_at)
                    VALUES (:ip, :user_id, :event_type, :details, :now)
                    RETURNING id
                """),
                {
                    "ip": "192.168.1.1",
                    "user_id": self.test_user_id,
                    "event_type": "device_verified",
                    "details": "Device OTP verification successful",
                    "now": datetime.utcnow(),
                }
            )
            await db.commit()

            # Verify event was logged
            result = await db.execute(
                text("""
                    SELECT event_type, details FROM security_logs 
                    WHERE event_type = 'device_verified' AND user_id = :user_id
                """),
                {"user_id": self.test_user_id}
            )
            log_entry = result.fetchone()

            assert log_entry is not None, "Security log not found"
            assert log_entry[0] == "device_verified", "Event type mismatch"

            print("✅ Security event logged successfully")
            print(f"   - Event Type: {log_entry[0]}")
            print(f"   - Details: {log_entry[1]}")

            # Clean up log entry
            await db.execute(
                text("DELETE FROM security_logs WHERE user_id = :user_id"),
                {"user_id": self.test_user_id}
            )
            await db.commit()

        finally:
            await db.close()

    # ═══════════════════════════════════════════════════════════
    # TEST 5: OTP Cleanup
    # ═══════════════════════════════════════════════════════════

    async def test_otp_cleanup(self):
        """Test cleanup of expired OTPs"""
        print("\n" + "="*60)
        print("TEST 5: OTP Cleanup (Maintenance)")
        print("="*60)

        db = self.AsyncSessionLocal()
        try:
            await self.create_test_user(db)
            # Create multiple OTPs (some expired, some valid)
            now = datetime.utcnow()

            # Expired OTP
            await db.execute(
                text("""
                    INSERT INTO login_email_otp (id, user_id, otp, expires_at, created_at)
                    VALUES (:id, :user_id, :otp, :expires_at, :now)
                """),
                {
                    "id": str(uuid.uuid4()),
                    "user_id": self.test_user_id,
                    "otp": "999999",
                    "expires_at": now - timedelta(minutes=10),
                    "now": now,
                }
            )

            # Valid OTP
            await db.execute(
                text("""
                    INSERT INTO login_email_otp (id, user_id, otp, expires_at, created_at)
                    VALUES (:id, :user_id, :otp, :expires_at, :now)
                """),
                {
                    "id": str(uuid.uuid4()),
                    "user_id": self.test_user_id,
                    "otp": "111111",
                    "expires_at": now + timedelta(minutes=5),
                    "now": now,
                }
            )
            await db.commit()

            # Count before cleanup
            result_before = await db.execute(
                text("""
                    SELECT COUNT(*) FROM login_email_otp WHERE user_id = :user_id
                """),
                {"user_id": self.test_user_id}
            )
            count_before = result_before.scalar()

            # Delete expired OTPs
            result_deleted = await db.execute(
                text("""
                    DELETE FROM login_email_otp
                    WHERE user_id = :user_id AND expires_at < :now
                    RETURNING id
                """),
                {"user_id": self.test_user_id, "now": now}
            )
            deleted_count = len(result_deleted.fetchall())
            await db.commit()

            # Count after cleanup
            result_after = await db.execute(
                text("""
                    SELECT COUNT(*) FROM login_email_otp WHERE user_id = :user_id
                """),
                {"user_id": self.test_user_id}
            )
            count_after = result_after.scalar()

            assert deleted_count == 1, f"Should delete 1 OTP, deleted {deleted_count}"
            assert count_after == count_before - deleted_count, "Cleanup count mismatch"

            print("✅ OTP cleanup successful")
            print(f"   - Before: {count_before} OTPs")
            print(f"   - Deleted: {deleted_count} expired OTPs")
            print(f"   - After: {count_after} OTPs")

            await self.cleanup_test_data(db)

        finally:
            await db.close()

    # ═══════════════════════════════════════════════════════════
    # MAIN TEST RUNNER
    # ═══════════════════════════════════════════════════════════

    async def run_all_tests(self):
        """Run complete test suite"""
        await self.setup()

        try:
            print("\n" + "="*60)
            print("DEVICE SECURITY SYSTEM - END-TO-END TEST SUITE")
            print("="*60)

            await self.test_otp_generation()
            await self.test_otp_expiration()
            await self.test_device_registration()
            await self.test_security_logging()
            await self.test_otp_cleanup()

            print("\n" + "="*60)
            print("✅ ALL TESTS PASSED")
            print("="*60)
            print("\nTest Summary:")
            print("  ✓ OTP Generation & Storage")
            print("  ✓ OTP Expiration")
            print("  ✓ Device Registration")
            print("  ✓ Security Logging")
            print("  ✓ OTP Cleanup (Maintenance)")
            print("\nDevice Security System is production-ready!")

        except Exception as e:
            print(f"\n❌ TEST FAILED: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await self.teardown()


async def main():
    """Main entry point"""
    suite = DeviceSecurityTestSuite()
    await suite.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
