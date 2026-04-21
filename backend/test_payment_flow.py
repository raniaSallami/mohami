#!/usr/bin/env python3
"""
Script to test payment flow for user amaallboukeri@gmail.com
"""
import asyncio
import sys
import os
import json

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from app.models.user import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def test_payment_flow():
    """Test payment flow"""
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
                
                print(f"=== User Info ===")
                print(f"Name: {user.name}")
                print(f"Email: {user.email}")
                print(f"Current Plan: {user.subscription_plan}")
                print(f"Status: {user.subscription_status}")
                print(f"Role: {user.role}")
                
                # Test if user can make payment
                if user.subscription_plan == 'basic':
                    print("User is on basic plan - can upgrade to pro or enterprise")
                else:
                    print(f"User is on {user.subscription_plan} plan")
                
                print("\n=== Payment Test ===")
                print("Testing payment flow...")
                
                # Check if backend is accessible
                import httpx
                try:
                    async with httpx.AsyncClient() as client:
                        response = await client.get("http://localhost:8000/health")
                        if response.status_code == 200:
                            print("Backend is accessible")
                        else:
                            print(f"Backend returned status {response.status_code}")
                except Exception as e:
                    print(f"Backend not accessible: {e}")
                
            except Exception as e:
                print(f"Test error: {e}")

if __name__ == "__main__":
    asyncio.run(test_payment_flow())
