# OTP Email Delivery - Complete Fix Documentation

## Problem Summary
Users were NOT receiving OTP (One-Time Password) verification emails during login attempts from new devices. The error `OTP_REQUIRED` was shown on the frontend, but the email never arrived.

### Root Cause
**The email worker service was not running.** This service is responsible for reading pending emails from the `email_queue` database table and actually sending them via SMTP.

**Evidence Found:**
- 20 emails stuck in `email_queue` table with `status='pending'`
- Most critically: 2 recent OTP emails (from failed login attempts) were never sent
- No send attempt logs in backend

### Timeline
- User attempts login from new device
- Backend correctly generates OTP code and creates entry in `login_email_otp` table ✅
- Backend inserts email into `email_queue` table with `status='pending'` ✅
- **EMAIL WORKER NOT RUNNING** ❌ — Email stays in queue indefinitely
- User never receives OTP, cannot complete 2FA authentication

---

## Solution Implemented

### 1. Created New Email Worker (`email_worker_start.py`)
The existing email worker scripts had issues loading `.env` configuration from the correct directory, causing SMTP credentials to fail to load.

**Created**: `backend/email_worker_start.py` with improvements:
- ✅ Explicit .env loading from parent directory
- ✅ Enhanced error logging and debugging output
- ✅ SMTP connection verification on startup
- ✅ Clear iteration counter for monitoring
- ✅ Graceful error handling and recovery

### 2. Verified All Systems
- **SMTP Connection**: ✅ Gmail SMTP authentication working
- **Database Connection**: ✅ Can connect to Neon PostgreSQL
- **Email Queue**: ✅ Database table accessible and functional
- **Email Processing**: ✅ Worker successfully sent all 20 pending emails

### 3. Results
Immediately after starting the email worker:
- Old pending emails sent automatically (welcome emails, password resets)
- **Both OTP emails status changed from `pending` to `sent`** ✅
- Email processing now happens every 30 seconds automatically

---

## How to Run Going Forward

### Option 1: Start Manually (Recommended for Testing)
```bash
cd C:\mouhami_v2\mohami\backend
python email_worker_start.py
```

### Option 2: Start on Windows
```bash
# Double-click this file:
C:\mouhami_v2\mohami\backend\start-email-worker.bat
```

### Option 3: Start as Background Task (Linux/WSL)
```bash
# Make the script executable
chmod +x C:\mouhami_v2\mohami\backend\start-email-worker.sh

# Run it
./start-email-worker.sh
```

### Option 4: Persistent Background Service (Windows Task Scheduler)

**Step 1: Create a scheduled task**
```powershell
# Run as Administrator
$taskName = "Mouhami-EmailWorker"
$action = New-ScheduledTaskAction -Execute "python" -Argument "C:\mouhami_v2\mohami\backend\email_worker_start.py"
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest
```

**Step 2: Verify it's scheduled**
```powershell
Get-ScheduledTask -TaskName "Mouhami-EmailWorker" | Select-Object State, LastRunTime
```

### Option 5: Keep Worker Running with PM2 (Node.js ecosystem)

If you want to use PM2 (which can manage Node/Python processes):
```bash
# Install PM2 globally if not already installed
npm install -g pm2

# Start the email worker with PM2
pm2 start "python email_worker_start.py" --name "mouhami-email-worker" --cwd C:\mouhami_v2\mohami\backend

# Set it to restart on system reboot
pm2 startup
pm2 save

# Monitor status
pm2 status
pm2 logs mouhami-email-worker
```

---

## Monitoring the Email Worker

### Check Email Queue Status
```bash
cd C:\mouhami_v2\mohami\backend
python check_email_queue.py
```

Expected output shows email count and status of each queued email.

### View Live Logs
If running in a terminal window, you'll see output like:
```
🚀 Email Worker Started - Processing queue every 30 seconds
============================================================
[1] Checking queue at 09:47:25 UTC
📧 Found 5 pending email(s) to process
📤 Sending to: user@example.com | Subject: Your OTP Code
✅ Email sent successfully to user@example.com
    Waiting 30 seconds...
```

### Check SMTP Connection
To verify the email server connection is working:
```bash
cd C:\mouhami_v2\mohami\backend
python test_smtp.py
```

Expected output:
```
✓ Connected to SMTP server
✓ EHLO command successful
✓ STARTTLS enabled (TLS encryption active)
✓ Successfully authenticated as hamdiayari.backup@gmail.com
✅ SMTP connectivity verified successfully!
```

---

## Testing the Fix: Send a Test OTP Email

### 1. Verify Email Worker is Running
```bash
# You should see continuous "Checking queue at HH:MM:SS UTC" messages
```

### 2. Trigger a Login from a New Device/Browser
- Open the application in an **incognito/private browser** (to bypass device recognition)
- Attempt login with correct credentials
- You should see error: "OTP_REQUIRED:xxx"
- **You should receive an email within 30 seconds**

### 3. Check the Email Queue
```bash
python check_email_queue.py
```
The most recent OTP email should show `status: sent`

### 4. Verify Email Received
- Check email inbox for new OTP code  
- Check spam folder if not found in inbox
- Email subject: "تنبيه أمني: محاولة تسجيل دخول من جهاز غير معروف"  (Security Alert: New Device Login)

---

## Troubleshooting

### Issue: "SMTP_USER or SMTP_PASSWORD missing - emails DISABLED"
**Solution**: Verify .env file exists and has SMTP credentials:
```bash
cd C:\mouhami_v2\mohami
cat .env | grep SMTP
```

Should show:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hamdiayari.backup@gmail.com
SMTP_PASSWORD=ydzbfgeeowemepgl
```

### Issue: SMTP Connection Failed
**Check 1**: Verify Gmail credentials are correct
```bash
python backend/test_smtp.py
```

**Check 2**: Ensure port 587 is allowed (for TLS)
- Check firewall settings
- Verify internet connection

**Check 3**: If using Gmail, verify:
- Less secure apps access is enabled
- Or use Gmail App Password instead of account password

### Issue: Emails Stuck in Queue (still showing 'pending')
1. Kill the existing worker process: `taskkill /F /IM python.exe`
2. Wait 5 seconds
3. Check logs: `python backend/check_email_queue.py`
4. Restart worker: `python backend/email_worker_start.py`
5. If still failing, check SMTP connection: `python backend/test_smtp.py`

### Issue: Worker Crashes Immediately
**Check 1**: Database connection
```bash
python backend/test_db_conn.py
```

**Check 2**: View error messages
- Look for specific error output when starting
- Common issues: port 587 blocked, authentication failed

---

## Configuration Files

### Email Worker: `backend/email_worker_start.py`
- **Purpose**: Main email processing service
- **Schedule**: Checks queue every 30 seconds
- **Environment**: Loads from `../.env` (parent directory)
- **Logging**: Prints to stdout/stderr

### Email Queue Checker: `backend/check_email_queue.py`
- **Purpose**: View current queue status
- **Usage**: `python check_email_queue.py`
- **Output**: Shows all emails with status (pending/sent/failed)

### SMTP Tester: `backend/test_smtp.py`
- **Purpose**: Verify email server connectivity
- **Usage**: `python test_smtp.py`
- **Output**: Connection status and authentication success/failure

---

## Environment Variables Required

All these must be set in the root `/.env` file:

```
# Email Delivery (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hamdiayari.backup@gmail.com
SMTP_PASSWORD=ydzbfgeeowemepgl
MAIL_FROM_ADDRESS=hamdiayari.backup@gmail.com
MAIL_FROM_NAME=Mouhami AI

# Database (for email_queue table)
DATABASE_URL=postgresql://...
```

---

## Database Schema (email_queue table)

The worker reads from this table:
```sql
CREATE TABLE email_queue (
    id VARCHAR PRIMARY KEY,
    to_email VARCHAR NOT NULL,
    subject VARCHAR NOT NULL,
    html_content TEXT,
    text_content TEXT,
    status VARCHAR DEFAULT 'pending',  -- pending, sent, failed
    error_message VARCHAR DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP DEFAULT NULL
);
```

---

## Key Files Changed/Created

| File | Purpose | Status |
|------|---------|--------|
| `backend/email_worker_start.py` | NEW - Main email worker with proper .env loading | ✅ Working |
| `backend/check_email_queue.py` | NEW - Queue status checker script | ✅ Working |
| `backend/test_smtp.py` | NEW - SMTP connectivity tester | ✅ Working |
| `backend/start-email-worker.bat` | NEW - Windows launcher script | ✅ Ready |
| `backend/start-email-worker.sh` | NEW - Linux/WSL launcher script | ✅ Ready |

---

## Success Verification Checklist

- [ ] Email worker is running (see continuous "Checking queue" messages)
- [ ] SMTP connection verified: `python test_smtp.py` shows ✅
- [ ] Email queue checked: `python check_email_queue.py` shows sent emails
- [ ] Tested OTP flow: Triggered login from new device
- [ ] OTP email received in inbox within 30 seconds
- [ ] Email queue shows new OTP email with `status: sent`
- [ ] Email worker set to run at startup (using preferred method above)

---

## Next Steps (Recommended)

1. **Set email worker to start automatically** using one of the persistence methods above
2. **Add monitoring/alerts** if emails fail to send
3. **Regular backups** of the .env file (contains sensitive SMTP password)
4. **Test disaster recovery** - what happens if email worker crashes?
5. **Consider email backup** - for critical alerts, use secondary email service

---

## Support

If OTP emails still not arriving after implementing this fix:

1. Check email worker is running: `Get-Process python`
2. Verify SMTP: Run `test_smtp.py`
3. Check queue: Run `check_email_queue.py`
4. View last N emails with any errors (query database for `error_message` not null)
5. Check email logs: Look for bounce/failure messages from Gmail
6. Verify recipient email is valid and not rate-limited

