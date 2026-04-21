#!/usr/bin/env python3
"""
Script to test checkout functionality for user amaallboukeri@gmail.com
"""
import asyncio
import sys
import os
import json

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from app.models.user import User
from app.routers.subscriptions import checkout_subscription
from app.routers.subscriptions import SubscriptionCheckoutRequest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def test_checkout():
    """Test checkout functionality"""
    async with engine.begin() as conn:
        async with AsyncSession(conn) as db:
            try:
                # Find the user by email
                result = await db.execute(
                    select(User).where(User.email == 'amaallboukeri@gmail.com')
                )
                user = result.scalar_one_or_none()
                
                if not user:
                    print("User not found")
                    return
                
                print(f"Testing checkout for user: {user.name} ({user.email})")
                
                # Test pro plan checkout
                request = SubscriptionCheckoutRequest(
                    plan_name="pro",
                    redirect_base_url="http://localhost:3000"
                )
                
                print("Testing pro plan checkout...")
                try:
                    result = await checkout_subscription(request, db, user)
                    print(f"Checkout successful: {result}")
                except Exception as e:
                    print(f"Checkout failed: {e}")
                    print(f"Error type: {type(e).__name__}")
                
            except Exception as e:
                print(f"Test setup error: {e}")

if __name__ == "__main__":
    asyncio.run(test_checkout())
