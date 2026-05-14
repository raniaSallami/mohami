#!/usr/bin/env python3
"""
Migration script to add language field to users table.
"""
import asyncio
from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()

async def add_language_field():
    """Add language field to users table."""
    try:
        from app.database import engine
        
        print("Adding language field to users table...")
        
        async with engine.begin() as conn:
            try:
                await conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN language VARCHAR(10) DEFAULT 'ar' NOT NULL;
                """))
                print("✓ Added language column")
            except Exception as e:
                if "already exists" in str(e):
                    print("✓ language column already exists")
                else:
                    raise
            
            await conn.commit()
        
        print("\n✅ Language field migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        raise
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(add_language_field())