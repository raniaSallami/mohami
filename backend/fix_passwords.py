#!/usr/bin/env python3
"""
Fix all invalid password hashes in the database.
- admin@admin.com: re-hash "passpass"
- Others: convert hex-encoded bcrypt back to proper bcrypt string (if malformed)
- Add --dry-run for preview
"""
import asyncio
import argparse
import bcrypt
import re
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# Import from app for DB setup
from app.database import engine, AsyncSessionLocal
from sqlalchemy import text

def try_decode_hex_bcrypt(hex_str: str) -> str | None:
    """Try to decode a hex-encoded bcrypt hash back to string."""
    try:
        decoded = bytes.fromhex(hex_str).decode('utf-8')
        if decoded.startswith('$2'):
            return decoded
    except Exception:
        pass
    return None


async def fix(dry_run: bool = False):
    print("🚨 BACKUP YOUR DATABASE FIRST!")
    print("💡 Run 'python backend/diagnose_passwords.py' first to see issues.\n")
    
    async with AsyncSessionLocal() as db:
        # Fetch all users
        result = await db.execute(text("SELECT id, email, password FROM users"))
        users = result.mappings().all()

        fixed = 0
        skipped = 0
        errors = 0
        
        for user in users:
            email = user["email"]
            password = user["password"]

            new_hash = None
            
            # Case 1: admin plain text
            if email == "admin@admin.com" and not password.startswith("$2"):
                new_hash = bcrypt.hashpw("passpass".encode(), bcrypt.gensalt()).decode()
                print(f"✅ {email} → re-hashed 'passpass' (dry-run: {dry_run})")

            # Case 2: invalid hex bcrypt
            elif not password.startswith("$2"):
                decoded = try_decode_hex_bcrypt(password)
                if decoded:
                    new_hash = decoded
                    print(f"✅ {email} → decoded hex bcrypt (dry-run: {dry_run})")
                else:
                    print(f"⚠️  {email} → undecodable hash (len: {len(password)})")
                    errors += 1
                    continue
            else:
                print(f"✓  {email} → already valid bcrypt")
                skipped += 1
                continue
            
            # Apply if not dry-run
            if new_hash and not dry_run:
                await db.execute(
                    text("UPDATE users SET password = :pwd WHERE id = :id"),
                    {"pwd": new_hash, "id": user["id"]}
                )
                fixed += 1
            
        if not dry_run:
            await db.commit()
            print(f"\n🎉 Committed {fixed} fixes!")
        else:
            print(f"\n🔍 Dry-run: Would fix {fixed}, skip {skipped}, error {errors}")
        
        print(f"Summary: fixed={fixed}, skipped={skipped}, errors={errors}, total={len(users)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fix invalid password hashes")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without committing")
    args = parser.parse_args()
    
    asyncio.run(fix(dry_run=args.dry_run))

