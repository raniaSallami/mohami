#!/usr/bin/env python3
"""
Script to check recent payment errors
"""
import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from app.models.payment_audit import PaymentAuditLog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def check_recent_errors():
    """Check recent payment errors"""
    async with engine.begin() as conn:
        async with AsyncSession(conn) as db:
            result = await db.execute(
                select(PaymentAuditLog)
                .where(PaymentAuditLog.status == 'failed')
                .order_by(PaymentAuditLog.timestamp.desc())
                .limit(5)
            )
            logs = result.scalars().all()
            
            if logs:
                print('Recent payment errors:')
                for log in logs:
                    print(f'  - {log.timestamp}: {log.event_type} - {log.details}')
            else:
                print('No recent payment errors found')

if __name__ == "__main__":
    asyncio.run(check_recent_errors())
