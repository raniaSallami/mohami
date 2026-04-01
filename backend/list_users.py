#!/usr/bin/env python
"""List all users in the system"""
import os
import sys
from sqlalchemy import create_engine, text

sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)

try:
    engine = create_engine(DATABASE_URL, echo=False)
    
    with engine.connect() as conn:
        print("👥 Users in the system:\n")
        
        result = conn.execute(text("""
            SELECT id, email, role, created_at
            FROM users
            ORDER BY created_at DESC
        """))
        
        for i, (user_id, email, role, created_at) in enumerate(result, 1):
            print(f"{i}. {email} ({role}) - Created: {created_at}")
        
        conn.commit()
    
    engine.dispose()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
