#!/usr/bin/env python3
"""
Script to debug user state and potential issues
"""
import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from app.models.user import User
from app.models.invoice import Invoice
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def debug_user_state():
    """Debug user state for amaallboukeri@gmail.com"""
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
                
                print(f"=== User Debug Info ===")
                print(f"Name: {user.name}")
                print(f"Email: {user.email}")
                print(f"ID: {user.id}")
                print(f"Subscription Plan: {user.subscription_plan}")
                print(f"Subscription Status: {user.subscription_status}")
                print(f"Role: {user.role}")
                print(f"Account Type: {getattr(user, 'account_type', 'N/A')}")
                
                # Check recent invoices
                result = await db.execute(
                    select(Invoice).where(Invoice.user_id == user.id)
                    .order_by(Invoice.created_at.desc())
                    .limit(3)
                )
                invoices = result.scalars().all()
                
                print(f"\n=== Recent Invoices ===")
                if invoices:
                    for inv in invoices:
                        print(f"Invoice ID: {inv.id}")
                        print(f"Date: {inv.date}")
                        print(f"Amount: {inv.amount}")
                        print(f"Plan: {inv.plan_name}")
                        print(f"Status: {inv.status}")
                        print(f"ClicToPay Order ID: {inv.clictopay_order_id}")
                        print("---")
                else:
                    print("No invoices found")
                
                print(f"\n=== Potential Issues ===")
                
                # Check if user can upgrade
                if user.subscription_plan == 'basic':
                    print("User is on basic plan - should be able to upgrade")
                else:
                    print("User is not on basic plan - upgrade button might not show")
                
                # Check subscription status
                if user.subscription_status != 'active':
                    print(f"Subscription status is '{user.subscription_status}' - might cause issues")
                else:
                    print("Subscription status is active - OK")
                
                # Check for any pending invoices
                pending_invoices = [inv for inv in invoices if inv.status == 'pending']
                if pending_invoices:
                    print(f"Found {len(pending_invoices)} pending invoices - might block upgrades")
                else:
                    print("No pending invoices - OK")
                
            except Exception as e:
                print(f"Error debugging user state: {e}")

if __name__ == "__main__":
    asyncio.run(debug_user_state())
