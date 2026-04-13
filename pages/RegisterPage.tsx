import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Mail, Phone, User, GraduationCap, Scale, Building2, FileText, Check, Sun, Moon, Loader2, AlertCircle, CheckCircle2, X, Lock } from 'lucide-react';
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
    if (passwordStrength === 1) return 'ضعيفة';
    if (passwordStrength === 2) return 'متوسطة';
    if (passwordStrength === 3) return 'جيدة';
    return 'قوية جداً';
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

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'أدخل اسمك الكامل';
      isValid = false;
    } else if (formData.fullName.trim().length < 10) {
      newErrors.fullName = 'أدخل اسمك الكامل';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
      isValid = false;
    } else if (!validateTunisianPhone(formData.phone)) {
      newErrors.phone = 'رقم هاتف تونسي غير صالح';
      isValid = false;
    }

    if (userType === 'student' && !formData.university.trim()) {
      newErrors.university = 'اسم الجامعة مطلوب';
      isValid = false;
    }

    if (userType === 'lawyer' && !formData.barNumber.trim()) {
      newErrors.barNumber = 'رقم بطاقة المحاماة مطلوب';
      isValid = false;
    }

    if (userType === 'cabinet' && !formData.cabinetName.trim()) {
      newErrors.cabinetName = 'اسم المكتب مطلوب';
      isValid = false;
    }

    if (userType === 'cabinet' && !formData.barRegistrationNumber.trim()) {
      newErrors.barRegistrationNumber = 'رقم التسجيل بالهيئة مطلوب';
      isValid = false;
    }

    if (userType === 'cabinet' && !formData.officeAddress.trim()) {
      newErrors.officeAddress = 'العنوان مطلوب';
      isValid = false;
    }

    if (userType === 'cabinet' && !formData.numberOfLawyers.trim()) {
      newErrors.numberOfLawyers = 'عدد المحامين مطلوب';
      isValid = false;
    } else if (userType === 'cabinet' && (isNaN(parseInt(formData.numberOfLawyers)) || parseInt(formData.numberOfLawyers) < 1)) {
      newErrors.numberOfLawyers = 'الرجاء إدخال عدد صحيح من المحامين';
      isValid = false;
    }

    const hasUpper = /[A-Z]/.test(formData.password);
    const hasLower = /[a-z]/.test(formData.password);
    const hasNumber = /\d/.test(formData.password);

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل';
      isValid = false;
    } else if (!hasUpper || !hasLower || !hasNumber) {
      newErrors.password = 'كلمة المرور يجب أن تحتوي على حرف كبير، حرف صغير ورقم على الأقل';
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNextStep1 = () => {
    if (!userType) {
      toast.error('يرجى اختيار نوع الحساب');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = async () => {
    if (!validateStep2()) {
      toast.error('يرجى تصحيح الأخطاء في النموذج');
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
      
      await apiService.sendRegistrationOTP(
        formData.email.trim(),
        formData.password,
        formData.fullName.trim(),
        formData.phone,
        userType || 'lawyer'
      );
      setOtpSent(true);
      toast.success('✅ تم إرسال الرمز إلى بريدك الإلكتروني');
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'فشل إرسال الرمز';
      
      // If email already exists error, highlight the email field
      if (errorMsg.includes('البريد مسجل') || errorMsg.includes('already')) {
        setErrors((prev) => ({
          ...prev,
          email: 'هذا البريد موجود بالفعل، حاول باستخدام بريد آخر',
        }));
        toast.error('⚠️ البريد الإلكتروني مستخدم بالفعل');
      } else {
        toast.error(`❌ ${errorMsg}`);
      }
      
      console.error('❌ OTP Error:', errorMsg);
      return false;
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error('يرجى إدخال رمز صحيح');
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
      toast.success('✅ تم التحقق من البريد الإلكتروني بنجاح!');
      console.log('✅ Moving to Step 4 - Plan Selection');
      setStep(4);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'فشل التحقق من الرمز';
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
      setStep((step - 1) as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlan) {
      toast.error('يرجى اختيار خطة');
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
        toast.error('reCAPTCHA مطلوب');
        return;
      }

      // Complete registration
      const response = await apiService.register(
        formData.email.trim(),
        formData.password,
        formData.fullName.trim(),
        token,
        formData.phone,
        userType || 'lawyer',
        selectedPlan,
        formData.barNumber,
        formData.cabinetName,
        formData.university,
        userType === 'lawyer' || userType === 'student' ? 'LAWYER' : 'CLIENT',
        formData.barRegistrationNumber,
        formData.officeAddress,
        formData.numberOfLawyers
      );

      console.log('Registration successful:', response);
      alert('تم إنشاء حسابك بنجاح! مرحباً بك في المحامي');
      toast.success('تم إنشاء حسابك بنجاح!', {
        description: 'مرحباً بك في المحامي - سيتم توجيهك إلى الصفحة الرئيسية',
        duration: 5000,
      });
      
      // Navigate after showing the toast
      setTimeout(() => {
        onLogin(response.user);
      }, 500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'فشل إنشاء الحساب';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-amber-50 dark:from-slate-700 dark:via-slate-700 dark:to-slate-600 flex items-center justify-center p-4 relative RTL"
      style={{ fontFamily: "'Tajawal', 'Inter', sans-serif" }}
    >
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

      <div className="w-full max-w-4xl relative z-10">
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
          <h1 className="text-3xl text-amber-900 dark:text-amber-200 font-bold" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>
            إنشاء حساب جديد
          </h1>
          <p className="text-amber-700 dark:text-amber-400 text-sm mt-1" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            انضم إلى المحامي اليوم
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-800 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-6 md:p-8 shadow-xl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
          {/* Progress Steps - Updated to 4 steps */}
          <div className="flex items-center justify-center mb-8 gap-1 md:gap-2">
            {[1, 2, 3, 4].map((s, idx) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step >= s
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                  }`}
                  style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {idx < 3 && (
                  <div
                    className={`w-8 md:w-12 h-1 rounded-full mx-1 md:mx-2 transition-all ${
                      step > s ? 'bg-gradient-to-l from-amber-500 to-amber-600' : 'bg-gray-200 dark:bg-slate-700'
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
                  <h2 className="text-2xl text-amber-900 dark:text-amber-200 font-bold" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>
                    اختر نوع الحساب
                  </h2>
                  <p className="text-amber-700 dark:text-amber-400 text-sm mt-1" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                    حدد الخيار المناسب لاحتياجاتك
                  </p>
                </div>

                <div className="grid gap-4">
                  {/* Lawyer */}
                  <button
                    type="button"
                    onClick={() => setUserType('lawyer')}
                    className={`p-5 rounded-xl border-2 transition-all text-right ${
                      userType === 'lawyer'
                        ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-transparent'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                            userType === 'lawyer'
                              ? 'bg-gradient-to-br from-amber-500 to-amber-600'
                              : 'bg-gray-200'
                          }`}
                        >
                          <Scale className={`w-7 h-7 ${userType === 'lawyer' ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <div className="text-right flex-1">
                          <h3 className="text-lg text-amber-900 dark:text-amber-200 font-bold" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>
                            محامي
                          </h3>
                          <p className="text-sm text-amber-700 dark:text-amber-400" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                            للمحامين المرخصين
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                          userType === 'lawyer' ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
                        }`}
                      >
                        {userType === 'lawyer' && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </button>

                  {/* Cabinet */}
                  <button
                    type="button"
                    onClick={() => setUserType('cabinet')}
                    className={`p-5 rounded-xl border-2 transition-all text-right ${
                      userType === 'cabinet'
                        ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-transparent'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                            userType === 'cabinet'
                              ? 'bg-gradient-to-br from-amber-500 to-amber-600'
                              : 'bg-gray-200'
                          }`}
                        >
                          <Building2 className={`w-7 h-7 ${userType === 'cabinet' ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <div className="text-right flex-1">
                          <h3 className="text-lg text-amber-900 dark:text-amber-200 font-bold" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>
                            مكتب محاماة
                          </h3>
                          <p className="text-sm text-amber-700 dark:text-amber-400" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                            للمكاتب القانونية
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                          userType === 'cabinet' ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
                        }`}
                      >
                        {userType === 'cabinet' && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </button>

                  {/* Student */}
                  <button
                    type="button"
                    onClick={() => setUserType('student')}
                    className={`p-5 rounded-xl border-2 transition-all text-right ${
                      userType === 'student'
                        ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-transparent'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                            userType === 'student'
                              ? 'bg-gradient-to-br from-amber-500 to-amber-600'
                              : 'bg-gray-200'
                          }`}
                        >
                          <GraduationCap className={`w-7 h-7 ${userType === 'student' ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <div className="text-right flex-1">
                          <h3 className="text-lg text-amber-900 dark:text-amber-200 font-bold" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>
                            طالب قانون
                          </h3>
                          <p className="text-sm text-amber-700 dark:text-amber-400" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                            لطلاب كليات الحقوق
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                          userType === 'student' ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
                        }`}
                      >
                        {userType === 'student' && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </button>
                </div>

                <Button
                  type="button"
                  onClick={handleNextStep1}
                  disabled={!userType || isLoading}
                  className="w-full bg-gradient-to-l from-amber-500 to-amber-600 text-white h-12 rounded-xl font-bold text-base"
                  style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}
                >
                  التالي — معلوماتك الشخصية
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="text-sm text-amber-700 hover:text-amber-900 transition-colors"
                    style={{ fontFamily: "'Tajawal', sans-serif" }}
                  >
                    لديك حساب؟ <span className="text-amber-600 font-bold">تسجيل الدخول</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Personal Info + Password */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <h2 className="text-2xl text-amber-900 dark:text-amber-200 font-bold" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>
                    معلوماتك الشخصية
                  </h2>
                  <p className="text-amber-700 dark:text-amber-400 text-sm mt-1" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                    أدخل بياناتك لإنشاء حسابك
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-sm text-amber-900 block text-right font-bold" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>
                      الاسم الكامل
                      {errors.fullName && <span className="text-red-600"> مطلوب</span>}
                    </label>
                    <div className="relative group">
                      <Input
                        ref={firstInputRef}
                        type="text"
                        placeholder="أدخل اسمك الكامل"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        disabled={isLoading}
                        className={`w-full pl-11 h-11 ${errors.fullName ? 'border-2 border-red-500' : ''}`}
                        required
                      />
                      <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.fullName ? 'text-red-500' : 'text-muted-foreground'}`} />
                    </div>
                    {errors.fullName && <p className="text-red-500 text-xs text-right">{errors.fullName}</p>}
                  </div>

                  {/* Email & Phone */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-foreground dark:text-amber-200 block text-right font-medium">
                        البريد الإلكتروني
                        {errors.email && <span className="text-red-500"> مطلوب</span>}
                      </label>
                      <div className="relative group">
                        <Input
                          type="email"
                          placeholder="أدخل بريدك الإلكتروني"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          disabled={isLoading}
                          className={`w-full pl-11 h-11 ${errors.email ? 'border-2 border-red-500' : ''}`}
                          required
                        />
                        <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.email ? 'text-red-500' : 'text-muted-foreground'}`} />
                      </div>
                      {errors.email && <p className="text-red-500 text-xs text-right">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-foreground dark:text-amber-200 block text-right font-medium">
                        رقم الهاتف
                        {errors.phone && <span className="text-red-500"> مطلوب</span>}
                      </label>
                      <div className="relative group">
                        <Input
                          type="number"
                          placeholder="🇹🇳 أدخل رقم هاتفك"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          disabled={isLoading}
                          className={`w-full pl-11 h-11 ${errors.phone ? 'border-2 border-red-500' : ''}`}
                          required
                        />
                        <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.phone ? 'text-red-500' : 'text-muted-foreground'}`} />
                      </div>
                      {errors.phone && <p className="text-red-500 text-xs text-right">{errors.phone}</p>}
                    </div>
                  </div>

                  {/* Conditional Fields */}
                  {userType === 'student' && (
                    <div className="space-y-2">
                      <label className="text-sm text-foreground dark:text-amber-200 block text-right font-medium">
                        الكلية أو المؤسسة
                        {errors.university && <span className="text-red-500"> مطلوب</span>}
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
                      <label className="text-sm text-foreground dark:text-amber-200 block text-right font-medium">
                        رقم بطاقة المحاماة
                        {errors.barNumber && <span className="text-red-500"> مطلوب</span>}
                      </label>
                      <div className="relative group">
                        <Input
                          type="text"
                          placeholder="أدخل رقم بطاقة المحاماة"
                          value={formData.barNumber}
                          onChange={(e) => handleInputChange('barNumber', e.target.value)}
                          disabled={isLoading}
                          className={`w-full pl-11 h-11 ${errors.barNumber ? 'border-2 border-red-500' : ''}`}
                          required
                        />
                        <FileText className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.barNumber ? 'text-red-500' : 'text-muted-foreground'}`} />
                      </div>
                      {errors.barNumber && <p className="text-red-500 text-xs text-right">{errors.barNumber}</p>}
                    </div>
                  )}

                  {userType === 'cabinet' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm text-foreground dark:text-amber-200 block text-right font-medium">
                          اسم المكتب
                          {errors.cabinetName && <span className="text-red-500"> مطلوب</span>}
                        </label>
                        <div className="relative group">
                          <Input
                            type="text"
                            placeholder="أدخل اسم المكتب القانوني"
                            value={formData.cabinetName}
                            onChange={(e) => handleInputChange('cabinetName', e.target.value)}
                            disabled={isLoading}
                            className={`w-full pl-11 h-11 ${errors.cabinetName ? 'border-2 border-red-500' : ''}`}
                            required
                          />
                          <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.cabinetName ? 'text-red-500' : 'text-muted-foreground'}`} />
                        </div>
                        {errors.cabinetName && <p className="text-red-500 text-xs text-right">{errors.cabinetName}</p>}
                      </div>

                      {/* Bar Registration Number */}
                      <div className="space-y-2">
                        <label className="text-sm text-foreground dark:text-amber-200 block text-right font-medium">
                          رقم التسجيل بالهيئة
                          {errors.barRegistrationNumber && <span className="text-red-500"> مطلوب</span>}
                        </label>
                        <div className="relative group">
                          <Input
                            type="text"
                            placeholder="أدخل رقم التسجيل"
                            value={formData.barRegistrationNumber}
                            onChange={(e) => handleInputChange('barRegistrationNumber', e.target.value)}
                            disabled={isLoading}
                            className={`w-full pl-11 h-11 ${errors.barRegistrationNumber ? 'border-2 border-red-500' : ''}`}
                            required
                          />
                          <FileText className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.barRegistrationNumber ? 'text-red-500' : 'text-muted-foreground'}`} />
                        </div>
                        {errors.barRegistrationNumber && <p className="text-red-500 text-xs text-right">{errors.barRegistrationNumber}</p>}
                      </div>

                      {/* Office Address */}
                      <div className="space-y-2">
                        <label className="text-sm text-foreground dark:text-amber-200 block text-right font-medium">
                          العنوان
                          {errors.officeAddress && <span className="text-red-500"> مطلوب</span>}
                        </label>
                        <div className="relative group">
                          <Input
                            type="text"
                            placeholder="أدخل عنوان المكتب"
                            value={formData.officeAddress}
                            onChange={(e) => handleInputChange('officeAddress', e.target.value)}
                            disabled={isLoading}
                            className={`w-full pl-11 h-11 ${errors.officeAddress ? 'border-2 border-red-500' : ''}`}
                            required
                          />
                          <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.officeAddress ? 'text-red-500' : 'text-muted-foreground'}`} />
                        </div>
                        {errors.officeAddress && <p className="text-red-500 text-xs text-right">{errors.officeAddress}</p>}
                      </div>

                      {/* Number of Lawyers */}
                      <div className="space-y-2">
                        <label className="text-sm text-foreground dark:text-amber-200 block text-right font-medium">
                          عدد المحامين
                          {errors.numberOfLawyers && <span className="text-red-500"> مطلوب</span>}
                        </label>
                        <div className="relative group">
                          <Input
                            type="number"
                            min="1"
                            placeholder="أدخل عدد المحامين"
                            value={formData.numberOfLawyers}
                            onChange={(e) => handleInputChange('numberOfLawyers', e.target.value)}
                            disabled={isLoading}
                            className={`w-full pl-11 h-11 ${errors.numberOfLawyers ? 'border-2 border-red-500' : ''}`}
                            required
                          />
                          <Scale className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.numberOfLawyers ? 'text-red-500' : 'text-muted-foreground'}`} />
                        </div>
                        {errors.numberOfLawyers && <p className="text-red-500 text-xs text-right">{errors.numberOfLawyers}</p>}
                      </div>
                    </div>
                  )}

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-sm text-foreground dark:text-amber-200 block text-right font-medium">
                      كلمة المرور
                      {errors.password && <span className="text-red-500"> مطلوب</span>}
                    </label>
                    <div className="relative group">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="أدخل كلمة مرور قوية (8 أحرف، تحتوي على أرقام وحروف)"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        disabled={isLoading}
                        className={`w-full pr-11 pl-11 h-11 ${errors.password ? 'border-2 border-red-500' : ''}`}
                        required
                      />
                      <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.password ? 'text-red-500' : 'text-muted-foreground'}`} />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs text-right">{errors.password}</p>}
                    {formData.password && (
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 h-1.5 rounded-full ${getPasswordStrengthColor()}`}></div>
                        <span className="text-xs text-muted-foreground">{getPasswordStrengthLabel()}</span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-sm text-foreground dark:text-amber-200 block text-right font-medium">
                      تأكيد كلمة المرور
                      {errors.confirmPassword && <span className="text-red-500"> مطلوب</span>}
                    </label>
                    <div className="relative group">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="أعد إدخال كلمة المرور للتأكيد"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        disabled={isLoading}
                        className={`w-full pr-11 pl-11 h-11 ${errors.confirmPassword ? 'border-2 border-red-500' : ''}`}
                        required
                      />
                      <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.confirmPassword ? 'text-red-500' : 'text-muted-foreground'}`} />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-xs text-right">{errors.confirmPassword}</p>}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 h-12 rounded-lg text-sm"
                    disabled={isLoading}
                  >
                    رجوع
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep2}
                    className="flex-1 bg-gradient-to-l from-primary to-[#D4941C] text-white h-12 rounded-lg font-semibold text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جارٍ الإرسال...
                      </span>
                    ) : (
                      'تحقق من البريد'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: OTP Verification */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <h2 className="text-2xl text-amber-900 dark:text-amber-200 font-bold" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>
                    التحقق من البريد الإلكتروني
                  </h2>
                  <p className="text-amber-700 dark:text-amber-400 text-sm mt-1" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                    أدخل رمز التحقق المرسل إلى <span className="font-bold">{formData.email}</span>
                  </p>
                </div>

                {!otpSent ? (
                  <Button
                    type="button"
                    onClick={handleSendOTPInternal}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-l from-amber-500 to-amber-600 text-white h-12 rounded-xl font-bold text-base"
                    style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جارٍ الإرسال...
                      </span>
                    ) : (
                      'إرسال رمز التحقق'
                    )}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {/* Success Message */}
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-700 dark:text-green-300" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        تم إرسال رمز التحقق بنجاح! تحقق من بريدك الإلكتروني (قد يستغرق دقيقة واحدة).
                      </div>
                    </div>

                    {/* OTP Input */}
                    <div className="space-y-2">
                      <label className="text-sm text-foreground dark:text-amber-200 block text-right font-medium">
                        رمز التحقق (6 أرقام)
                        {errors.otp && <span className="text-red-500"> مطلوب</span>}
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
                        error={errors.otp ? 'رمز التحقق مطلوب' : undefined}
                        autoFocus
                      />
                    </div>

                    {/* Verify Button */}
                    <Button
                      type="button"
                      onClick={handleVerifyOTP}
                      disabled={otpCode.length !== 6 || isLoading}
                      className="w-full bg-gradient-to-l from-amber-500 to-amber-600 text-white h-12 rounded-xl font-bold text-base"
                      style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جارٍ التحقق...
                        </span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 ml-2" />
                          التحقق من الرمز
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
                        className="text-sm text-amber-600 hover:text-amber-700 transition-colors font-medium"
                        style={{ fontFamily: "'Tajawal', sans-serif" }}
                      >
                        لم تتلقَ الرمز؟ <span className="underline">اطلب رمزاً جديداً</span>
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
                    className="flex-1 h-12 rounded-lg text-sm"
                    disabled={isLoading}
                  >
                    رجوع
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Plan Selection */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="text-center mb-8">
                  <h2 className="text-2xl text-amber-900 dark:text-amber-200 font-bold" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}>
                    باقات تناسب جميع المحامين
                  </h2>
                  <p className="text-amber-700 dark:text-amber-400 text-sm mt-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                    اختر الباقة المناسبة لاحتياجاتك واحصل على جميع المميزات
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Basic Plan */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('basic')}
                    className={`relative p-6 rounded-xl border-2 transition-all text-right ${
                      selectedPlan === 'basic'
                        ? 'border-primary bg-gradient-to-br from-primary/10 to-transparent shadow-lg'
                        : 'border-border hover:border-primary/50 hover:shadow-md'
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-foreground dark:text-amber-200 mb-1">البداية</h3>
                    <p className="text-muted-foreground dark:text-amber-400 text-xs mb-4">للمحامين المبتدئين والفرادى</p>

                    <div className="text-3xl font-bold text-primary mb-6">
                      0 <span className="text-sm">د.ت</span>
                    </div>

                    <div className="space-y-2.5 mb-6 text-sm text-muted-foreground dark:text-amber-400">
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> إدارة {planLimits.basic.cases} قضايا
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> تحضير {planLimits.basic.contracts} عقد
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> الوصول للمكتبة
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> دعم عام
                      </p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center absolute top-6 left-6 ${
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
                    className={`relative p-6 rounded-xl border-2 transition-all text-right ${
                      selectedPlan === 'pro'
                        ? 'border-primary bg-gradient-to-br from-primary/10 to-transparent shadow-lg ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50 hover:shadow-md'
                    }`}
                  >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-[#D4941C] text-white px-4 py-1 rounded-full text-xs font-medium">
                      الأفضل
                    </div>

                    <h3 className="text-lg font-semibold text-foreground dark:text-amber-200 mb-1">المحترف</h3>
                    <p className="text-muted-foreground dark:text-amber-400 text-xs mb-4">للمحامين المهنيين</p>

                    <div className="text-3xl font-bold text-primary mb-6">
                      {pricing.pro} <span className="text-sm">د.ت/سنة</span>
                    </div>

                    <div className="space-y-2.5 mb-6 text-sm text-muted-foreground dark:text-amber-400">
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> إدارة {planLimits.pro.cases} قضية
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> تحضير {planLimits.pro.contracts} عقد
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> تحليل AI
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> تقارير احترافية
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> دعم ممتاز 24/7
                      </p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center absolute top-6 left-6 ${
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
                    className={`relative p-6 rounded-xl border-2 transition-all text-right ${
                      selectedPlan === 'enterprise'
                        ? 'border-primary bg-gradient-to-br from-primary/10 to-transparent shadow-lg'
                        : 'border-border hover:border-primary/50 hover:shadow-md'
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-foreground dark:text-amber-200 mb-1">المكتب</h3>
                    <p className="text-muted-foreground dark:text-amber-400 text-xs mb-4">للمكاتب والشركات</p>

                    <div className="text-3xl font-bold text-primary mb-6">
                      {pricing.enterprise} <span className="text-sm">د.ت/سنة</span>
                    </div>

                    <div className="space-y-2.5 mb-6 text-sm text-muted-foreground dark:text-amber-400">
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> قضايا غير محدودة
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> عقود غير محدودة
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> فريق متعدد
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> تحليل AI متقدم
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> واجهة برمجية (API)
                      </p>
                      <p className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> دعم خاص 24/7
                      </p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center absolute top-6 left-6 ${
                        selectedPlan === 'enterprise' ? 'border-primary bg-primary' : 'border-border'
                      }`}
                    >
                      {selectedPlan === 'enterprise' && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                </div>

                <p className="text-center text-xs text-muted-foreground dark:text-amber-400 mt-6">
                  بالاشتراك، توافق على شروط الخدمة وسياسة الخصوصية
                </p>

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 h-12 rounded-lg text-sm"
                    disabled={isLoading}
                  >
                    رجوع
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedPlan || isLoading}
                    className="flex-1 bg-gradient-to-l from-primary to-[#D4941C] text-white h-12 rounded-lg font-semibold text-sm"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جارٍ الإنشاء...
                      </span>
                    ) : (
                      'إنشاء الحساب'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-xs">© 2026 المحامي - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
};
