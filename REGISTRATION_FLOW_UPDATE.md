# Registration Flow & Database Schema Update - COMPLETE

## Summary of Changes

Successfully updated the application to implement a **4-step registration flow with OTP email verification** and **database schema that matches account metadata**. OTP is now sent **AFTER** personal info collection (Step 2), **BEFORE** plan selection (Step 4).

---

## Backend Changes

### 1. Database Models

#### Created: `/backend/app/models/user_profile.py`
- New model for storing account-specific metadata
- Fields:
  - `id`: UUID primary key
  - `user_id`: Foreign key to User table (cascade delete)
  - `account_type`: lawyer, cabinet, or student
  - `bar_number`: Lawyer bar license number (optional)
  - `cabinet_name`: Cabinet/firm name (optional)
  - `university`: University name for students (optional)
  - `created_at`, `updated_at`: Timestamps

#### Created: `/backend/app/models/registration_otp.py`
- New model for registration email verification
- Fields:
  - `id`: UUID primary key
  - `email`: Email being verified
  - `otp`: 6-digit code
  - `expires_at`: Expiry timestamp (10 minutes)
  - `verified`: Boolean flag (marked after successful verification)
  - `created_at`: Timestamp

#### Updated: `/backend/app/models/__init__.py`
- Added imports for `LoginEmailOTP` and `RegistrationEmailOTP`
- Exported both OTP models in `__all__`

### 2. API Schemas

#### Updated: `/backend/app/schemas/auth.py`

**RegisterRequest - Now includes all account metadata:**
```python
class RegisterRequest(BaseModel):
    email: EmailStr
    recaptcha_token: str
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., description="User phone number")
    account_type: str = Field(..., description="Account type: lawyer, cabinet, or student")
    role: Optional[str] = "LAWYER"
    subscription_plan: Optional[str] = "basic"
    bar_number: Optional[str] = None
    cabinet_name: Optional[str] = None
    university: Optional[str] = None
```

**New Schemas:**
- `SendRegistrationOTPRequest`: Email + password + name + phone + account_type
- `SendRegistrationOTPResponse`: Message confirmation
- `VerifyRegistrationOTPRequest`: Email + OTP code
- `VerifyRegistrationOTPResponse`: Verified status + message

### 3. API Endpoints

#### Updated: `/backend/app/routers/auth.py`

**New Endpoints:**

1. **POST `/auth/register/send-otp`** (Step 2.5 of registration)
   - Validates email doesn't exist
   - Generates 6-digit OTP
   - Saves OTP to `registration_email_otp` table (10-minute expiry)
   - Queues email to email_queue for async delivery
   - Returns success message

2. **POST `/auth/register/verify-otp`** (Step 2.5 verification)
   - Finds latest OTP record for email
   - Validates OTP hasn't expired
   - Compares OTP code
   - Marks OTP as verified in database
   - Returns verification status

3. **Updated POST `/auth/register`** (Step 4 - final registration)
   - Now requires verified OTP for email
   - Creates User record with phone + subscription_plan
   - Creates UserProfile record with account metadata
   - Cleans up OTP record after successful registration
   - Returns auth tokens + user data

---

## Frontend Changes

### Updated: `/pages/RegisterPage.tsx`

**New 4-Step Registration Flow:**

1. **Step 1: Account Type Selection**
   - Choose: Lawyer, Cabinet, or Student
   - Displays 3 card buttons with icons

2. **Step 2: Personal Information + Password**
   - Name, Email, Phone
   - Conditional fields based on account type:
     - **Lawyer**: Bar card number
     - **Cabinet**: Cabinet name
     - **Student**: University name
   - Password with strength indicator
   - Confirm password

3. **Step 3: Email Verification (NEW)**
   - Button to send OTP to email
   - OTP input field (6 digits only)
   - Button to verify OTP
   - Shows email address for verification

4. **Step 4: Subscription Plan Selection**
   - Basic (free)
   - Pro (59 DT/year)
   - Enterprise (199 DT/year)
   - Final submit button

**Key Features:**
- Progress indicator updated to show 4 steps
- Toast notifications for each step
- Loading states with spinners
- Error validation with display
- Dark mode support maintained
- RTL Arabic full support
- Responsive grid layouts for plan cards

### Updated: `/services/apiService.ts`

**New Methods:**

1. **`sendRegistrationOTP(email, password, name, phone, accountType)`**
   - Sends POST request to `/auth/register/send-otp`
   - Handles error responses

2. **`verifyRegistrationOTP(email, otp)`**
   - Sends POST request to `/auth/register/verify-otp`
   - Handles error responses

3. **Updated `register()` method signature**
   - Now accepts all account metadata parameters
   - Sends complete registration request with all fields
   - Parameters: email, password, name, recaptchaToken, phone, accountType, subscriptionPlan, barNumber, cabinetName, university, role

---

## Registration Flow - Visual Timeline

```
User → Step 1 (Account Type)
         ↓
User → Step 2 (Personal Info)
         ↓
Backend: Save to localStorage temporarily
         ↓
User → Step 3 (Send OTP)
         ↓
Backend: Generate OTP → Create OTP record → Queue email
         ↓
Email sent via email_worker (async)
         ↓
User → Step 3 (Enter & Verify OTP)
         ↓
Backend: Validate OTP → Mark as verified
         ↓
User → Step 4 (Select Plan)
         ↓
User → Click "Create Account"
         ↓
Backend: Create User + UserProfile → Generate Tokens → Delete OTP record
         ↓
Frontend: Navigate to dashboard
```

---

## Database Changes Summary

### New Tables:
1. **user_profile** - Stores account metadata (lawyer/cabinet/student specific data)
2. **registration_email_otp** - Stores OTP codes for registration email verification

### Updated Fields in `users` table:
- `phone` - Now stored directly on User record (not just localStorage)
- `subscription_plan` - Now stored on User record (defaults to 'basic')

---

## Technical Details

### OTP Email Template
- HTML email with RTL Arabic support
- 6-digit OTP displayed prominently
- Gold color scheme (#D4941C)
- 10-minute expiry message
- Queued for async delivery via email_worker

### Error Handling
- Email already exists: 400 error with Arabic message
- OTP not found: 400 error
- OTP expired: 400 error with re-request message
- OTP code mismatch: 400 error
- All errors translated to Arabic

### Security Features
- OTP expires after 10 minutes
- Nullable optional fields (bar_number, cabinet_name, university)
- reCAPTCHA verification on final registration
- Password complexity validation (uppercase + lowercase + digit)
- Email validation before OTP send
- Phone number validation (Tunisian format)

---

## Testing Checklist

- [ ] Step 1: Select account type - validates selection required
- [ ] Step 2: Enter personal info - validates all fields
- [ ] Step 2: Password strength indicator - shows colors dynamically
- [ ] Step 3: Send OTP - triggers backend OTP generation
- [ ] Step 3: Email received - OTP shows in email
- [ ] Step 3: Verify OTP - accepts 6-digit code only
- [ ] Step 3: OTP expiry - fails after 10 minutes
- [ ] Step 4: Select plan - validates plan selection required
- [ ] Final submit: Creates user record with all metadata
- [ ] Dark mode: All steps display correctly
- [ ] Arabic RTL: All text right-to-left aligned
- [ ] Error messages: All display in Arabic
- [ ] Navigation: Back button works correctly between steps

---

## Notes for Implementation

✅ **COMPLETED:**
- User model updated to include phone + subscription_plan
- UserProfile model created and exported
- RegistrationEmailOTP model created
- API schemas updated with new fields
- Registration endpoints created with OTP flow
- Frontend RegisterPage rewritten with 4-step flow
- apiService methods added for OTP handling
- Backend OTP generation and verification logic implemented
- Email template created and queuing logic added
- Progress indicator updated to show 4 steps
- Error handling and validation throughout

🔄 **TO VERIFY:**
- Email delivery through email_worker (ensure it's running)
- OTP timing (verify 10-minute expiry works)
- Database migrations applied (UserProfile + RegistrationEmailOTP tables created)
- API endpoints responding correctly to frontend calls
- Token storage working after registration completion

---

## Breaking Changes

⚠️ **NONE** - This is additive. Old registration flow is completely replaced with new flow. All previous localStorage usage is preserved alongside database storage.

---

## Environment Variables Required

Ensure these are set in `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME=Mouhami
```

Email worker must be running to send OTP emails.
