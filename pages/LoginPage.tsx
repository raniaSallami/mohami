import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Mail, Lock, Sun, Moon, Loader2, Home, ArrowRight, Video } from 'lucide-react';
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
/* ORIGINAL STATE PRESERVED */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const emailInputRef = useRef<HTMLInputElement>(null);
  
/* ORIGINAL FORGOT MODAL STATE */
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

/* ORIGINAL useEffect */
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) setTheme(savedTheme);
    emailInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const validation = validatePassword(newPassword);
    setNewPasswordValidation(validation);
  }, [newPassword]);

const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!email) {
      newErrors.email = window.__t("البريد الإلكتروني مطلوب");
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = window.__t("البريد الإلكتروني غير صالح");
      isValid = false;
    }

    if (!password) {
      newErrors.password = window.__t("كلمة المرور مطلوبة");
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = window.__t("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const translateErrorMessage = (message: string) => {
    return window.__t(message || "حدث خطأ");
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
        setForgotError(window.__t('reCAPTCHA requis'));
        return;
      }
      setForgotRecaptchaToken(freshToken);

      await apiService.forgotPasswordStep1(forgotEmail.trim());
      setForgotStep('otp');
      setForgotSuccess(window.__t("تم إرسال رمز التحقق إلى بريدك الإلكتروني. صلاحيته 10 دقائق."));
      toast.success(window.__t("تم إرسال رمز التحقق"));
    } catch (err) {
      const errorMsg = err instanceof Error ? translateErrorMessage(err.message) : window.__t("حدث خطأ");
      setForgotError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordValidation.isValid) {
      setForgotError(window.__t("كلمة المرور لا تحقق جميع المتطلبات"));
      toast.error(window.__t("كلمة المرور لا تحقق جميع المتطلبات"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError(window.__t("كلمة المرور غير مطابقة"));
      toast.error(window.__t("كلمة المرور غير مطابقة"));
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');
    try {
      await apiService.forgotPasswordStep2(forgotEmail.trim(), otp, newPassword);
      setForgotSuccess(window.__t("تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن."));
      toast.success(window.__t("تم تغيير كلمة المرور بنجاح"));
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep('email');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotEmail('');
      }, 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? translateErrorMessage(err.message) : window.__t("حدث خطأ");
      setForgotError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error(window.__t("يرجى تصحيح الأخطاء في النموذج"));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const freshToken = await getFreshRecaptchaToken('login') || recaptchaToken;
      if (!freshToken) {
        setError(window.__t('reCAPTCHA requis'));
        toast.error(window.__t('reCAPTCHA requis'));
        return;
      }
      setRecaptchaToken(freshToken);

      const fingerprintInstance = await (window as any).FingerprintJS?.get();
      const fingerprintValue = fingerprintInstance?.visitorId || navigator.userAgent || 'unknown';
      localStorage.setItem('device_fingerprint', fingerprintValue);
      
      const result = await apiService.loginEmailStep1(email.trim(), password, freshToken, fingerprintValue);
      
      if (result.needs_otp) {
        toast.success(window.__t("تم إرسال رمز التحقق إلى بريدك الإلكتروني"));
        localStorage.setItem('pending_device_verification_user_id', result.user_id || '');
        localStorage.setItem('pending_device_verification_email', email.trim());
        onNavigate('deviceVerification');
      } else {
        if (result.user && result.token) {
          storageService.setToken(result.token);
          storageService.setUser(result.user);
          onLogin(result.user);
          toast.success(window.__t("تم تسجيل الدخول بنجاح"));
        } else {
          throw new Error(window.__t("فشل تسجيل الدخول: بيانات المستخدم أو التوكن غير متاحة"));
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? translateErrorMessage(err.message) : window.__t("فشل تسجيل الدخول");
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

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };


  // Landing-like JSX - FIXED SYNTAX
  return (

    <div className={`min-h-screen font-['Tajawal'] overflow-hidden scroll-smooth transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0B1121] text-white' : 'bg-[#f9f6f1] text-slate-900'} glass`} dir={window.__i18n?.language === 'ar' ? 'rtl' : 'ltr'}>

      {/* ─── Global Animations & Custom Scrollbar ─── */}
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes float-delay { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        @keyframes glow { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes balance { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(5deg); } 75% { transform: rotate(-5deg); } }
        @keyframes reveal-blur { 
          0% { filter: blur(30px); opacity: 0; transform: translateY(60px) scale(0.9); }
          100% { filter: blur(0px); opacity: 1; transform: translateY(0) scale(1); }
        }
        .anim-float { animation: float 6s ease-in-out infinite; }
        .anim-float-d { animation: float-delay 8s ease-in-out infinite; }
        .anim-glow { animation: glow 4s ease-in-out infinite; }
        .anim-slide-up { animation: slide-up 0.8s ease-out both; }
        .anim-fade { animation: fade-in 1s ease-out both; }
        .anim-scale { animation: scale-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .anim-balance { animation: balance 5s ease-in-out infinite; transform-origin: center; }
        .anim-reveal-blur { animation: reveal-blur 1.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes text-shimmer { 0% { background-position: -100% 0; } 100% { background-position: 100% 0; } }
        .anim-text-shimmer {
          background: linear-gradient(90deg, currentColor 0%, #fb923c 50%, currentColor 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          animation: text-shimmer 4s linear infinite;
        }
        .glass { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .glass-sm { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        @keyframes fade-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .anim-fade-down { animation: fade-down 0.8s ease-out both; }
        
        /* ─── REAL ORANGE METALLIC & SHINE (SUNSET) ─── */
        .orange-metallic {
          background: linear-gradient(120deg, #ea580c 0%, #fb923c 25%, #c2410c 50%, #fdba74 75%, #9a3412 100%);
          background-size: 200% auto;
          color: white !important;
          transition: all 0.5s ease;
        }
        .orange-metallic:hover {
          background-position: right center;
          box-shadow: 0 20px 40px -10px rgba(234, 88, 12, 0.4);
        }
        .shine-effect {
          position: relative;
          overflow: hidden;
        }
        .shine-effect::after {
          content: "";
          position: absolute;
          top: -50%;
          left: -100%;
          width: 50%;
          height: 200%;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.4), transparent);
          transform: rotate(30deg);
          animation: shine 4s infinite;
        }
        @keyframes shine {
          0% { left: -100%; }
          20% { left: 100%; }
          100% { left: 100%; }
        }
        .text-orange-gradient {
          background: linear-gradient(120deg, #f97316, #fbbf24, #ea580c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 200% auto;
        }
      `}</style>

      {/* ─── Floating Decorative Orbs (Sunset Mastery) ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-[#0B1121]' : 'bg-[#f9f6f1]'}`}></div>
        <div className={`absolute -top-40 -end-[10%] w-[900px] h-[900px] rounded-full anim-float-d ${theme === 'dark' ? 'bg-orange-600/[0.12]' : 'bg-orange-200/[0.35]'} blur-[120px]`}></div>
        <div className={`absolute top-[15%] -start-[15%] w-[700px] h-[700px] rounded-full anim-float ${theme === 'dark' ? 'bg-amber-600/[0.08]' : 'bg-amber-100/[0.25]'} blur-[100px]`}></div>
        <div className={`absolute bottom-[10%] end-[5%] w-[800px] h-[800px] rounded-full anim-glow ${theme === 'dark' ? 'bg-indigo-500/[0.05]' : 'bg-orange-50/[0.2]'} blur-[130px]`}></div>
        <div className={`absolute top-1/3 start-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full ${theme === 'dark' ? 'bg-white/5' : 'bg-white/70'} blur-[140px]`}></div>
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('/noise.svg')] bg-repeat"></div>
      </div>

      {/* ─── FLOATING CONTROLS (Theme, Language, Home) ─── */}
      <div className="absolute top-6 start-6 flex items-center gap-3 z-50">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`w-11 h-11 rounded-full ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/70 border-slate-200 hover:bg-white'} backdrop-blur-md border flex items-center justify-center transition-all shadow-sm group`}
          aria-label={window.__t("تبديل الوضع")}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
          ) : (
            <Moon className="w-4 h-4 text-slate-500 group-hover:text-orange-500 transition-colors" />
          )}
        </button>
        {/* Language Toggle */}
        <button 
          onClick={() => { window.__i18n?.changeLanguage(window.__i18n.language === 'ar' ? 'fr' : 'ar'); window.location.reload(); }} 
          className={`w-11 h-11 rounded-full ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:text-white' : 'bg-white/70 border-slate-200 hover:bg-white text-slate-500 hover:text-orange-500'} backdrop-blur-md border flex items-center justify-center font-bold text-[10px] transition-all shadow-sm`}
        >
          {window.__i18n?.language === 'ar' ? 'FR' : 'AR'}
        </button>
      </div>

      {/* Back to Home Button */}
      <button
        onClick={() => onNavigate('landing')}
        className={`absolute top-6 end-6 px-5 h-11 rounded-full flex items-center justify-center gap-2 transition-all shadow-sm z-50 group backdrop-blur-md border ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:text-white' : 'bg-white/70 border-slate-200 hover:bg-white text-slate-600 hover:text-orange-600'} font-bold text-sm tracking-wide`}
      >
        <Home className={`w-4 h-4 transition-colors ${theme === 'dark' ? 'text-white/50 group-hover:text-white' : 'text-slate-400 group-hover:text-orange-500'}`} />
        <span className="hidden sm:inline-block">{window.__t("العودة للرئيسية")}</span>
      </button>

      {/* ═══════════════ HERO ═══════════════ */}
      <header className="relative overflow-hidden min-h-screen flex items-center justify-center">
        <div className={`absolute inset-0 z-0 ${theme === 'dark' ? 'bg-gradient-to-b from-[#0B1121] via-[#0B1121]/98 to-[#0B1121]' : 'bg-gradient-to-b from-[#fafaf9] via-[#fafaf9]/95 to-[#fafaf9]'}`}></div>

        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className={`absolute inset-0 mx-auto w-full max-w-[94rem] rounded-[3rem] border transition duration-700 ${theme === 'dark' ? 'border-white/10 bg-white/5 shadow-[0_40px_120px_-50px_rgba(0,0,0,0.4)]' : 'border-white/15 bg-white/70 shadow-[0_40px_120px_-50px_rgba(15,23,42,0.22)]'}`}></div>
        </div>

        <div className="container mx-auto px-4 py-8 lg:px-6 relative z-20 w-full flex justify-center">
          <div className="max-w-4xl mx-auto w-full relative rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-[0_32px_120px_-20px_rgba(0,0,0,0.3)]">
            {/* 💎 Ultra Glassmorphism Shield Background */}
            <div className={`absolute inset-0 -z-10 transition-all duration-700 ${theme === 'dark' ? 'bg-[#131B2E]/92 border-white/12 shadow-2xl' : 'bg-white/50 border-white/70 shadow-xl shadow-slate-200/40'} backdrop-blur-[40px] border`}></div>
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none -z-10"></div>

            {/* IMAGE / FEATURES PANEL */}
            <div className={`hidden md:flex w-5/12 flex-col justify-center p-10 relative overflow-hidden ${theme === 'dark' ? 'bg-[#0B1121]/40' : 'bg-slate-50/90 border-e border-slate-200/70'}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-slate-100/70 z-0"></div>
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-slate-200/30 rounded-full blur-[100px]"></div>
              
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center">
                <div className="relative w-full h-48 mb-8 rounded-[2rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20 group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-0 transition-opacity duration-1000"></div>
                  <img 
                    src="/assets/legal_platform_preview.png" 
                    alt="Al-Mohami Dashboard Preview" 
                    className="w-full h-full object-cover scale-[1.02] group-hover:scale-110 transition-transform duration-[2000ms] ease-out"
                  />
                  <div className="absolute inset-0 border-[6px] border-white/10 rounded-[2rem] pointer-events-none z-20"></div>
                </div>
                
                <h2 className={`text-2xl font-black mb-3 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {window.__t("كل ما يحتاجه المحامي")}
                </h2>
                <p className={`${theme === 'dark' ? 'text-white/50' : 'text-slate-500'} text-xs leading-relaxed mb-8 max-w-[240px] mx-auto font-medium`}>
                  {window.__t("إدارة القضايا، الجلسات، والمواعيد بكفاءة عالية. تحكم كامل في مكتبك لتوفير الوقت والتركيز على نجاحك.")}
                </p>
                
                <div className="flex flex-col items-stretch gap-2 w-full max-w-[200px]">
                   {[
                     { key: "إدارة القضايا", icon: "Scale" },
                     { key: "تتبع الجلسات", icon: "Calendar" },
                     { key: "العقود الذكية", icon: "FileText" }
                   ].map((item, idx) => (
                     <span 
                       key={idx}
                       className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-2xl border transition-all duration-500 flex items-center gap-2 ${
                         theme === 'dark' 
                         ? 'bg-white/5 text-white/90 border-white/10 hover:border-orange-500/50 hover:bg-orange-500/10' 
                         : 'bg-white border-slate-200 text-slate-800 hover:text-orange-600 hover:border-orange-300 shadow-sm'
                       }`}
                     >
                       <div className="w-1 h-1 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]"></div>
                       {window.__t(item.key)}
                     </span>
                   ))}
                </div>
              </div>
            </div>

            {/* CENTERED LOGIN FORM */}
            <div className="w-full md:w-7/12 flex flex-col items-center justify-center relative px-8 md:px-12 py-10">
              <div className="w-full max-w-sm mx-auto anim-scale" style={{animationDelay: '150ms'}}>
                {/* Form Header */}
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <div className="relative group cursor-pointer hover:-translate-y-1 transition-transform duration-500">
                      <div className="absolute inset-0 bg-orange-500 rounded-xl blur-lg opacity-40 group-hover:opacity-90 transition-opacity duration-500"></div>
                      <div className="relative flex items-center justify-center transition-all duration-700 w-12 h-12 rounded-xl orange-metallic shine-effect border border-white/20 shadow-xl group-hover:shadow-2xl">
                        <svg className="w-7 h-7 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 3v18" />
                          <path d="M5 8l-2 5h8l-2-5" />
                          <path d="M19 8l-2 5h8l-2-5" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <h1 className={`text-2xl lg:text-3xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{window.__t("تسجيل الدخول")}</h1>
                  <p className={`text-sm ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'} font-medium`}>{window.__t("سجل دخولك للوصول إلى مساحة العمل الخاصة بك")}</p>
                </div>

                {/* ORIGINAL FORM - RESTYLED */}
                <form onSubmit={handleSubmit} className="space-y-4 relative z-10 w-full">
                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'} block`}>{window.__t("البريد الإلكتروني")}</label>
                    <div className="relative">
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
                        className={`glass-sm h-12 w-full px-10 border ${errors.email ? 'border-red-500' : theme === 'dark' ? 'border-white/20 focus:border-orange-500/50' : 'border-slate-300 focus:border-orange-500 bg-white/50'} backdrop-blur text-base rounded-xl outline-none transition-colors`}
                        disabled={loading}
                        required
                      />
                      <Mail className={`absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.email ? 'text-red-500' : 'text-orange-500'}`} />
                    </div>
                    {errors.email && <p className="text-red-400 text-[10px] text-end">{errors.email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'} block`}>{window.__t("كلمة المرور")}</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors({ ...errors, password: '' });
                        }}
                        onKeyPress={handleKeyPress}
                        className={`glass-sm h-12 w-full px-10 border ${errors.password ? 'border-red-500' : theme === 'dark' ? 'border-white/20 focus:border-orange-500/50' : 'border-slate-300 focus:border-orange-500 bg-white/50'} backdrop-blur text-base rounded-xl outline-none transition-colors`}
                        disabled={loading}
                        required
                      />
                      <Lock className={`absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.password ? 'text-red-500' : 'text-orange-500'}`} />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute end-3.5 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-white/50 hover:text-white' : 'text-slate-400 hover:text-orange-500'} transition-colors`}
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-400 text-[10px] text-end">{errors.password}</p>}
                  </div>

                  {error && <div className="p-3 border border-red-400/20 text-red-500 dark:text-red-300 rounded-xl text-xs text-start font-medium bg-red-50 dark:bg-transparent">{error}</div>}

                  <div className="flex items-center justify-between mt-1">
                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-md border-2 transition-all duration-300 flex items-center justify-center ${rememberMe ? 'bg-orange-500 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'border-slate-300 dark:border-white/20 hover:border-orange-400'}`}>
                          {rememberMe && (
                            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className={`text-sm font-bold transition-colors ${rememberMe ? 'text-orange-600' : theme === 'dark' ? 'text-white/40' : 'text-slate-500'} group-hover:text-orange-500`}>
                        {window.__t("تذكرني")}
                      </span>
                    </label>

                    <button type="button" onClick={() => setShowForgotModal(true)} className="text-orange-500 hover:text-orange-600 text-sm font-bold transition-colors">
                      {window.__t("نسيت كلمة المرور؟")}
                    </button>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl orange-metallic shine-effect text-base font-black shadow-lg text-white dark:text-slate-900 transition-transform active:scale-[0.98]">
                    {loading ? (
                      <span className="flex items-center gap-2 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {window.__t("جارٍ...")}
                      </span>
                    ) : window.__t("تسجيل الدخول")}
                  </Button>
                </form>

                {allowRegistrations && (
                  <div className={`flex flex-col sm:flex-row items-center justify-center gap-2 pt-5 mt-5 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'} relative z-10 w-full`}>
                    <span className={`${theme === 'dark' ? 'text-white/60' : 'text-slate-600'} text-sm font-medium`}>
                      {window.__t("ليس لديك حساب؟")}
                    </span>
                    <button onClick={() => onNavigate('register')} className="text-orange-600 hover:text-orange-500 text-sm font-black hover:-translate-y-0.5 transition-all">
                      {window.__t("إنشاء حساب")}
                    </button>
                  </div>
                )}

                {/* Copyright Footer */}
                <div className={`mt-10 text-center text-[10px] sm:text-xs font-medium tracking-wide ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>
                  {window.__t("© 2026 المحامي - جميع الحقوق محفوظة")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* FORGOT MODAL */}
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
          title={window.__t("إعادة تعيين كلمة المرور")}
        >
          <form onSubmit={forgotStep === 'email' ? handleForgotSendOtp : handleForgotReset} className="space-y-4">
            {forgotStep === 'email' ? (
              <div>
                <label className="block text-sm font-medium mb-2">{window.__t("البريد الإلكتروني")}</label>
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
                  <label className="block text-sm font-medium mb-3 text-start">{window.__t("رمز التحقق")}</label>
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    length={6}
                    disabled={forgotLoading}
                    error={forgotError && otp.length !== 6 ? window.__t("أدخل 6 أرقام") : undefined}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{window.__t("كلمة المرور الجديدة")}</label>
                  <Input
                    type="password"
                    placeholder={window.__t("كلمة مرور قوية")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={forgotLoading}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{window.__t("تأكيد كلمة المرور")}</label>
                  <Input
                    type="password"
                    placeholder={window.__t("تأكيد كلمة المرور")}
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
              {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin me-2 inline" /> : null}
              {forgotStep === 'email' ? window.__t("إرسال رمز") : window.__t("تغيير كلمة المرور")}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
};

