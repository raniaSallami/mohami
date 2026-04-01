# 🔐 Security Audit Checklist - قائمة فحص الأمان

## Completed على أساس الكود الحالي

### ❌ البيانات الحساسة في Logging

- [ ] ❌ `scripts/check-users.js` - يطبع كلمات المرور (السطر 22)
- [ ] ❌ `scripts/check-user.js` - يطبع كلمات المرور (السطور 23-25, 40-43)
- [ ] ❌ `services/storageService.ts` - يطبع كلمات المرور (السطور 81-85)
- [ ] ❌ `scripts/update-password.js` - يطبع كلمات إدارية

### ❌ Direct Database Access من Frontend

- [ ] ❌ `services/storageService.ts` - يحتوي على `pool.query()` مباشر
- [ ] ❌ `services/storageService.ts` - مقارنة نصية بدون bcrypt
- [ ] ❌ `services/db.ts` - إنشاء حسابات بدون تشفير

### ❌ Admin Credentials غير آمنة

- [ ] ❌ `scripts/migrate-simple.js` - كلمة مرور نصية (`'passpass'`)
- [ ] ❌ `scripts/update-password.js` - كلمة مرور نصية (`'passpass90'`)
- [ ] ❌ `services/db.ts` - كلمة password نصية للـ Admin
- [ ] ❌ `server/api-server.cjs` - مقارنة مباشرة بدون bcrypt

### ⚠️ localStorage Security

- [ ] ⚠️ `services/storageService.ts` - تخزين بيانات المستخدم كاملة
- [ ] ⚠️ `services/ipService.ts` - تخزين IP في localStorage

### ⚠️ Documentation vs Implementation Gap

- [ ] ⚠️ `pages/Legal.tsx` - وعود غير مطابقة للتطبيق الفعلي
- [ ] ⚠️ `components/TermsAcceptanceModal.tsx` - مثل

---

## الإجراءات المطلوبة

### 🔴 Priority 1: Critical - يجب إصلاحه الآن

**1. إزالة console.log للبيانات الحساسة**

```bash
# ابحث عن
grep -rn "console\.\(log\|error\).*password" scripts/ services/

# يجب أن تكون النتيجة فارغة
```

**الملفات:**
- `scripts/check-users.js` → السطر 22
- `scripts/check-user.js` → السطور 23-25, 40-43
- `services/storageService.ts` → السطور 81-85

**الحل:**
```javascript
// ❌ غير
console.log(`Password: ${user.password}`);

// ✅ استبدل بـ
console.log(`Password: [REDACTED - ${user.password?.length} chars]`);
```

---

**2. إزالة Direct DB Queries من Frontend**

```bash
# ابحث عن pool.query في services/
grep -rn "pool\.query" services/ --exclude="*.cjs"

# يجب أن تكون النتيجة فارغة (باستثناء db.ts)
```

**الملفات:**
- `services/storageService.ts` - جميع login/register queries

**الحل:** استخدم API endpoints من backend فقط

---

**3. تأمين Admin Credentials**

```bash
# ابحث عن plaintext passwords
grep -rn "passpass" scripts/ services/ backend/

# يجب أن تكون النتيجة فارغة
```

**الملفات المتأثرة:**
- `scripts/migrate-simple.js` 
- `scripts/update-password.js`
- `services/db.ts`
- `server/api-server.cjs`

**الحل:** استخدم bcrypt + environment variables

---

### 🟡 Priority 2: High - يجب إصلاحه قريباً

**4. تحديث Legal.tsx**
- اجعل المحتوى يطابق التطبيق الفعلي
- وضح أن كل التشفير يتم على Backend

**5. تحسين localStorage Security**
- احفظ بيانات عامة فقط (بدون passwords/tokens)
- استخدم httpOnly cookies للـ tokens إن أمكن

---

### 🟢 Priority 3: Nice to Have

**6. تحسين معالجة الأخطاء**
- لا تظهر تفاصيل تقنية للمستخدم
- سجل التفاصيل على Backend فقط

---

## ✅ Verification Steps

### بعد كل إصلاح، تحقق من:

```bash
# 1. لا توجد console.log محظورة
grep -rn "console\.\(log\|error\).*(password\|token\|secret)" . --include="*.ts" --include="*.tsx" --include="*.js"

# 2. لا توجد pool.query من frontend
grep -rn "pool\.query" services/ --exclude="*.cjs"

# 3. لا توجد plaintext passwords
grep -rn "'passpass\|'pass'" scripts/ services/

# 4. جميع passwords محمية بـ bcrypt
grep -rn "get_password_hash\|bcrypt\|bcryptpw" backend/ services/ | wc -l
```

---

## نموذج الاختبار

```typescript
// ✅ اختبر كل دالة

// Test 1: Login يستخدم API
const loginResult = await secureLogin('test@test.com', 'pass123', token);
expect(loginResult).toBeDefined();
expect(localStorage.getItem('almohami_current_user')).not.toContain('password');

// Test 2: No sensitive logs
const consoleSpy = jest.spyOn(console, 'log');
await secureLogin('test@test.com', 'pass123', token);
expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('password'));

// Test 3: Password hashed on backend
const user = await getUser('test@test.com');
expect(user.password).toMatch(/^\$2[aby]\$/);  // bcrypt hash prefix
```

---

## Timeline الموصى به

**الأسبوع 1:**
- [ ] إزالة console.log (2 ساعة)
- [ ] إزالة Direct DB queries (4 ساعات)

**الأسبوع 2:**
- [ ] تأمين Admin credentials (2 ساعة)
- [ ] تحديث Legal.tsx (1 ساعة)

**الأسبوع 3:**
- [ ] الاختبار الشامل (8 ساعات)
- [ ] المراجعة الأمنية النهائية (2 ساعة)

---

## المراجع

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Node.js Security: https://nodejs.org/en/docs/guides/security/
- bcrypt: https://github.com/kelektiv/node.bcrypt.js
- PostgreSQL Security: https://www.postgresql.org/docs/current/sql-syntax.html
