import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Mail, Phone, User, GraduationCap, Scale, Building2, FileText, Check, Sun, Moon, Loader2, AlertCircle, CheckCircle2, X, Lock, Home } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { apiService } from '../services/apiService';
import { storageService } from '../services/storageService';
import { User as UserType } from '../types';
import { Spinner, Modal } from '../components/UI';
import { Recaptcha, executeRecaptcha } from '../components/Recaptcha';
import { validatePassword, type PasswordValidation } from '../utils/passwordValidator';
import { OtpInput } from '../components/OtpInput';
import { FacultySelector } from '../components/FacultySelector';
import { toast } from 'sonner';

type UserAccountType = 'lawyer' | 'student' | 'cabinet' | null;
type PlanType = 'basic' | 'pro' | 'enterprise' | null;

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  university?: string;
  barNumber?: string;
  cabinetName?: string;
  barRegistrationNumber?: string;
  officeAddress?: string;
  numberOfLawyers?: string;
  password?: string;
  confirmPassword?: string;
  otp?: string;
}

export const RegisterPage = ({ onLogin, onNavigate }: { onLogin: (user: UserType) => void; onNavigate: (page: string) => void }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [userType, setUserType] = useState<UserAccountType>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    university: '',
    barNumber: '',
    cabinetName: '',
    barRegistrationNumber: '',
    officeAddress: '',
    numberOfLawyers: '',
    password: '',
    confirmPassword: '',
  });

  const [pricing, setPricing] = useState({ pro: 59, enterprise: 199 });
  const [planLimits, setPlanLimits] = useState<Record<string, { cases: number; contracts: number }>>({
    basic: { cases: 5, contracts: 2 },
    pro: { cases: 50, contracts: 100 },
    enterprise: { cases: 9999, contracts: 9999 },
  });

  const [recaptchaToken, setRecaptchaToken] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    const loadPricing = async () => {
      try {
        const [p, l] = await Promise.all([storageService.getPlanPricing(), storageService.getPlanLimits()]);
        if (p) setPricing(p);
        if (l) setPlanLimits(l);
      } catch (e) {
        // Use defaults
      }
    };
    loadPricing();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);
  }, [step]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Clear email error when user changes the email
    if (field === 'email' && emailError) {
      setEmailError(null);
    }

    if (field === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    setPasswordStrength(Math.min(strength, 4));
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength === 1) return window.__t("ضعيفة");
    if (passwordStrength === 2) return window.__t("متوسطة");
    if (passwordStrength === 3) return window.__t("جيدة");
    return window.__t("قوية جداً");
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength === 2) return 'bg-yellow-500';
    if (passwordStrength === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateTunisianPhone = (phone: string) => {
    const phoneRegex = /^(\+216|00216|216)?[2-9]\d{7}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const isValidStep2 = formData.fullName.trim().length >= 10 &&
    validateEmail(formData.email) &&
    validateTunisianPhone(formData.phone) &&
    formData.password.length >= 8 &&
    formData.password === formData.confirmPassword &&
    (userType === 'student' ? !!formData.university.trim() : true) &&
    (userType === 'lawyer' ? !!formData.barNumber.trim() : true) &&
    (userType === 'cabinet' ? (!!formData.cabinetName.trim() && !!formData.barRegistrationNumber.trim() && !!formData.officeAddress.trim() && !!formData.numberOfLawyers.trim()) : true);

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!formData.fullName.trim()) {
      newErrors.fullName = window.__t("أدخل اسمك الكامل");
      isValid = false;
    } else if (formData.fullName.trim().length < 10) {
      newErrors.fullName = window.__t("أدخل اسمك الكامل");
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = window.__t("البريد الإلكتروني مطلوب");
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = window.__t("البريد الإلكتروني غير صالح");
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = window.__t("رقم الهاتف مطلوب");
      isValid = false;
    } else if (!validateTunisianPhone(formData.phone)) {
      newErrors.phone = window.__t("رقم هاتف تونسي غير صالح");
      isValid = false;
    }

    if (userType === 'student' && !formData.university.trim()) {
      newErrors.university = window.__t("اسم الجامعة مطلوب");
      isValid = false;
    }

    if (userType === 'lawyer' && !formData.barNumber.trim()) {
      newErrors.barNumber = window.__t("رقم بطاقة المحاماة مطلوب");
      isValid = false;
    }

    if (userType === 'cabinet' && !formData.cabinetName.trim()) {
      newErrors.cabinetName = window.__t("اسم المكتب مطلوب");
      isValid = false;
    }

    if (userType === 'cabinet' && !formData.barRegistrationNumber.trim()) {
      newErrors.barRegistrationNumber = window.__t("رقم التسجيل بالهيئة مطلوب");
      isValid = false;
    }

    if (userType === 'cabinet' && !formData.officeAddress.trim()) {
      newErrors.officeAddress = window.__t("العنوان مطلوب");
      isValid = false;
    }

    if (userType === 'cabinet' && !formData.numberOfLawyers.trim()) {
      newErrors.numberOfLawyers = window.__t("عدد المحامين مطلوب");
      isValid = false;
    } else if (userType === 'cabinet' && (isNaN(parseInt(formData.numberOfLawyers)) || parseInt(formData.numberOfLawyers) < 1)) {
      newErrors.numberOfLawyers = window.__t("الرجاء إدخال عدد صحيح من المحامين");
      isValid = false;
    }

    const hasUpper = /[A-Z]/.test(formData.password);
    const hasLower = /[a-z]/.test(formData.password);
    const hasNumber = /\d/.test(formData.password);

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = window.__t("كلمة المرور يجب أن تتكون من 8 أحرف على الأقل");
      isValid = false;
    } else if (!hasUpper || !hasLower || !hasNumber) {
      newErrors.password = window.__t("كلمة المرور يجب أن تحتوي على حرف كبير، حرف صغير ورقم على الأقل");
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = window.__t("تأكيد كلمة المرور مطلوب");
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = window.__t("كلمات المرور غير متطابقة");
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNextStep1 = () => {
    if (!userType) {
      toast.error(window.__t("يرجى اختيار نوع الحساب"));
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = async () => {
    if (!validateStep2()) {
      toast.error(window.__t("يرجى تصحيح الأخطاء في النموذج"));
      return;
    }

    setIsLoading(true);
    try {
      const success = await handleSendOTPInternal();
      if (success) {
        setStep(3);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTPInternal = async (): Promise<boolean> => {
    try {
      console.log('📧 Sending OTP with:', {
        email: formData.email.trim(),
        name: formData.fullName.trim(),
        accountType: userType,
      });
      
      setEmailError(null);
      
      await apiService.sendRegistrationOTP(
        formData.email.trim(),
        formData.password,
        formData.fullName.trim(),
        formData.phone,
        userType || 'lawyer'
      );
      setOtpSent(true);
      toast.success(window.__t("✅ تم إرسال الرمز إلى بريدك الإلكتروني"));
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error || window.__t("فشل إرسال الرمز"));
      const duplicateEmailPatterns = [
        'هذا البريد مسجل',
        'مسبقاً',
        'مستخدم بالفعل',
        'البريد الإلكتروني مستخدم بالفعل',
        'البريد مسجل',
        'already',
        'email is already',
      ];

      const isDuplicateEmail = duplicateEmailPatterns.some((pattern) =>
        errorMsg.toLowerCase().includes(pattern.toLowerCase())
      );

      if (isDuplicateEmail) {
        const emailAlreadyRegisteredMsg = window.__t("هذا البريد موجود بالفعل، حاول باستخدام بريد آخر");
        setEmailError(emailAlreadyRegisteredMsg);
        setErrors((prev) => ({
          ...prev,
          email: window.__t("البريد موجود بالفعل"),
        }));
        toast.error(emailAlreadyRegisteredMsg);
      } else {
        toast.error(`❌ ${errorMsg}`);
      }

      console.error('❌ OTP Error:', errorMsg);
      return false;
    }
  };


  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error(window.__t("يرجى إدخال رمز صحيح"));
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 Step 3 - Verifying OTP:', {
        email: formData.email.trim(),
        otpCode: otpCode,
        length: otpCode.length,
      });
      
      await apiService.verifyRegistrationOTP(formData.email.trim(), otpCode);
      setOtpVerified(true);
      toast.success(window.__t("✅ تم التحقق من البريد الإلكتروني بنجاح!"));
      console.log('✅ Moving to Step 4 - Plan Selection');
      setStep(4);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : window.__t("فشل التحقق من الرمز");
      console.error('❌ OTP Verification failed:', errorMsg);
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      if (step === 3 && otpSent) {
        setOtpSent(false);
        setOtpCode('');
      }
      setEmailError(null);
      setErrors({});
      setStep((step - 1) as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlan) {
      toast.error(window.__t("يرجى اختيار خطة"));
      return;
    }

    setIsLoading(true);

    try {
      let token = recaptchaToken;
      if (!token) {
        const freshToken = await executeRecaptcha('register');
        if (freshToken) {
          token = freshToken;
          setRecaptchaToken(freshToken);
        }
      }

      if (!token) {
        toast.error(window.__t("reCAPTCHA مطلوب"));
        return;
      }

      // Complete registration - always create with basic plan first
      const response = await apiService.register(
        formData.email.trim(),
        formData.password,
        formData.fullName.trim(),
        token,
        formData.phone,
        userType || 'lawyer',
        'basic', // Always start with basic plan
        formData.barNumber,
        formData.cabinetName,
        formData.university,
        userType === 'lawyer' || userType === 'student' ? 'LAWYER' : 'CLIENT',
        formData.barRegistrationNumber,
        formData.officeAddress,
        formData.numberOfLawyers
      );

      console.log('Registration successful:', response);

      if (selectedPlan && selectedPlan !== 'basic') {
        toast.success(window.__t("تم إنشاء الحساب بنجاح! يتم توجيهك إلى صفحة الدفع..."), {
          duration: 4000,
        });

        const checkoutResult = await storageService.checkoutSubscription(selectedPlan);
        if (checkoutResult.formUrl) {
          window.location.href = checkoutResult.formUrl;
          return;
        }

        toast.error(window.__t("حدث خطأ أثناء فتح صفحة الدفع. يمكنك تسجيل الدخول ومحاولة الدفع مرة أخرى."));
        storageService.logout();
        onNavigate('login');
        return;
      }

      storageService.logout();
      toast.success(window.__t("تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول للمتابعة."), {
        duration: 5000,
      });
      onNavigate('login');
      return;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : window.__t("فشل إنشاء الحساب");
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-[#0B1121] via-[#111423] to-[#151b2a] text-white' : 'bg-gradient-to-br from-[#f9f6f1] via-[#f4ece0] to-[#ead8b2] text-slate-900'} flex items-center justify-center p-4 relative`}
      style={{ fontFamily: "'Tajawal', sans-serif" }}
    >
      <style>{`
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
      `}</style>
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-[#0B1121]' : 'bg-[#f9f6f1]'}`}></div>
        <div className="absolute top-10 end-10 w-96 h-96 bg-orange-100/20 dark:bg-slate-700/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 start-10 w-96 h-96 bg-orange-100/20 dark:bg-slate-700/15 rounded-full blur-3xl"></div>
        <div className={`absolute top-[20%] start-1/2 -translate-x-1/2 w-[460px] h-[460px] rounded-full ${theme === 'dark' ? 'bg-white/6' : 'bg-white/90'} blur-[150px]`}></div>
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[url('/noise.svg')] bg-repeat"></div>
      </div>

      {/* Floating Controls Overlay */}
      <div className="absolute top-6 start-6 flex items-center gap-3 z-30">
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
          onClick={() => { 
            const lang = window.__i18n?.language === 'ar' ? 'fr' : 'ar';
            window.__i18n?.changeLanguage(lang); 
            window.location.reload(); 
          }} 
          className={`w-11 h-11 rounded-full ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:text-white' : 'bg-white/70 border-slate-200 hover:bg-white text-slate-500 hover:text-orange-500'} backdrop-blur-md border flex items-center justify-center font-bold text-[10px] transition-all shadow-sm`}
        >
          {window.__i18n?.language === 'ar' ? 'FR' : 'AR'}
        </button>
      </div>

      {/* Back to Home Button */}
      <button
        onClick={() => onNavigate('landing')}
        className={`absolute top-6 end-6 px-5 h-11 rounded-full flex items-center justify-center gap-2 transition-all shadow-sm z-20 group backdrop-blur-md border ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:text-white' : 'bg-white/70 border-slate-200 hover:bg-white text-slate-600 hover:text-orange-600'} font-bold text-sm tracking-wide`}
      >
        <Home className={`w-4 h-4 transition-colors ${theme === 'dark' ? 'text-white/50 group-hover:text-white' : 'text-slate-400 group-hover:text-orange-500'}`} />
        <span className="hidden sm:inline-block">{window.__t("العودة للرئيسية")}</span>
      </button>

      <div className="w-full max-w-5xl relative z-10">
        <div className={`absolute inset-0 rounded-[3rem] border transition duration-700 ${theme === 'dark' ? 'border-white/10 bg-white/5 shadow-[0_40px_120px_-50px_rgba(0,0,0,0.35)]' : 'border-white/20 bg-white/70 shadow-[0_40px_120px_-50px_rgba(15,23,42,0.22)]'} backdrop-blur-3xl`}></div>
        <div className="relative">
          {/* Logo */}
        <div className="text-center mb-4 mt-6">
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
          <h1 className="text-3xl text-slate-900 dark:text-white font-bold" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>
            {window.__t("إنشاء حساب جديد")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            {window.__t("انضم إلى المحامي اليوم")}
          </p>
        </div>

        {/* Main Card */}
        <div className={`relative rounded-3xl overflow-hidden shadow-2xl p-4 md:p-6 border transition-all duration-700 ${theme === 'dark' ? 'bg-[#131B2E]/80 border-white/10' : 'bg-white/40 border-white/60'} backdrop-blur-[40px]`}>
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none -z-10"></div>
          
          {/* Progress Steps - Updated to 4 steps */}
          <div className="flex items-center justify-center mb-6 gap-1 md:gap-2">
            {[1, 2, 3, 4].map((s, idx) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= s
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 border border-gray-200 dark:border-slate-600'
                  }`}
                  style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}
                >
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {idx < 3 && (
                  <div
                    className={`w-8 md:w-12 h-1 rounded-full mx-1 md:mx-2 transition-all ${
                      step > s ? 'bg-gradient-to-l from-orange-500 to-orange-600' : 'bg-gray-200 dark:bg-slate-700'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Step 1: Account Type */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <h2 className="text-2xl text-slate-900 dark:text-white font-bold" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>
                    {window.__t("اختر نوع الحساب")}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                    {window.__t("حدد الخيار المناسب لاحتياجاتك")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Lawyer */}
                  <button
                    type="button"
                    onClick={() => setUserType('lawyer')}
                    className={`flex flex-col items-center justify-center p-6 min-h-[220px] rounded-[1.5rem] border transition-all text-center bg-white dark:bg-slate-800 group ${
                      userType === 'lawyer'
                        ? 'border-orange-500 shadow-xl shadow-orange-500/10 scale-[1.02]'
                        : 'border-slate-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-md'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-4 transition-colors ${userType === 'lawyer' ? 'bg-orange-500 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400'} border border-slate-100/50 dark:border-slate-800 shadow-sm`}>
                      <Scale className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg text-slate-900 dark:text-white font-bold mb-1 whitespace-normal break-words" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>
                      {window.__t("محامي")}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-normal break-words" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                      {window.__t("للمحامين المرخصين والممارسين")}
                    </p>
                  </button>

                  {/* Cabinet */}
                  <button
                    type="button"
                    onClick={() => setUserType('cabinet')}
                    className={`flex flex-col items-center justify-center p-6 min-h-[220px] rounded-[1.5rem] border transition-all text-center bg-white dark:bg-slate-800 group ${
                      userType === 'cabinet'
                        ? 'border-orange-500 shadow-xl shadow-orange-500/10 scale-[1.02]'
                        : 'border-slate-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-md'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-4 transition-colors ${userType === 'cabinet' ? 'bg-orange-500 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400'} border border-slate-100/50 dark:border-slate-800 shadow-sm`}>
                      <Building2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg text-slate-900 dark:text-white font-bold mb-1 whitespace-normal break-words" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>
                      {window.__t("مكتب محاماة")}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-normal break-words" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                      {window.__t("لإدارة فريق عمل متكامل")}
                    </p>
                  </button>

                  {/* Student */}
                  <button
                    type="button"
                    onClick={() => setUserType('student')}
                    className={`flex flex-col items-center justify-center p-6 min-h-[220px] rounded-[1.5rem] border transition-all text-center bg-white dark:bg-slate-800 group ${
                      userType === 'student'
                        ? 'border-orange-500 shadow-xl shadow-orange-500/10 scale-[1.02]'
                        : 'border-slate-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-md'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-4 transition-colors ${userType === 'student' ? 'bg-orange-500 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400'} border border-slate-100/50 dark:border-slate-800 shadow-sm`}>
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg text-slate-900 dark:text-white font-bold mb-1 whitespace-normal break-words" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>
                      {window.__t("طالب قانون")}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-normal break-words" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                      {window.__t("للأغراض التعليمية والبحثية")}
                    </p>
                  </button>
                </div>

                <Button
                  type="button"
                  onClick={handleNextStep1}
                  disabled={!userType || isLoading}
                  className={`w-full h-14 rounded-xl font-bold text-base mt-2 transition-all duration-[400ms] border-2 shadow-sm ${
                    userType 
                      ? 'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white border-transparent shadow-orange-500/30' 
                      : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-white/30 border-slate-200 dark:border-white/10 cursor-not-allowed opacity-60'
                  }`}
                  style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}
                >
                  {window.__t("التالي — معلومات الحساب")}
                </Button>

                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className={`text-sm ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'} hover:opacity-80 transition-colors font-medium`}
                    style={{ fontFamily: "'Tajawal', sans-serif" }}
                  >
                    {window.__t("لديك حساب؟")} <span className="text-orange-600 font-bold">{window.__t("تسجيل الدخول")}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Personal Info + Password */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <h2 className="text-2xl text-orange-900 dark:text-orange-200 font-bold" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>
                    {window.__t("معلوماتك الشخصية")}
                  </h2>
                  <p className="text-orange-700 dark:text-orange-400 text-sm mt-1" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                    {window.__t("أدخل بياناتك لإنشاء حسابك")}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-sm text-orange-900 dark:text-orange-200 block text-start font-bold" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>
                      {window.__t("الاسم الكامل")}
                      {errors.fullName && <span className="text-red-600"> {window.__t("مطلوب")}</span>}
                    </label>
                    <div className="relative group">
                      <Input
                        ref={firstInputRef}
                        type="text"
                        placeholder={window.__t("أدخل اسمك الكامل")}
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        disabled={isLoading}
                        className={`w-full ps-11 h-11 ${errors.fullName ? 'border-2 border-red-500' : ''}`}
                        required
                      />
                      <User className={`absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.fullName ? 'text-red-500' : 'text-muted-foreground'}`} />
                    </div>
                    {errors.fullName && <p className="text-red-500 text-xs text-end">{errors.fullName}</p>}
                  </div>

                  {/* Email & Phone */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-foreground dark:text-orange-200 block text-start font-medium">
                        {window.__t("البريد الإلكتروني")}
                        {errors.email && <span className="text-red-500"> {window.__t("مطلوب")}</span>}
                      </label>
                      <div className="relative group">
                        <Input
                          type="email"
                          placeholder={window.__t("أدخل بريدك الإلكتروني")}
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          disabled={isLoading}
                          className={`w-full ps-11 h-11 ${errors.email ? 'border-2 border-red-500' : ''}`}
                          required
                        />
                        <Mail className={`absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.email ? 'text-red-500' : 'text-muted-foreground'}`} />
                      </div>
                      {errors.email && <p className="text-red-500 text-xs text-end">{errors.email}</p>}
                      {emailError && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700 dark:text-red-300 text-end flex-1">{emailError}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-foreground dark:text-orange-200 block text-start font-medium">
                        {window.__t("رقم الهاتف")}
                        {errors.phone && <span className="text-red-500"> {window.__t("مطلوب")}</span>}
                      </label>
                      <div className="relative group">
                        <Input
                          type="number"
                          placeholder={window.__t("🇹🇳 أدخل رقم هاتفك")}
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          disabled={isLoading}
                          className={`w-full ps-11 h-11 ${errors.phone ? 'border-2 border-red-500' : ''}`}
                          required
                        />
                        <Phone className={`absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.phone ? 'text-red-500' : 'text-muted-foreground'}`} />
                      </div>
                      {errors.phone && <p className="text-red-500 text-xs text-end">{errors.phone}</p>}
                    </div>
                  </div>

                  {/* Conditional Fields */}
                  {userType === 'student' && (
                    <div className="space-y-2">
                      <label className="text-sm text-foreground dark:text-orange-200 block text-start font-medium">
                        {window.__t("الكلية أو المؤسسة")}
                        {errors.university && <span className="text-red-500"> {window.__t("مطلوب")}</span>}
                      </label>
                      <FacultySelector
                        value={formData.university}
                        onChange={(id, name) => handleInputChange('university', name)}
                        error={errors.university}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  )}

                  {userType === 'lawyer' && (
                    <div className="space-y-2">
                      <label className="text-sm text-foreground dark:text-orange-200 block text-start font-medium">
                        {window.__t("رقم بطاقة المحاماة")}
                        {errors.barNumber && <span className="text-red-500"> {window.__t("مطلوب")}</span>}
                      </label>
                      <div className="relative group">
                        <Input
                          type="text"
                          placeholder={window.__t("أدخل رقم بطاقة المحاماة")}
                          value={formData.barNumber}
                          onChange={(e) => handleInputChange('barNumber', e.target.value)}
                          disabled={isLoading}
                          className={`w-full ps-11 h-11 ${errors.barNumber ? 'border-2 border-red-500' : ''}`}
                          required
                        />
                        <FileText className={`absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.barNumber ? 'text-red-500' : 'text-muted-foreground'}`} />
                      </div>
                      {errors.barNumber && <p className="text-red-500 text-xs text-end">{errors.barNumber}</p>}
                    </div>
                  )}

                  {userType === 'cabinet' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm text-foreground dark:text-orange-200 block text-start font-medium">
                          {window.__t("اسم المكتب")}
                          {errors.cabinetName && <span className="text-red-500"> {window.__t("مطلوب")}</span>}
                        </label>
                        <div className="relative group">
                          <Input
                            type="text"
                            placeholder={window.__t("أدخل اسم المكتب القانوني")}
                            value={formData.cabinetName}
                            onChange={(e) => handleInputChange('cabinetName', e.target.value)}
                            disabled={isLoading}
                            className={`w-full ps-11 h-11 ${errors.cabinetName ? 'border-2 border-red-500' : ''}`}
                            required
                          />
                          <Building2 className={`absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.cabinetName ? 'text-red-500' : 'text-muted-foreground'}`} />
                        </div>
                        {errors.cabinetName && <p className="text-red-500 text-xs text-end">{errors.cabinetName}</p>}
                      </div>

                      {/* Bar Registration Number */}
                      <div className="space-y-2">
                        <label className="text-sm text-foreground dark:text-orange-200 block text-start font-medium">
                          {window.__t("رقم التسجيل بالهيئة")}
                          {errors.barRegistrationNumber && <span className="text-red-500"> {window.__t("مطلوب")}</span>}
                        </label>
                        <div className="relative group">
                          <Input
                            type="text"
                            placeholder={window.__t("أدخل رقم التسجيل")}
                            value={formData.barRegistrationNumber}
                            onChange={(e) => handleInputChange('barRegistrationNumber', e.target.value)}
                            disabled={isLoading}
                            className={`w-full ps-11 h-11 ${errors.barRegistrationNumber ? 'border-2 border-red-500' : ''}`}
                            required
                          />
                          <FileText className={`absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.barRegistrationNumber ? 'text-red-500' : 'text-muted-foreground'}`} />
                        </div>
                        {errors.barRegistrationNumber && <p className="text-red-500 text-xs text-end">{errors.barRegistrationNumber}</p>}
                      </div>

                      {/* Office Address */}
                      <div className="space-y-2">
                        <label className="text-sm text-foreground dark:text-orange-200 block text-start font-medium">
                          {window.__t("العنوان")}
                          {errors.officeAddress && <span className="text-red-500"> {window.__t("مطلوب")}</span>}
                        </label>
                        <div className="relative group">
                          <Input
                            type="text"
                            placeholder={window.__t("أدخل عنوان المكتب")}
                            value={formData.officeAddress}
                            onChange={(e) => handleInputChange('officeAddress', e.target.value)}
                            disabled={isLoading}
                            className={`w-full ps-11 h-11 ${errors.officeAddress ? 'border-2 border-red-500' : ''}`}
                            required
                          />
                          <Building2 className={`absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.officeAddress ? 'text-red-500' : 'text-muted-foreground'}`} />
                        </div>
                        {errors.officeAddress && <p className="text-red-500 text-xs text-end">{errors.officeAddress}</p>}
                      </div>

                      {/* Number of Lawyers */}
                      <div className="space-y-2">
                        <label className="text-sm text-foreground dark:text-orange-200 block text-start font-medium">
                          {window.__t("عدد المحامين")}
                          {errors.numberOfLawyers && <span className="text-red-500"> {window.__t("مطلوب")}</span>}
                        </label>
                        <div className="relative group">
                          <Input
                            type="number"
                            min="1"
                            placeholder={window.__t("أدخل عدد المحامين")}
                            value={formData.numberOfLawyers}
                            onChange={(e) => handleInputChange('numberOfLawyers', e.target.value)}
                            disabled={isLoading}
                            className={`w-full ps-11 h-11 ${errors.numberOfLawyers ? 'border-2 border-red-500' : ''}`}
                            required
                          />
                          <Scale className={`absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.numberOfLawyers ? 'text-red-500' : 'text-muted-foreground'}`} />
                        </div>
                        {errors.numberOfLawyers && <p className="text-red-500 text-xs text-end">{errors.numberOfLawyers}</p>}
                      </div>
                    </div>
                  )}

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-sm text-foreground dark:text-orange-200 block text-start font-medium">
                      {window.__t("كلمة المرور")}
                      {errors.password && <span className="text-red-500"> {window.__t("مطلوب")}</span>}
                    </label>
                    <div className="relative group">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={window.__t("أدخل كلمة مرور قوية (8 أحرف، تحتوي على أرقام وحروف)")}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        disabled={isLoading}
                        className={`w-full px-11 h-11 ${errors.password ? 'border-2 border-red-500' : ''}`}
                        required
                      />
                      <Lock className={`absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.password ? 'text-red-500' : 'text-muted-foreground'}`} />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs text-end">{errors.password}</p>}
                    {formData.password && (
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 h-1.5 rounded-full ${getPasswordStrengthColor()}`}></div>
                        <span className="text-xs text-muted-foreground">{getPasswordStrengthLabel()}</span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-sm text-foreground dark:text-orange-200 block text-start font-medium">
                      {window.__t("تأكيد كلمة المرور")}
                      {errors.confirmPassword && <span className="text-red-500"> {window.__t("مطلوب")}</span>}
                    </label>
                    <div className="relative group">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder={window.__t("أعد إدخال كلمة المرور للتأكيد")}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        disabled={isLoading}
                        className={`w-full px-11 h-11 ${errors.confirmPassword ? 'border-2 border-red-500' : ''}`}
                        required
                      />
                      <Lock className={`absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.confirmPassword ? 'text-red-500' : 'text-muted-foreground'}`} />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-xs text-end">{errors.confirmPassword}</p>}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 h-12 rounded-lg text-sm bg-white hover:bg-slate-50 active:bg-white text-slate-600 border-slate-200 transition-all shadow-sm"
                    disabled={isLoading}
                  >
                    {window.__t("رجوع")}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep2}
                    className={`flex-1 h-12 rounded-lg font-bold text-sm transition-all duration-300 border-2 ${
                      isLoading
                        ? 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-white/30 border-slate-200 dark:border-white/10 cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white border-transparent shadow-lg shadow-orange-500/20'
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {window.__t("جارٍ الإرسال...")}
                      </span>
                    ) : (
                      window.__t("تحقق من البريد")
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: OTP Verification */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <h2 className="text-2xl text-orange-900 dark:text-orange-200 font-bold" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>
                    {window.__t("التحقق من البريد الإلكتروني")}
                  </h2>
                  <p className="text-orange-700 dark:text-orange-400 text-sm mt-1" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                    {window.__t("أدخل رمز التحقق المرسل إلى")} <span className="font-bold">{formData.email}</span>
                  </p>
                </div>

                {!otpSent ? (
                  <Button
                    type="button"
                    onClick={handleSendOTPInternal}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-l from-orange-500 to-orange-600 text-white h-12 rounded-xl font-bold text-base"
                    style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {window.__t("جارٍ الإرسال...")}
                      </span>
                    ) : (
                      window.__t("إرسال رمز التحقق")
                    )}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {/* Success Message */}
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-700 dark:text-green-300" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        {window.__t("تم إرسال رمز التحقق بنجاح! تحقق من بريدك الإلكتروني (قد يستغرق دقيقة واحدة).")}
                      </div>
                    </div>

                    {/* OTP Input */}
                    <div className="space-y-2">
                      <label className="text-sm text-foreground dark:text-orange-200 block text-start font-medium">
                        {window.__t("رمز التحقق (6 أرقام)")}
                        {errors.otp && <span className="text-red-500"> {window.__t("مطلوب")}</span>}
                      </label>
                      <OtpInput
                        value={otpCode}
                        onChange={(value) => {
                          setOtpCode(value);
                          if (errors.otp) {
                            setErrors((prev) => ({ ...prev, otp: undefined }));
                          }
                        }}
                        length={6}
                        disabled={isLoading}
                        error={errors.otp ? window.__t("رمز التحقق مطلوب") : undefined}
                        autoFocus
                      />
                    </div>

                    {/* Verify Button */}
                    <Button
                      type="button"
                      onClick={handleVerifyOTP}
                      disabled={otpCode.length !== 6 || isLoading}
                      className="w-full bg-gradient-to-l from-orange-500 to-orange-600 text-white h-12 rounded-xl font-bold text-base"
                      style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {window.__t("جارٍ التحقق...")}
                        </span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 ms-2" />
                          {window.__t("التحقق من الرمز")}
                        </>
                      )}
                    </Button>

                    {/* Resend Code Link */}
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setOtpSent(false);
                          setOtpCode('');
                          setErrors({});
                        }}
                        disabled={isLoading}
                        className="text-sm text-orange-600 hover:text-orange-700 transition-colors font-medium"
                        style={{ fontFamily: "'Tajawal', sans-serif" }}
                      >
                        {window.__t("لم تتلقَ الرمز؟")} <span className="underline">{window.__t("اطلب رمزاً جديداً")}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Navigation Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 h-12 rounded-lg text-sm bg-white hover:bg-slate-50 active:bg-white text-slate-600 border-slate-200 transition-all shadow-sm"
                    disabled={isLoading}
                  >
                    {window.__t("رجوع")}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Plan Selection */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="text-center mb-8">
                  <h2 className="text-2xl text-orange-900 dark:text-orange-200 font-bold" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>
                    {window.__t("باقات تناسب جميع المحامين")}
                  </h2>
                  <p className="text-orange-700 dark:text-orange-400 text-sm mt-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                    {window.__t("اختر الباقة المناسبة لاحتياجاتك واحصل على جميع المميزات")}
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Basic Plan */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('basic')}
                    className={`relative p-6 rounded-xl border-2 transition-all text-start ${
                      selectedPlan === 'basic'
                        ? 'border-primary bg-gradient-to-br from-primary/10 to-transparent shadow-lg'
                        : 'border-border hover:border-primary/50 hover:shadow-md'
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-foreground dark:text-orange-200 mb-1">{window.__t("البداية")}</h3>
                    <p className="text-muted-foreground dark:text-orange-400 text-xs mb-4">{window.__t("للمحامين المبتدئين والفرادى")}</p>

                    <div className="text-3xl font-bold text-primary mb-6">
                      0 <span className="text-sm">{window.__t("د.ت")}</span>
                    </div>

                    <div className="space-y-2.5 mb-6 text-sm text-muted-foreground dark:text-orange-400">
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {window.__t("إدارة")} {planLimits.basic.cases} {window.__t("قضايا")}
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {window.__t("تحضير")} {planLimits.basic.contracts} {window.__t("عقد")}
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {window.__t("الوصول للمكتبة")}
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {window.__t("دعم عام")}
                      </p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center absolute top-6 start-6 ${
                        selectedPlan === 'basic' ? 'border-primary bg-primary' : 'border-border'
                      }`}
                    >
                      {selectedPlan === 'basic' && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </button>

                  {/* Pro Plan */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('pro')}
                    className={`relative p-6 rounded-xl border-2 transition-all text-start ${
                      selectedPlan === 'pro'
                        ? 'border-primary bg-gradient-to-br from-primary/10 to-transparent shadow-lg ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50 hover:shadow-md'
                    }`}
                  >
                    <div className="absolute -top-4 start-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-[#D4941C] text-white px-4 py-1 rounded-full text-xs font-medium">
                      {window.__t("الأفضل")}
                    </div>

                    <h3 className="text-lg font-semibold text-foreground dark:text-orange-200 mb-1">{window.__t("المحترف")}</h3>
                    <p className="text-muted-foreground dark:text-orange-400 text-xs mb-4">{window.__t("للمحامين المهنيين")}</p>

                    <div className="text-3xl font-bold text-primary mb-6">
                      {pricing.pro} <span className="text-sm">{window.__t("د.ت/سنة")}</span>
                    </div>

                    <div className="space-y-2.5 mb-6 text-sm text-muted-foreground dark:text-orange-400">
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {window.__t("إدارة")} {planLimits.pro.cases} {window.__t("قضية")}
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {window.__t("تحضير")} {planLimits.pro.contracts} {window.__t("عقد")}
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {window.__t("تحليل AI")}
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {window.__t("تقارير احترافية")}
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {window.__t("دعم ممتاز 24/7")}
                      </p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center absolute top-6 start-6 ${
                        selectedPlan === 'pro' ? 'border-primary bg-primary' : 'border-border'
                      }`}
                    >
                      {selectedPlan === 'pro' && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </button>

                  {/* Enterprise Plan */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('enterprise')}
                    className={`relative p-6 rounded-xl border-2 transition-all text-start ${
                      selectedPlan === 'enterprise'
                        ? 'border-primary bg-gradient-to-br from-primary/10 to-transparent shadow-lg'
                        : 'border-border hover:border-primary/50 hover:shadow-md'
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-foreground dark:text-orange-200 mb-1">{window.__t("المكتب")}</h3>
                    <p className="text-muted-foreground dark:text-orange-400 text-xs mb-4">{window.__t("للمكاتب والشركات")}</p>

                    <div className="text-3xl font-bold text-primary mb-6">
                      {pricing.enterprise} <span className="text-sm">{window.__t("د.ت/سنة")}</span>
                    </div>

                    <div className="space-y-2.5 mb-6 text-sm text-muted-foreground dark:text-orange-400">
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {window.__t("قضايا غير محدودة")}
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {window.__t("عقود غير محدودة")}
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {window.__t("فريق متعدد")}
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {window.__t("تحليل AI متقدم")}
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {window.__t("واجهة برمجية (API)")}
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {window.__t("دعم خاص 24/7")}
                      </p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center absolute top-6 start-6 ${
                        selectedPlan === 'enterprise' ? 'border-primary bg-primary' : 'border-border'
                      }`}
                    >
                      {selectedPlan === 'enterprise' && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                </div>

                <p className="text-center text-xs text-muted-foreground dark:text-orange-400 mt-6">
                  {window.__t("بالاشتراك، توافق على شروط الخدمة وسياسة الخصوصية")}
                </p>

                {selectedPlan && selectedPlan !== 'basic' && (
                  <p className="text-sm text-orange-600 dark:text-orange-300 text-center mt-4">
                    {window.__t("سيتم توجيهك إلى صفحة الدفع بعد إنشاء الحساب")}
                  </p>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 h-12 rounded-lg text-sm bg-white hover:bg-slate-50 active:bg-white text-slate-600 border-slate-200 transition-all shadow-sm"
                    disabled={isLoading}
                  >
                    {window.__t("رجوع")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedPlan || isLoading}
                    className={`flex-1 h-12 rounded-lg font-bold text-sm transition-all duration-300 border-2 ${
                      selectedPlan && !isLoading
                        ? 'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white border-transparent shadow-lg shadow-orange-500/20'
                        : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-white/30 border-slate-200 dark:border-white/10 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {window.__t("جارٍ الإنشاء...")}
                      </span>
                    ) : (
                      selectedPlan && selectedPlan !== 'basic'
                        ? window.__t("إنشاء الحساب والدفع")
                        : window.__t("إنشاء الحساب")
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Copyright Footer */}
        <div className={`mt-10 text-center text-[10px] sm:text-xs font-medium tracking-wide ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>
          {window.__t("© 2026 المحامي - جميع الحقوق محفوظة")}
        </div>
      </div>
    </div>

      <style>{`
        .glass { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
      `}</style>
    </div>
  );
};
