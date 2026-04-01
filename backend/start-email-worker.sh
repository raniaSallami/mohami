#!/bin/bash
# Email Worker Service Startup Script
# Run this to start the email worker in the background

cd "$(dirname "$0")" || exit 1

# Check if email worker is already running
if pgrep -f "email_worker_start.py" > /dev/null; then
    echo "✓ Email worker is already running"
    exit 0
fi

# Start the email worker in the background
python email_worker_start.py > email_worker.log 2>&1 &
echo $! > email_worker.pid

echo "✓ Email worker started (PID: $(cat email_worker.pid))"
echo "  Logs: $PWD/email_worker.log"
