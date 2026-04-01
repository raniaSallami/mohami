import asyncio
from app.routers.password_reset import forgot_password, ForgotPasswordRequest
from app.database import AsyncSessionLocal
from fastapi import Request

class DummyClient:
    host='127.0.0.1'

class DummyRequest:
    client=DummyClient()
    headers={}

async def main():
    request = ForgotPasswordRequest(email='test@example.com', recaptcha_token='invalid_token')
    try:
        async with AsyncSessionLocal() as db:
            result = await forgot_password(request, DummyRequest(), db)
            print('Result:', result)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__=='__main__':
    asyncio.run(main())