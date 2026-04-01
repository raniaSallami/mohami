@echo off
REM Email Worker Service Startup Script for Windows
REM Run this to start the email worker that processes OTP and other queued emails

cd /d "%~dp0"

REM Check if email worker is already running
tasklist /FI "WINDOWTITLE eq Email Worker*" 2>NUL | find /I /N "python" >NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] Email worker is already running
    exit /b 0
)

echo [*] Starting Email Worker Service...

REM Start the email worker in a new window
start "Email Worker - Mouhami" python email_worker_start.py

echo [OK] Email worker started
echo [INFO] Watch the window above for logs
pause
