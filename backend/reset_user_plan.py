#!/usr/bin/env python3
"""
Script to reset user subscription to basic plan
"""
import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db, engine
from app.models.user import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def reset_user_subscription():
    """Reset user amaallboukeri@gmail.com subscription to basic plan"""
    
    async with engine.begin() as conn:
        # Create a new session
        async with AsyncSession(conn) as db:
            try:
                # Find the user by email
                result = await db.execute(
                    select(User).where(User.email == 'amaallboukeri@gmail.com')
                )
                user = result.scalar_one_or_none()
                
                if not user:
                    print("User with email amaallboukeri@gmail.com not found")
                    return False
                
                print(f"Found user: {user.name} ({user.email})")
                print(f"Current plan: {user.subscription_plan}, status: {user.subscription_status}")
                
                # Reset subscription to basic plan
                user.subscription_plan = 'basic'
                user.subscription_status = 'active'
                
                await db.commit()
                await db.refresh(user)
                
                print(f"Updated user plan to: {user.subscription_plan}, status: {user.subscription_status}")
                print("Successfully reset user subscription to basic plan!")
                return True
                
            except Exception as e:
                print(f"Error resetting user subscription: {e}")
                await db.rollback()
                return False

if __name__ == "__main__":
    asyncio.run(reset_user_subscription())
