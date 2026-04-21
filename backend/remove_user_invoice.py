#!/usr/bin/env python3
"""
Script to remove user invoice for specific date
"""
import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db, engine
from app.models.user import User
from app.models.invoice import Invoice
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

async def remove_user_invoice():
    """Remove invoice dated 17/04/2026 for user amaallboukeri@gmail.com"""
    
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
                
                # Find invoices for this user on 17/04/2026
                invoice_date = '2026-04-17'  # Date format YYYY-MM-DD
                result = await db.execute(
                    select(Invoice).where(
                        Invoice.user_id == user.id,
                        Invoice.date.like(f'{invoice_date}%')
                    )
                )
                invoices = result.scalars().all()
                
                if not invoices:
                    print(f"No invoices found for user on {invoice_date}")
                    return False
                
                print(f"Found {len(invoices)} invoice(s) on {invoice_date}:")
                for invoice in invoices:
                    print(f"  - Invoice ID: {invoice.id}, Amount: {invoice.amount}, Status: {invoice.status}")
                
                # Delete the invoices
                for invoice in invoices:
                    await db.delete(invoice)
                    print(f"  - Deleted invoice: {invoice.id}")
                
                await db.commit()
                print(f"Successfully removed {len(invoices)} invoice(s) for user!")
                return True
                
            except Exception as e:
                print(f"Error removing user invoice: {e}")
                await db.rollback()
                return False

if __name__ == "__main__":
    asyncio.run(remove_user_invoice())
