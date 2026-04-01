import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import asyncio
from fastapi import Request
from app.database import AsyncSessionLocal
from app.routers.auth import send_new_device_otp_email

class DummyClient:
    host = "127.0.0.1"

class DummyRequest:
    def __init__(self):
        self.headers = {"User-Agent": "Mozilla/5.0"}
        self.client = DummyClient()

async def test_email():
    async with AsyncSessionLocal() as db:
        req = DummyRequest()
        try:
            await send_new_device_otp_email(
                user_email="test@example.com",
                user_name="Test User",
                otp_code="123456",
                request=req,
                db=db
            )
            print("Successfully executed send_new_device_otp_email")
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_email())
