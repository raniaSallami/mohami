import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User } from '../types';
import { Spinner, Modal } from '../components/UI';
import { Recaptcha, executeRecaptcha } from '../components/Recaptcha';
import { validatePassword, type PasswordValidation } from '../utils/passwordValidator';


export const RegisterPage = ({ onLogin, onNavigate }: { onLogin: (user: User) => void, onNavigate: (page: string) => void }) => {
  const [step, setStep] = useState(1); // 1: Info, 2: Plan Selection, 3: OTP Verification
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    isValid: false,
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasDigit: false,
    errors: [],
  });
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'enterprise'>('basic');
  const [otp, setOtp] = useState('');
  
  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState({ pro: 59, enterprise: 199 });
  const [planLimits, setPlanLimits] = useState<Record<string, { cases: number; contracts: number }>>({
    basic: { cases: 5, contracts: 2 },
    pro: { cases: 50, contracts: 100 },
    enterprise: { cases: 9999, contracts: 9999 }
  });
  const [recaptchaToken, setRecaptchaToken] = useState('');

  // Initial load of pricing and limits
  useEffect(() => {
    const load = async () => {
      try {
        const [p, l] = await Promise.all([storageService.getPlanPricing(), storageService.getPlanLimits()]);
        if (p) setPricing(p);
        if (l) setPlanLimits(l);
      } catch (e) { /* fallback */ }
    };
    load();
  }, []);

  // Validate password in real-time
  useEffect(() => {
    const validation = validatePassword(password);
    setPasswordValidation(validation);
  }, [password]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    let token = recaptchaToken;
    if (!token) {
      const freshToken = await executeRecaptcha('register');
      if (freshToken) {
        token = freshToken;
        setRecaptchaToken(freshToken);
      }
    }

    if (!token) {
      setError(window.__t("reCAPTCHA requis - يرجى الانتظار حتى يتم تحميل التحقق الأمني"));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { ok, message } = await storageService.createSignupEmailOtp(email.trim(), name.trim(), token);
      if (ok) {
        setStep(3);
      } else {
        setError(message || window.__t("حدث خطأ أثناء إرسال رمز التحقق"));
      }
    } catch (err) {
      setError(window.__t("حدث خطأ. تحقق من الاتصال وحاول مرة أخرى."));
    } finally {
      setLoading(false);
    }
  };


  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError(window.__t("أدخل رمز التحقق المكون من 6 أرقام"));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { ok, message } = await storageService.verifySignupEmailOtp(email.trim(), otp);
      if (!ok) {
        setError(message || window.__t("رمز التحقق غير صحيح"));
        setLoading(false);
        return;
      }
      const user = await storageService.register(name.trim(), email.trim(), password);
      if (selectedPlan === 'basic') {
        onLogin(user);
      } else {
        setRegisteredUser(user);
        setShowPaymentModal(true);
      }
    } catch (err) {
      setError(window.__t("هذا البريد الإلكتروني مستخدم بالفعل أو حدث خطأ ما"));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const freshToken = await executeRecaptcha('register_resend');
    if (!freshToken) {
      setError(window.__t("reCAPTCHA requis - يرجى الانتظار حتى يتم تحميل التحقق الأمني"));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { ok, message } = await storageService.createSignupEmailOtp(email.trim(), name.trim(), freshToken);
      if (ok) {
        setOtp('');
        setError('');
      } else {
        setError(message || window.__t("فشل إعادة الإرسال"));
      }
    } catch {
      setError(window.__t("حدث خطأ أثناء إعادة الإرسال"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = async () => {
      if (!receiptFile || !registeredUser) return;
      setLoading(true);

      const reader = new FileReader();
      reader.readAsDataURL(receiptFile);
      reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          // User is technically logged in via register, but we need to update the mock current user to trigger the pending state if we were reloading, 
          // but here we just call the service.
          
          await storageService.submitPayment(selectedPlan as 'pro' | 'enterprise', base64);
          
          // Now log them in (they will see pending status in settings)
          setLoading(false);
          onLogin(registeredUser);
      };
  };

  const PlanCard = ({ id, title, price, features, color }: any) => (
      <div 
        onClick={() => setSelectedPlan(id)}
        className={`border-2 rounded-xl p-4 cursor-pointer transition relative ${selectedPlan === id ? `border-${color}-500 bg-${color}-50` : 'border-gray-200 hover:border-gray-300'}`}
      >
          {selectedPlan === id && <div className={`absolute top-2 start-2 text-${color}-600`}>✓</div>}
          <h3 className="font-bold text-slate-800">{title}</h3>
          <p className="text-xl font-bold mt-1">{price} <span className="text-xs font-normal text-gray-500">{window.__t("/شهر")}</span></p>
          <ul className="mt-3 space-y-1">
              {features.map((f: string, i: number) => <li key={i} className="text-xs text-gray-600">• {f}</li>)}
          </ul>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center">
          <div className="flex justify-center cursor-pointer mb-4" onClick={() => onNavigate('landing')}>
            <img 
              src="/assets/logo.png" 
              alt={window.__t("المحامي")} 
              className="w-12 h-12 rounded-lg shadow-lg hover:shadow-gold-500/50 transition object-contain"
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
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{window.__t("إنشاء حساب جديد")}</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {window.__t("أو")} <button onClick={() => onNavigate('login')} className="font-medium text-primary-600 hover:text-primary-500">{window.__t("تسجيل الدخول")}</button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {step === 1 && (
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{window.__t("الاسم الكامل أو اسم المكتب")}</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder={window.__t("الاسم الكامل أو اسم المكتب")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{window.__t("البريد الإلكتروني")}</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{window.__t("كلمة المرور")}</label>
                  <input 
                    type="password" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder={window.__t("أدخل كلمة المرور")}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                      password && !passwordValidation.isValid ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  
                  {/* Password Requirements Checklist */}
                  {password && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-2">{window.__t("متطلبات كلمة المرور:")}</p>
                      <div className="space-y-1 text-xs">
                        <div className={`flex items-center ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className="me-2">{passwordValidation.minLength ? '✓' : '✗'}</span>
                          <span>{window.__t("8 أحرف على الأقل")}</span>
                        </div>
                        <div className={`flex items-center ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className="me-2">{passwordValidation.hasUppercase ? '✓' : '✗'}</span>
                          <span>{window.__t("حرف كبير (A-Z)")}</span>
                        </div>
                        <div className={`flex items-center ${passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className="me-2">{passwordValidation.hasLowercase ? '✓' : '✗'}</span>
                          <span>{window.__t("حرف صغير (a-z)")}</span>
                        </div>
                        <div className={`flex items-center ${passwordValidation.hasDigit ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className="me-2">{passwordValidation.hasDigit ? '✓' : '✗'}</span>
                          <span>{window.__t("رقم (0-9)")}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  type="submit" 
                  disabled={!name.trim() || !email.trim() || !passwordValidation.isValid}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {window.__t("التالي: اختر الباقة")}
                </button>
              </form>
          )}

          {step === 2 && (
              <form className="space-y-6" onSubmit={handleRequestOtp}>
                  <div className="space-y-4">
                      <PlanCard id="basic" title={window.__t("البداية")} price={window.__t("0 د.ت")} features={[`${planLimits.basic?.cases ?? 5} قضايا`, window.__t("مكتبة قانونية")]} color="blue" />
                      <PlanCard id="pro" title={window.__t("المحترف")} price={`${pricing.pro} د.ت`} features={[`${planLimits.pro?.cases ?? 50} قضية`, window.__t("ذكاء اصطناعي"), 'OCR']} color="gold" />
                      <PlanCard id="enterprise" title={window.__t("المكتب")} price={`${pricing.enterprise} د.ت`} features={[window.__t("غير محدود"), window.__t("دعم 24/7")]} color="purple" />
                  </div>
                  
                  {error && <div className="text-red-500 text-sm text-center">{error}</div>}

                  <div className="flex space-x-3 space-x-reverse">
                      <button type="button" onClick={() => setStep(1)} className="flex-1 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">{window.__t("رجوع")}</button>
                      <button type="submit" disabled={loading} className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800">
                          {loading ? <Spinner /> : window.__t("متابعة - إرسال رمز التحقق للبريد")}
                      </button>
                  </div>
                  
                  {/* Invisible reCAPTCHA initialization */}
                  <div style={{ display: 'none' }}>
                    <Recaptcha onVerify={(token) => setRecaptchaToken(token)} action="register" />
                  </div>
              </form>
          )}

          {step === 3 && (
              <form className="space-y-6" onSubmit={handleVerifyAndRegister}>
                  <p className="text-sm text-gray-600 text-center">
                    {window.__t("تم إرسال رمز التحقق المكون من 6 أرقام إلى")} <strong>{email}</strong>
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{window.__t("رمز التحقق")}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-center text-xl tracking-[0.5em]"
                    />
                  </div>
                  
                  {error && <div className="text-red-500 text-sm text-center">{error}</div>}

                  <div className="flex space-x-3 space-x-reverse">
                      <button type="button" onClick={() => { setStep(2); setOtp(''); setError(''); }} className="flex-1 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">{window.__t("رجوع")}</button>
                      <button type="submit" disabled={loading || otp.length !== 6} className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-gray-400">
                          {loading ? <Spinner /> : (selectedPlan === 'basic' ? window.__t("تأكيد وإنشاء الحساب") : window.__t("تأكيد والمتابعة للدفع"))}
                      </button>
                  </div>
                  <button type="button" onClick={handleResendOtp} disabled={loading} className="w-full text-sm text-primary-600 hover:text-primary-500 disabled:text-gray-400">
                    {window.__t("إعادة إرسال رمز التحقق")}
                  </button>
              </form>
          )}
        </div>
      </div>

      <Modal isOpen={showPaymentModal} onClose={() => {}} title={window.__t("إتمام الدفع - تحويل بنكي")}>
         <div className="space-y-4">
            <p className="text-sm text-gray-600">{window.__t("لقد اخترت باقة")} <strong>{selectedPlan === 'pro' ? window.__t("المحترف") : window.__t("المكتب")}</strong>{window.__t(". يرجى تحويل مبلغ")} <strong>{selectedPlan === 'pro' ? pricing.pro : pricing.enterprise} {window.__t("د.ت")}</strong> {window.__t("إلى الحساب التالي وإرفاق صورة الوصل لتفعيل حسابك.")}</p>
            
            <div className="bg-gray-50 p-3 rounded border text-xs space-y-1 font-mono">
                <p>STE NOVALABS WEB DESIGN</p>
                <p>RIB: TN 59 03 122 118 0115 004676 17</p>
                <p>SWIFT: BNTETNTT</p>
            </div>

            <input type="file" accept="image/*" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:me-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"/>
            
            <button onClick={handleSubmitPayment} disabled={loading || !receiptFile} className="w-full py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 disabled:bg-gray-300 flex justify-center">
                {loading ? <Spinner /> : window.__t("إرسال الوصل وبدء الاستخدام")}
            </button>
            <button onClick={() => { onLogin(registeredUser!); }} className="w-full text-xs text-gray-500 hover:text-gray-700 underline">
                {window.__t("تخطي والدخول بالباقة المجانية مؤقتاً")}
            </button>
         </div>
      </Modal>
    </div>
  );
};
