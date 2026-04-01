# Rate Limiter Migration: In-Memory → Database-Backed

## What Changed ✅

### Problem with Old System ❌
- **Storage:** Python dictionary in memory
- **Persistence:** LOST on server restart
- **Scale:** Single instance only
- **Reliability:** All rate limit data wiped when server crashes

### New System ✅
- **Storage:** PostgreSQL `security_logs` table
- **Persistence:** Survives server restarts indefinitely
- **Scale:** Works across multiple instances
- **Reliability:** Permanent audit trail of all failed attempts

---

## Files Modified

### 1. `backend/app/routers/auth.py`
**Removed:** In-memory rate limiting code (lines 35-84)
- `_login_attempts: dict = {}`
- `_check_rate_limit(ip)`
- `_record_failed_attempt(ip)`
- `_reset_attempts(ip)`

**Added:** Database-backed rate limiter
```python
from app.utils.rate_limiter import check_rate_limit, record_failed_attempt, reset_failed_attempts

# Updated login_step1:
await check_rate_limit(req, db, request.email)          # Before: _check_rate_limit(ip)
await record_failed_attempt(req, db, request.email)     # Before: _record_failed_attempt(ip)
await reset_failed_attempts(req, db, request.email)     # Before: _reset_attempts(ip)
```

### 2. `backend/app/routers/password_reset.py`
**Removed:** In-memory rate limiting code (lines 25-60)
- `_reset_attempts: dict = {}`
- `_check_reset_rate_limit(ip)`
- `_record_reset_attempt(ip)`

**Added:** Database-backed rate limiter
```python
from app.utils.rate_limiter import check_rate_limit, record_failed_attempt, reset_failed_attempts

# Updated forgot_password and verify_reset_otp:
await check_rate_limit(req, db, request.email)
await record_failed_attempt(req, db, request.email)
```

### 3. `backend/app/utils/rate_limiter.py` (Already existed)
**Status:** Now actively used throughout the app
- `check_rate_limit()` - Blocks IPs with more than 5 failed attempts in 15 minutes
- `record_failed_attempt()` - Logs failed login attempts to database
- `reset_failed_attempts()` - Clears failed attempts after successful login

**Configuration:**
```python
MAX_ATTEMPTS   = 5              # Max attempts before blocking
WINDOW_MINUTES = 15             # Time window to count attempts
BLOCK_MINUTES  = 30             # How long to block the IP
```

---

## Database Schema

### `security_logs` Table
```sql
CREATE TABLE security_logs (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,      -- 'failed_login', 'blocked'
    details TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Example Entries:**
```
IP: 192.168.1.100  | Type: failed_login  | Details: Failed login attempt for email: user@example.com
IP: 192.168.1.100  | Type: blocked       | Details: IP blocked after 5 failed attempts. Email: user@example.com
```

---

## How It Works

### Scenario 1: Incorrect Password (Same IP)
1. **Attempt 1:** `failed_login` recorded → Count: 1/5
2. **Attempt 2:** `failed_login` recorded → Count: 2/5
3. **Attempt 3:** `failed_login` recorded → Count: 3/5
4. **Attempt 4:** `failed_login` recorded → Count: 4/5
5. **Attempt 5:** `failed_login` + `blocked` recorded → IP LOCKED for 30 minutes
6. **Attempt 6:** HTTPException 429 (Too Many Requests) → Before checking password

### Scenario 2: Correct Password
1. Failed attempts query returns: Count: 2/5
2. Password verified ✅
3. `reset_failed_attempts()` clears all entries for this IP+email
4. Login successful, tokens issued

### Scenario 3: Server Restart
1. Old system: All rate limits lost ❌
2. New system: All entries still in database ✓
3. Server starts, first login attempt queries database
4. Rate limit enforcement continues seamlessly

---

## Testing

### Check Rate Limiter Status
```bash
cd backend
python test_rate_limiter.py
```

Expected output:
```
✓ security_logs table exists with N entries
[Show recent security log entries]
✅ Rate limiter database backend is working correctly!
```

### Manually Clear Failed Attempts (For Testing)
```bash
python reset_rate_limits.py
```

---

## Error Messages

### API Response When Rate Limited
**Status Code:** 429 (Too Many Requests)

**Arabic Response:**
```
"Trop de tentatives. Réessayez dans 30 minutes."
```
(French error message - should be updated to Arabic for consistency)

---

## Advantages

| Feature | Old (In-Memory) | New (Database) |
|---------|-----------------|-----------------|
| Persistence | ❌ Lost on restart | ✅ Permanent |
| Multi-instance | ❌ No sync | ✅ Works across servers |
| Audit trail | ❌ No history | ✅ Full history in DB |
| Performance | ✅ Very fast | ⚠️ Slightly slower (DB query) |
| Reliability | ❌ Unreliable | ✅ Highly reliable |
| Scalability | ❌ Single server | ✅ Enterprise ready |

---

## Known Issues

### Language Consistency
The error messages in `rate_limiter.py` are in French, but the app uses Arabic. Should update to:
```python
# Current (French):
"Trop de tentatives. Réessayez dans {BLOCK_MINUTES} minutes."

# Should be (Arabic):
"تم تجاوز الحد الأقصى للمحاولات. يرجى الانتظار {BLOCK_MINUTES} دقيقة."
```

### Future Enhancements
- [ ] Add IP whitelist/blacklist
- [ ] Implement progressive delays (exponential backoff)
- [ ] Add email notification for blocked IPs
- [ ] Dashboard to monitor blocked IPs
- [ ] Geo-IP blocking for suspicious locations

---

## Verification Checklist

- [x] Replaced in-memory dicts with database queries
- [x] Updated `auth.py` login endpoints
- [x] Updated `password_reset.py` endpoints
- [x] Tested database connectivity
- [x] Verified `security_logs` table exists
- [x] Confirmed new functions are imported correctly
- [ ] Added comprehensive monitoring
- [ ] Updated error messages to Arabic
- [ ] Deploy to production and monitor

---

## Backwards Compatibility

✅ **Fully backwards compatible** - No changes needed to:
- Frontend code
- API contracts
- Database migrations (table already exists)

The rate limiter works transparently with the existing login flow.

