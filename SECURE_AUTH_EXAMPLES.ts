/**
 * ✅ SECURITY FIX: Secure Authentication Flow
 * استخدام Backend API بدلاً من Direct Database Access
 */

// ❌ BEFORE - غير آمن
const unsafeLogin = async (email: string, password: string): Promise<User | null> => {
  try {
    // ✝️ مباشر DB access من Frontend - خطأ فادح!
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = $2', 
      [email, password]
    );
    
    if (result.rows.length > 0) {
      console.log('🔑 Stored password:', result.rows[0].password);  // ✝️ طباعة الكلمة
      console.log('🔑 Provided password:', password);  // ✝️ طباعة الكلمة
      localStorage.setItem('user', JSON.stringify(result.rows[0]));  // ✝️ حفظ بيانات حساسة
      return result.rows[0];
    }
    return null;
  } catch (err) {
    console.error("Login error:", err);
    throw err;
  }
};

// ================================================
// ✅ AFTER - آمن تماماً
// ================================================

const secureLogin = async (
  email: string, 
  password: string, 
  recaptchaToken: string
): Promise<{ user: User; token: Token } | null> => {
  try {
    // ✅ استخدام Backend API فقط
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,  // ← Backend يتولى التحقق والتشفير
        recaptcha_token: recaptchaToken,
        fingerprint: navigator.userAgent  // Device fingerprint
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const { token, user } = await response.json();
    
    // ✅ حفظ Token آمن (Backend سيرسله in HttpOnly Cookie أو Auth Header)
    if (token) {
      this.setToken(token);
    }

    // ✅ حفظ بيانات المستخدم العامة فقط (بدون كلمة مرور)
    const publicUserData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscriptionPlan: user.subscription_plan,
      subscriptionStatus: user.subscription_status,
      // ✝️ لا نحفظ: password, refresh_token, أو بيانات حساسة أخرى
    };
    
    localStorage.setItem('almohami_current_user', JSON.stringify(publicUserData));
    
    // ✅ آمن - لا نطبع البيانات الحساسة
    console.log('✅ Login successful for:', user.email);
    
    return { user: publicUserData, token };
  } catch (err) {
    console.error("❌ Login error:", err instanceof Error ? err.message : 'Unknown error');
    // ⚠️ لا نطبع التفاصيل الحساسة - فقط الرسالة العامة
    throw err;
  }
};

// ================================================
// ✅ SECURE REGISTER
// ================================================

const secureRegister = async (
  name: string,
  email: string,
  password: string,
  recaptchaToken: string
): Promise<{ user: User; token: Token }> => {
  try {
    // ✅ Backend يتولى تشفير كلمة المرور
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,  // ← يرسل plaintext إلى Backend ONLY
        recaptcha_token: recaptchaToken,
        role: 'LAWYER'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    const { token, user } = await response.json();

    // ✅ حفظ آمن
    this.setToken(token);
    localStorage.setItem('almohami_current_user', JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }));

    console.log('✅ Registration successful for:', user.email);
    return { user, token };
  } catch (err) {
    console.error('❌ Registration error:', err instanceof Error ? err.message : 'Unknown error');
    throw err;
  }
};

// ================================================
// ✅ SECURE LOGOUT
// ================================================

const secureLogout = async (): Promise<void> => {
  try {
    // ✅ اطلب من Backend إلغاء الجلسة
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAccessToken()}`
      },
      body: JSON.stringify({ logout_all_devices: false })
    });
  } catch (err) {
    console.warn('⚠️ Logout API call failed, clearing local data anyway');
  }

  // ✅ امسح البيانات المحلية
  localStorage.removeItem('almohami_current_user');
  this.clearToken();
  
  console.log('✅ Logout complete');
};

// ================================================
// Export الدوال الآمنة
// ================================================

export {
  secureLogin,
  secureRegister,
  secureLogout
};
