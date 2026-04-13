#!/usr/bin/env python3
"""
Migration script to add email_verified field to users table.
"""
import asyncio
from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()

async def add_email_verified_field():
    """Add email_verified field to users table."""
    try:
        from app.database import engine
        
        print("Adding email_verified field to users table...")
        
        async with engine.begin() as conn:
            try:
                await conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
                """))
                print("✓ Added email_verified column")
            except Exception as e:
                if "already exists" in str(e):
                    print("✓ email_verified column already exists")
                else:
                    raise
            
            # Create index on email_verified
            try:
                await conn.execute(text("""
                    CREATE INDEX idx_users_email_verified ON users(email_verified);
                """))
                print("✓ Created index on email_verified")
            except Exception as e:
                if "already exists" in str(e):
                    print("✓ Index on email_verified already exists")
                else:
                    raise
            
            await conn.commit()
        
        print("\n✅ Email verification field migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        raise
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(add_email_verified_field())
