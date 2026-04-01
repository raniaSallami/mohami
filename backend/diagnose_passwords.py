import asyncio
from sqlalchemy import text
from app.database import engine

async def diagnose():
    async with engine.connect() as conn:
        result = await conn.execute(text('''
            SELECT id, email, password, LENGTH(password) as pwd_len, 
                   CASE WHEN password ~ '^\$2[abxy]\$\d{2}\$' THEN 'VALID' ELSE 'INVALID' END as format_status
            FROM users 
            ORDER BY pwd_len, email
        '''))
        rows = result.fetchall()
        print("=== DIAGNOSTIC PASSWORDS USERS ===")
        for row in rows:
            print(f"Email: {row[1]} | Len: {row[3]} | Status: {row[4]} | Preview: {row[2][:30]}...")
        print(f"\nTotal users: {len(rows)}")
        invalid = [r for r in rows if r[4] == 'INVALID']
        print(f"Invalid hashes: {len(invalid)}")

asyncio.run(diagnose())

