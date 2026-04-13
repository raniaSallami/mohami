#!/usr/bin/env python3
"""
Migration script to add cabinet fields to user_profiles table.
Adds: bar_registration_number, office_address, number_of_lawyers
"""
import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy import text

# Load environment variables
load_dotenv()

async def add_cabinet_fields():
    """Add cabinet-specific fields to user_profiles table."""
    try:
        # Import database connection
        from app.database import engine
        
        print("Adding cabinet fields to user_profiles table...")
        
        async with engine.begin() as conn:
            # Add bar_registration_number column
            try:
                await conn.execute(text("""
                    ALTER TABLE user_profiles 
                    ADD COLUMN bar_registration_number VARCHAR(100) NULL;
                """))
                print("✓ Added bar_registration_number column")
            except Exception as e:
                if "already exists" in str(e):
                    print("✓ bar_registration_number column already exists")
                else:
                    raise
            
            # Add office_address column
            try:
                await conn.execute(text("""
                    ALTER TABLE user_profiles 
                    ADD COLUMN office_address VARCHAR(500) NULL;
                """))
                print("✓ Added office_address column")
            except Exception as e:
                if "already exists" in str(e):
                    print("✓ office_address column already exists")
                else:
                    raise
            
            # Add number_of_lawyers column
            try:
                await conn.execute(text("""
                    ALTER TABLE user_profiles 
                    ADD COLUMN number_of_lawyers INTEGER NULL;
                """))
                print("✓ Added number_of_lawyers column")
            except Exception as e:
                if "already exists" in str(e):
                    print("✓ number_of_lawyers column already exists")
                else:
                    raise
            
            await conn.commit()
        
        print("\n✅ Cabinet fields migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        raise
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(add_cabinet_fields())
