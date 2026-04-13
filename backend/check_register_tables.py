
import asyncio
from sqlalchemy import text
from app.database import engine

async def check_schema():
    async with engine.connect() as conn:
        # Check tables
        result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = [row[0] for row in result.fetchall()]
        print(f"Tables: {tables}")
        
        # Check users columns
        if 'users' in tables:
            result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"))
            columns = [row[0] for row in result.fetchall()]
            print(f"Users columns: {columns}")

        # Check user_profiles columns
        if 'user_profiles' in tables:
            result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles'"))
            columns = [row[0] for row in result.fetchall()]
            print(f"User Profiles columns: {columns}")
        else:
            print("❌ user_profiles table is MISSING!")

        # Check registration_otp columns
        if 'registration_otp' in tables:
             result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'registration_otp'"))
             columns = [row[0] for row in result.fetchall()]
             print(f"Registration OTP columns: {columns}")
        else:
            print("❌ registration_otp table is MISSING!")

if __name__ == "__main__":
    asyncio.run(check_schema())
