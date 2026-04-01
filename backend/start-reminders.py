#!/usr/bin/env python3
\"\"\"Start the reminder worker.\"\"\"
import asyncio
import subprocess
import sys
import os
from pathlib import Path

async def main():
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    print(f"🚀 Starting reminder worker from {backend_dir}")
    print("💡 Run in background: python reminder_worker.py")
    result = subprocess.run([sys.executable, "reminder_worker.py"])
    return result.returncode

if __name__ == \"__main__\":
    asyncio.run(main())

