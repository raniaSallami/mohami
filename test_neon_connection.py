#!/usr/bin/env python3
"""
Test connection to Neon PostgreSQL database
"""
import asyncio
import asyncpg
import sys

async def test_neon():
    # Neon connection details from .env
    connection_string = "postgresql://neondb_owner:npg_nOSa40tXEdJQ@ep-dry-cloud-airaa41g-pooler.c-4.us-east-1.aws.neon.tech/test_bd?sslmode=require"
    
    print("🔍 Testing Neon PostgreSQL Connection...")
    print(f"Host: ep-dry-cloud-airaa41g-pooler.c-4.us-east-1.aws.neon.tech")
    print(f"Database: test_bd")
    print(f"User: neondb_owner")
    print()
    
    try:
        print("⏳ Connecting to Neon...")
        
        # Parse connection string manually for asyncpg
        conn = await asyncpg.connect(
            host="ep-dry-cloud-airaa41g-pooler.c-4.us-east-1.aws.neon.tech",
            port=5432,
            user="neondb_owner",
            password="npg_nOSa40tXEdJQ",
            database="test_bd",
            ssl=True,
            command_timeout=10,
            timeout=10,
        )
        
        print("✅ Connected successfully!")
        
        # Test a simple query
        version = await conn.fetchval('SELECT version();')
        print(f"\n📊 Database version:\n{version}")
        
        # Check tables
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema='public'
            LIMIT 10;
        """)
        
        print(f"\n📋 Tables in database: {len(tables)} found")
        for table in tables:
            print(f"  - {table['table_name']}")
        
        await conn.close()
        print("\n✅ All tests passed! Neon connection is working.")
        return True
        
    except asyncpg.PostgresError as e:
        print(f"❌ PostgreSQL Error: {e}")
        return False
    except asyncpg.InvalidCatalogNameError as e:
        print(f"❌ Database not found: {e}")
        return False
    except asyncpg.CannotConnectNowError as e:
        print(f"❌ Cannot connect right now: {e}")
        return False
    except TimeoutError as e:
        print(f"❌ Connection timeout (Neon may be slow or unreachable): {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_neon())
    sys.exit(0 if success else 1)
