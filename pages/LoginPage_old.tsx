// Ce fichier a été mis à jour - voir LoginPage.tsx en dessous du répertoire pages
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordValidation, setNewPasswordValidation] = useState<PasswordValidation>({
    isValid: false,
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasDigit: false,
    errors: [],
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [forgotRecaptchaToken, setForgotRecaptchaToken] = useState('');

  useEffect(() => {
    const validation = validatePassword(newPassword);
    setNewPasswordValidation(validation);
  }, [newPassword]);

  const getFreshRecaptchaToken = async (action: string): Promise<string | null> => {
    return await executeRecaptcha(action);
  };

  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const freshToken = await getFreshRecaptchaToken('forgot_password') || forgotRecaptchaToken;
      if (!freshToken) {
        setForgotError('reCAPTCHA requis');
        return;
      }
      setForgotRecaptchaToken(freshToken);

      // Step 1: send OTP via forgot-password endpoint
      await apiService.forgotPasswordStep1(forgotEmail.trim());
      setForgotStep('otp');
      setForgotSuccess(window.__t("تم إرسال رمز التحقق إلى بريدك الإلكتروني. صلاحيته 10 دقائق."));
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : window.__t("حدث خطأ"));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordValidation.isValid) {
      setForgotError(window.__t("كلمة المرور لا تحقق جميع المتطلبات"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError(window.__t("كلمة المرور غير مطابقة"));
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');
    try {
      await apiService.forgotPasswordStep2(forgotEmail.trim(), otp, newPassword);
      setForgotSuccess(window.__t("تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن."));
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep('email');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotEmail('');
      }, 1500);
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : window.__t("حدث خطأ"));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Login attempt started - regenerating reCAPTCHA token');

      const freshToken = await getFreshRecaptchaToken('login') || recaptchaToken;
      if (!freshToken) {
        setError(window.__t("يرجى إتمام التحقق من reCAPTCHA أولاً"));
        setLoading(false);
        return;
      }
      setRecaptchaToken(freshToken);
      console.log('✅ Fresh reCAPTCHA token generated');

      // Step 1: send email + password + recaptcha
      const response = await fetch(`http://localhost:3001/api/auth/login/step1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, recaptcha_token: freshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle reCAPTCHA failure
        if (data.detail?.includes('reCAPTCHA') || data.code === 'RECAPTCHA_FAILED') {
          throw new Error('reCAPTCHA en chargement... Attendez 5s et réessayez');
        }
        throw new Error(data.detail || window.__t("حدث خطأ أثناء الاتصال بالخادم"));
      }

      // New device — OTP required
      if (data.needs_otp) {
        const userId = data.user_id;
        console.log('🔐 OTP required for new device, userId:', userId);
        localStorage.setItem('pending_device_verification_user_id', userId);
        localStorage.setItem('pending_device_verification_email', email);
        onNavigate('deviceVerification');
        return;
      }

      // Direct login success (trusted device) — backend returns { token: { access_token, refresh_token }, user: {...} }
      if (data.token && data.user) {
        const tokenData = {
          access_token: data.token.access_token,
          refresh_token: data.token.refresh_token,
          token_type: data.token.token_type || 'bearer',
        };
        storageService.setToken(tokenData);
        storageService.setUser(data.user);
        const normalizedUser = storageService.getCurrentUser();
        console.log('✅ Login successful');
        onLogin(normalizedUser as User);
        return;
      }

      setError(window.__t("البريد الإلكتروني أو كلمة المرور غير صحيحة"));
    } catch (err: any) {
      console.error('❌ Login error caught:', err);

      if (err.message?.includes('reCAPTCHA')) {
        setError('reCAPTCHA en chargement... Attendez 5s et réessayez');
      } else if (err.message?.includes('Identifiants invalides') || err.message?.includes('Invalid')) {
        setError(window.__t("البريد الإلكتروني أو كلمة المرور غير صحيحة"));
      } else {
        setError(err.message || window.__t("حدث خطأ أثناء الاتصال بالخادم"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center">
          <div className="flex justify-center cursor-pointer mb-4" onClick={() => onNavigate('landing')}>
            <img
              src="/assets/logo.png"
              alt={window.__t("المحامي")}
              className="w-12 h-12 rounded-lg shadow-lg hover:shadow-yellow-500/50 transition object-contain"
            />
          </div>
          <button
            onClick={() => onNavigate('landing')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            <span>←</span>
            <span>{window.__t("العودة إلى الصفحة الرئيسية")}</span>
          </button>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{window.__t("تسجيل الدخول")}</h2>
        {allowRegistrations && (
          <p className="mt-2 text-center text-sm text-gray-600">
            {window.__t("أو")} <button onClick={() => onNavigate('register')} className="font-medium text-blue-600 hover:text-blue-500">{window.__t("إنشاء حساب جديد")}</button>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">{window.__t("البريد الإلكتروني")}</label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">{window.__t("كلمة المرور")}</label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="mt-2 text-start">
                <button
                  type="button"
                  onClick={() => { setShowForgotModal(true); setForgotStep('email'); setForgotEmail(email); setForgotError(''); setForgotSuccess(''); }}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {window.__t("نسيت كلمة المرور؟")}
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <Recaptcha onVerify={setRecaptchaToken} action="login" />
            </div>

            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            <div>
              <button
                type="submit"
                disabled={loading || !recaptchaToken}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                {loading ? <Spinner /> : window.__t("دخول")}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Modal isOpen={showForgotModal} onClose={() => { setShowForgotModal(false); setForgotStep('email'); setForgotError(''); setForgotSuccess(''); }}>
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">{window.__t("إعادة تعيين كلمة المرور")}</h3>
          {forgotStep === 'email' ? (
            <form onSubmit={handleForgotSendOtp}>
              <p className="text-sm text-gray-600 mb-3">{window.__t("أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق.")}</p>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder={window.__t("البريد الإلكتروني")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
              />
              <Recaptcha onVerify={setForgotRecaptchaToken} action="forgot_password" />
              {forgotError && <p className="text-red-500 text-sm mb-2">{forgotError}</p>}
              {forgotSuccess && <p className="text-green-600 text-sm mb-2">{forgotSuccess}</p>}
              <button type="submit" disabled={forgotLoading || !forgotRecaptchaToken} className="w-full py-2 bg-slate-900 text-white rounded-md font-medium disabled:opacity-50">
                {forgotLoading ? <Spinner /> : window.__t("إرسال رمز التحقق")}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotReset}>
              <p className="text-sm text-gray-600 mb-3">{window.__t("أدخل الرمز المرسل إلى")} {forgotEmail}</p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder={window.__t("رمز التحقق (6 أرقام)")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 text-center tracking-widest"
              />
              <div>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={window.__t("كلمة المرور الجديدة")}
                  className={`w-full px-3 py-2 border rounded-md mb-2 ${newPassword && !newPasswordValidation.isValid ? 'border-red-500' : 'border-gray-300'}`}
                />
                {newPassword && (
                  <div className="mb-3 p-2 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-2">{window.__t("متطلبات كلمة المرور:")}</p>
                    <div className="space-y-1 text-xs">
                      <div className={`flex items-center ${newPasswordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className="me-2">{newPasswordValidation.minLength ? '✓' : '✗'}</span>
                        <span>{window.__t("8 أحرف على الأقل")}</span>
                      </div>
                      <div className={`flex items-center ${newPasswordValidation.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className="me-2">{newPasswordValidation.hasUppercase ? '✓' : '✗'}</span>
                        <span>{window.__t("حرف كبير (A-Z)")}</span>
                      </div>
                      <div className={`flex items-center ${newPasswordValidation.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className="me-2">{newPasswordValidation.hasLowercase ? '✓' : '✗'}</span>
                        <span>{window.__t("حرف صغير (a-z)")}</span>
                      </div>
                      <div className={`flex items-center ${newPasswordValidation.hasDigit ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className="me-2">{newPasswordValidation.hasDigit ? '✓' : '✗'}</span>
                        <span>{window.__t("رقم (0-9)")}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={window.__t("تأكيد كلمة المرور")}
                className={`w-full px-3 py-2 border rounded-md mb-3 ${newPassword && confirmPassword && newPassword !== confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
              />
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-500 text-xs mb-2">{window.__t("كلمة المرور غير مطابقة")}</p>
              )}
              {forgotError && <p className="text-red-500 text-sm mb-2">{forgotError}</p>}
              {forgotSuccess && <p className="text-green-600 text-sm mb-2">{forgotSuccess}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setForgotStep('email')} className="flex-1 py-2 border border-gray-300 rounded-md">
                  {window.__t("رجوع")}
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading || !newPasswordValidation.isValid || newPassword !== confirmPassword || !otp}
                  className="flex-1 py-2 bg-slate-900 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forgotLoading ? <Spinner /> : window.__t("تعيين كلمة المرور")}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};
