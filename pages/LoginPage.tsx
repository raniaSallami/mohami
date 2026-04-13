import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Mail, Lock, Sun, Moon, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { apiService } from '../services/apiService';
import { storageService } from '../services/storageService';
import { User } from '../types';
import { Spinner, Modal } from '../components/UI';
import { Recaptcha, executeRecaptcha } from '../components/Recaptcha';
import { validatePassword, type PasswordValidation } from '../utils/passwordValidator';
import { toast } from 'sonner';
import { OtpInput } from '../components/OtpInput';

export const LoginPage = ({ onLogin, onNavigate, allowRegistrations = true }: { onLogin: (user: User) => void; onNavigate: (page: string) => void; allowRegistrations?: boolean }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const emailInputRef = useRef<HTMLInputElement>(null);
  
  // Forgot Password Modal
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
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    emailInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const validation = validatePassword(newPassword);
    setNewPasswordValidation(validation);
  }, [newPassword]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!email) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'كلمة المرور مطلوبة';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

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

      await apiService.forgotPasswordStep1(forgotEmail.trim());
      setForgotStep('otp');
      setForgotSuccess('تم إرسال رمز التحقق إلى بريدك الإلكتروني. صلاحيته 10 دقائق.');
      toast.success('تم إرسال رمز التحقق');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'حدث خطأ';
      setForgotError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordValidation.isValid) {
      setForgotError('كلمة المرور لا تحقق جميع المتطلبات');
      toast.error('كلمة المرور لا تحقق جميع المتطلبات');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('كلمة المرور غير مطابقة');
      toast.error('كلمة المرور غير مطابقة');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');
    try {
      await apiService.forgotPasswordStep2(forgotEmail.trim(), otp, newPassword);
      setForgotSuccess('تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.');
      toast.success('تم تغيير كلمة المرور بنجاح');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep('email');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotEmail('');
      }, 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'حدث خطأ';
      setForgotError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const freshToken = await getFreshRecaptchaToken('login') || recaptchaToken;
      if (!freshToken) {
        setError('reCAPTCHA requis');
        toast.error('reCAPTCHA requis');
        return;
      }
      setRecaptchaToken(freshToken);

      const fingerprint = await (window as any).FingerprintJS?.get();
      const fingerprintValue = fingerprint?.visitorId || 'unknown';
      
      const result = await apiService.loginEmailStep1(email.trim(), password, freshToken, fingerprintValue);
      
      if (result.needs_otp) {
        toast.success('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
        // Store for next step
        sessionStorage.setItem('login_user_id', result.user_id || '');
        onNavigate('device_verification'); // or handle OTP verification
      } else {
        // Auto-login without OTP
        if (result.user && result.token) {
          // Store the token first
          storageService.setToken(result.token);
          storageService.setUser(result.user);
          onLogin(result.user);
          toast.success('تم تسجيل الدخول بنجاح');
        } else {
          throw new Error('فشل تسجيل الدخول: بيانات المستخدم أو التوكن غير متاحة');
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل تسجيل الدخول';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-amber-50 dark:from-slate-700 dark:via-slate-700 dark:to-slate-600 flex items-center justify-center p-4 relative RTL" style={{ fontFamily: "'Tajawal', 'Inter', sans-serif" }}>
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 right-10 w-96 h-96 bg-amber-100/20 dark:bg-slate-700/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-100/20 dark:bg-slate-700/15 rounded-full blur-3xl"></div>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 left-6 w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-900/50 flex items-center justify-center hover:bg-amber-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md z-20"
        aria-label="تبديل الوضع"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-amber-500" />
        ) : (
          <Moon className="w-5 h-5 text-amber-600" />
        )}
      </button>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-400/30">
              <svg
                className="w-9 h-9 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 3v18" />
                <path d="M5 8l-2 5h8l-2-5" />
                <path d="M19 8l-2 5h8l-2-5" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl text-amber-900 dark:text-amber-200 font-bold mb-1" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>المحامي</h1>
          <p className="text-amber-700 dark:text-amber-400 text-sm" style={{ fontFamily: "'Tajawal', sans-serif" }}>منصة ذكية لإدارة القضايا القانونية</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-800 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-8 shadow-xl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
          <div className="mb-8">
            <h2 className="text-2xl text-amber-900 dark:text-amber-200 text-center mb-2 font-bold" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>تسجيل الدخول</h2>
            <p className="text-amber-700 dark:text-amber-400 text-sm text-center" style={{ fontFamily: "'Tajawal', sans-serif" }}>مرحباً بعودتك إلى المحامي</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-amber-900 dark:text-amber-200 text-sm block text-right font-medium">البريد الإلكتروني</label>
              <div className="relative group">
                <Input
                  ref={emailInputRef}
                  type="email"
                  placeholder="example@example.tn"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  onKeyPress={handleKeyPress}
                  className={`w-full h-12 pr-11 text-right ${errors.email ? 'border-red-500' : ''}`}
                  disabled={loading}
                  required
                />
                <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.email ? 'text-red-500' : 'text-amber-600 dark:text-amber-500'}`} />
              </div>
              {errors.email && <p className="text-red-500 text-xs text-right">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-amber-900 dark:text-amber-200 text-sm block text-right font-medium">كلمة المرور</label>
              <div className="relative group">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  onKeyPress={handleKeyPress}
                  className={`w-full h-12 pr-11 pl-11 text-right ${errors.password ? 'border-red-500' : ''}`}
                  disabled={loading}
                  required
                />
                <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.password ? 'text-red-500' : 'text-amber-600 dark:text-amber-500'}`} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs text-right">{errors.password}</p>}
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 text-sm font-medium"
              >
                نسيت كلمة المرور؟
              </button>
            </div>

            {/* Error */}
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-right">{error}</div>}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-l from-amber-500 to-amber-600 text-white h-12 rounded-xl font-bold text-base"
              style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جارٍ...
                </span>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>

            {/* Register Link */}
            {allowRegistrations && (
              <div className="text-center pt-4">
                  <p className="text-amber-700 dark:text-amber-400 text-sm">
                  ليس لديك حساب؟{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('register')}
                      className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-bold"
                  >
                    إنشاء حساب
                  </button>
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <Modal
            isOpen={showForgotModal}
            onClose={() => {
              setShowForgotModal(false);
              setForgotStep('email');
              setForgotEmail('');
              setOtp('');
              setNewPassword('');
              setConfirmPassword('');
              setForgotError('');
              setForgotSuccess('');
            }}
            title="إعادة تعيين كلمة المرور"
          >
            <form onSubmit={forgotStep === 'email' ? handleForgotSendOtp : handleForgotReset} className="space-y-4">
              {forgotStep === 'email' ? (
                <div>
                  <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                  <Input
                    type="email"
                    placeholder="example@example.tn"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={forgotLoading}
                    required
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-3 text-right">رمز التحقق</label>
                    <OtpInput
                      value={otp}
                      onChange={setOtp}
                      length={6}
                      disabled={forgotLoading}
                      error={forgotError && otp.length !== 6 ? 'أدخل 6 أرقام' : undefined}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">كلمة المرور الجديدة</label>
                    <Input
                      type="password"
                      placeholder="كلمة مرور قوية"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={forgotLoading}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">تأكيد كلمة المرور</label>
                    <Input
                      type="password"
                      placeholder="تأكيد كلمة المرور"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={forgotLoading}
                      required
                    />
                  </div>
                </>
              )}

              {forgotError && <div className="text-red-500 text-sm">{forgotError}</div>}
              {forgotSuccess && <div className="text-green-500 text-sm">{forgotSuccess}</div>}

              <Button type="submit" disabled={forgotLoading} className="w-full">
                {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {forgotStep === 'email' ? 'إرسال رمز' : 'تغيير كلمة المرور'}
              </Button>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
};
