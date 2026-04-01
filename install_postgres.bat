@echo off
REM Script pour télécharger et installer PostgreSQL via Chocolatey ou installer manuel

echo Installing PostgreSQL for local development...
echo.

REM Check if Chocolatey is installed
where choco >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Chocolatey found, installing PostgreSQL...
    choco install postgresql -y
) else (
    echo ⚠️ Chocolatey not found.
    echo.
    echo Option 1: Install Chocolatey first:
    echo   Open PowerShell as Administrator and run:
    echo   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    echo.
    echo Option 2: Download PostgreSQL manually from:
    echo   https://www.postgresql.org/download/windows/
    echo.
    pause
)
