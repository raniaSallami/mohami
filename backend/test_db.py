import asyncio
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.exc import DBAPIError
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.invoice import Invoice, InvoiceStatus
import uuid

async def main():
    async with AsyncSessionLocal() as session:
        user_result = await session.execute(select(User).limit(1))
        user = user_result.scalar_one_or_none()
        if not user:
            print("No users")
            return
            
        new_invoice = Invoice(
            date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            amount=59.0,
            status=InvoiceStatus.PENDING.value,
            plan_name="pro",
            clictopay_order_id="CMD-12345",
            user_id=str(user.id)
        )
        
        session.add(new_invoice)
        try:
            await session.commit()
            print("Successfully inserted invoice!")
            await session.refresh(new_invoice)
        except DBAPIError as e:
            print(f"DBAPIError details:\nOrig: {e.orig}\nStatement: {e.statement}\nParams: {e.params}")
        except Exception as e:
            print(f"Other Exception: {e}")

if __name__ == "__main__":
    asyncio.run(main())