import React, { useState, useEffect } from 'react';
import { generateCreativeImage } from '../services/geminiService';
import { CookieConsentToast } from '../components/CookieConsentToast';
import { visitorService } from '../services/visitorService';
import { storageService } from '../services/storageService';

const InteractiveDemo = ({ isDark }: { isDark: boolean }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const loop = async () => {
      setStep(1);
      await new Promise(r => setTimeout(r, 2000));
      setStep(2);
      await new Promise(r => setTimeout(r, 1500));
      setStep(3);
      await new Promise(r => setTimeout(r, 4000));
      setStep(0);
      await new Promise(r => setTimeout(r, 1000));
      loop();
    };
    loop();
  }, []);

  return (
    <div className={`relative w-full max-w-4xl mx-auto h-[400px] ${isDark ? 'bg-slate-900' : 'bg-white'} rounded-2xl shadow-2xl ${isDark ? 'border-slate-700' : 'border-slate-200'} border overflow-hidden flex flex-col md:flex-row dir-ltr`}>
      <div className={`w-full md:w-20 ${isDark ? 'bg-slate-800' : 'bg-slate-50'} ${isDark ? 'border-slate-700' : 'border-slate-200'} border-r md:border-r-0 md:border-l flex md:flex-col items-center py-4 space-x-4 md:space-x-0 md:space-y-6 z-20 justify-center md:justify-start`}>
        <div className="w-3 h-3 rounded-full bg-red-500 mb-0 md:mb-4 mx-4 md:mx-0"></div>
        <div className={`p-2 rounded-lg transition duration-300 ${step === 1 ? 'bg-blue-500 text-white' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <div className={`p-2 rounded-lg transition duration-300 ${step === 2 ? 'bg-purple-500 text-white animate-pulse' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
        </div>
        <div className={`p-2 rounded-lg transition duration-300 ${step === 3 ? 'bg-green-500 text-white' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </div>

      <div className={`flex-1 relative ${isDark ? 'bg-slate-900' : 'bg-slate-50'} p-6 flex items-center justify-center overflow-hidden`}>
        <div className="relative w-64 h-80 bg-white rounded shadow-lg">
          <div className="p-4 space-y-2">
            <div className={`w-1/2 h-4 ${isDark ? 'bg-slate-800' : 'bg-slate-300'} mb-4`}></div>
            <div className="w-full h-2 bg-slate-200"></div>
            <div className="w-full h-2 bg-slate-200"></div>
            <div className="w-3/4 h-2 bg-slate-200"></div>
            <div className="w-full h-2 bg-slate-200 mt-4"></div>
            <div className="w-full h-2 bg-slate-200"></div>
            <div className="w-full h-2 bg-slate-200"></div>
            <div className="w-5/6 h-2 bg-slate-200"></div>
            {step === 3 && (
              <>
                <div className="absolute top-20 right-2 w-5/6 h-2 bg-red-200 opacity-50 animate-pulse"></div>
                <div className="absolute top-32 right-2 w-2/3 h-2 bg-red-200 opacity-50 animate-pulse"></div>
              </>
            )}
          </div>
          {step === 1 && (
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan"></div>
          )}
        </div>
      </div>

      <div className={`w-full md:w-80 ${isDark ? 'bg-slate-800/50' : 'bg-white/50'} backdrop-blur-md ${isDark ? 'border-slate-700' : 'border-slate-200'} border-l md:border-l-0 md:border-r p-6 flex flex-col`} dir="rtl">
        <h4 className="text-yellow-500 text-sm font-bold uppercase tracking-wider mb-4 flex items-center">
          {step === 0 && 'في انتظار الملف...'}
          {step === 1 && <><span className="animate-spin ml-2">⟳</span> جاري المسح الضوئي...</>}
          {step === 2 && <><span className="animate-pulse ml-2">⚡</span> تحليل الذكاء الاصطناعي...</>}
          {step === 3 && <><span className="ml-2">✓</span> تم استخراج الثغرات</>}
        </h4>
        <div className="flex-1 space-y-3">
          {step >= 2 && (
            <div className="flex items-start space-x-2 space-x-reverse">
              <div className="w-2 h-2 mt-2 bg-purple-500 rounded-full shrink-0"></div>
              <div className={`${isDark ? 'bg-slate-700/50 text-gray-300' : 'bg-slate-100 text-slate-700'} p-2 rounded text-xs w-full`}>
                <div className={`h-2 w-3/4 ${isDark ? 'bg-slate-600' : 'bg-slate-300'} rounded mb-1 animate-pulse`}></div>
                <div className={`h-2 w-1/2 ${isDark ? 'bg-slate-600' : 'bg-slate-300'} rounded animate-pulse`}></div>
              </div>
            </div>
          )}
          {step === 3 && (
            <>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 mt-2 bg-red-500 rounded-full shrink-0"></div>
                <div className={`${isDark ? 'bg-red-900/20 border-red-900/30 text-red-200' : 'bg-red-50 border-red-200 text-red-800'} border p-3 rounded text-xs w-full`}>
                  <strong>ثغرة إجرائية:</strong> عدم تطابق توقيت المحضر مع توقيت الإيقاف الفعلي (الفصل 13 م.إ.ج).
                </div>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 mt-2 bg-yellow-500 rounded-full shrink-0"></div>
                <div className={`${isDark ? 'bg-yellow-900/20 border-yellow-900/30 text-yellow-200' : 'bg-yellow-50 border-yellow-200 text-yellow-800'} border p-3 rounded text-xs w-full`}>
                  <strong>تنويه:</strong> غياب توقيع المحامي في الاستنطاق الأولي.
                </div>
              </div>
            </>
          )}
        </div>
        <div className={`mt-4 pt-4 ${isDark ? 'border-slate-700' : 'border-slate-200'} border-t`}>
          <div className={`flex justify-between text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            <span>الدقة: 98%</span>
            <span>الوقت: 0.4 ثانية</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        .animate-scan { animation: scan 2s linear infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes slideIn { from { transform: translateX(-10px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slideIn { animation: slideIn 0.5s ease-out forwards; }
        .animation-delay-500 { animation-delay: 500ms; }
        .animation-delay-1000 { animation-delay: 1000ms; }
      `}</style>
    </div>
  );
};

export const LandingPage = ({ onNavigate, allowRegistrations = true }: { onNavigate: (page: string) => void; allowRegistrations?: boolean }) => {

  // ✅ FIX: visitorService.recordVisit → visitorService.trackPageView
  useEffect(() => {
    const trackVisit = async () => {
      const visitRecorded = sessionStorage.getItem('visit_recorded');
      if (!visitRecorded) {
        await visitorService.trackPageView('landing');
        sessionStorage.setItem('visit_recorded', 'true');
      }
    };
    trackVisit();
  }, []);

  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // ✅ FIX: use fallback defaults, getPlanPricing/getPlanLimits return null if routes missing
  const [pricing, setPricing] = useState({ pro: 59, enterprise: 199 });
  const [planLimits, setPlanLimits] = useState<Record<string, { cases: number; contracts: number }>>({
    basic: { cases: 5, contracts: 2 },
    pro: { cases: 50, contracts: 100 },
    enterprise: { cases: 9999, contracts: 9999 },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [p, l] = await Promise.all([
          storageService.getPlanPricing(),
          storageService.getPlanLimits(),
        ]);
        if (p) setPricing(p);
        if (l) setPlanLimits(l);
      } catch { /* use defaults */ }
    };
    load();
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const loadHero = async () => {
      const cached = sessionStorage.getItem('landing_hero_bg');
      if (cached) { setHeroImage(cached); return; }
      try {
        const generated = await generateCreativeImage(
          'cinematic photography of a modern luxury law firm office in Tunisia, tunisian flag on desk, elegant dark wood, golden hour lighting, 8k resolution, photorealistic, depth of field'
        );
        if (generated) {
          setHeroImage(generated);
          sessionStorage.setItem('landing_hero_bg', generated);
        }
      } catch { /* non-critical, ignore */ }
    };
    setTimeout(loadHero, 100);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      if (typeof window === 'undefined' || !(window as any).emailjs) throw new Error('EmailJS not loaded');
      const serviceId = (process.env.EMAILJS_SERVICE_ID as string) || (window as any).EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
      const templateId = (process.env.EMAILJS_TEMPLATE_ID as string) || (window as any).EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
      const publicKey = (process.env.EMAILJS_PUBLIC_KEY as string) || (window as any).EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';
      await (window as any).emailjs.send(serviceId, templateId, {
        from_name: contactName,
        from_email: contactEmail,
        message: contactMessage,
        to_email: 'your-email@example.com',
      }, publicKey);
      setSubmitStatus('success');
      setContactName(''); setContactEmail(''); setContactMessage('');
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      console.error('Email sending error:', error);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'} font-sans ${isDark ? 'text-white' : 'text-slate-900'} overflow-x-hidden scroll-smooth transition-colors duration-300`}>
      {/* Navbar */}
      <nav className={`fixed w-full z-50 ${isDark ? 'bg-slate-900/80' : 'bg-white/80'} backdrop-blur-md ${isDark ? 'border-slate-800' : 'border-slate-200'} border-b transition-all duration-300`}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 space-x-reverse cursor-pointer group" onClick={() => { onNavigate('landing'); window.scrollTo(0, 0); }}>
            <img src="/assets/logo.png" alt="المحامي" className="w-10 h-10 rounded-lg shadow-lg transition object-contain" />
            <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight`}>المحامي</span>
          </div>
          <div className={`hidden md:flex items-center space-x-8 space-x-reverse ${isDark ? 'text-slate-300' : 'text-slate-600'} font-medium text-sm`}>
            <button onClick={() => scrollToSection('features')} className="hover:text-yellow-400 transition">المميزات</button>
            <button onClick={() => scrollToSection('demo')} className="hover:text-yellow-400 transition">كيف يعمل</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-yellow-400 transition">الأسعار</button>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-lg ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'} transition`}>
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            <button onClick={() => onNavigate('login')} className={`${isDark ? 'text-white' : 'text-slate-900'} font-medium hover:text-yellow-400 px-4 py-2 transition`}>دخول</button>
            {allowRegistrations && (
              <button onClick={() => onNavigate('register')} className="bg-yellow-500 text-slate-900 px-6 py-2.5 rounded-full font-bold hover:bg-yellow-400 transition shadow-lg">
                ابدأ مجاناً
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 z-0 transition-opacity duration-1000" style={{ opacity: heroImage ? 0.4 : 0 }}>
          {heroImage && <img src={heroImage} alt="Tunisian Law Office" className="w-full h-full object-cover" />}
        </div>
        <div className={`absolute inset-0 z-0 ${isDark ? 'bg-gradient-to-b from-slate-800 via-slate-900 to-black' : 'bg-gradient-to-b from-slate-100 via-slate-50 to-white'}`}></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 text-center lg:text-right">
              <div className={`inline-flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-full ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-slate-200'} border text-yellow-400 text-sm font-semibold mb-8`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
                <span>الذكاء الاصطناعي الأول للمحامي التونسي</span>
              </div>
              <h1 className={`text-5xl lg:text-7xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} leading-tight mb-8`}>
                استخرج ثغرات القضايا <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600">بسرعة البرق</span>
              </h1>
              <p className={`text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0`}>
                منصة متطورة تعتمد على نموذج ذكاء اصطناعي مطور خصيصاً لتحليل المحاضر، العقود، والملفات القضائية واستخراج الدفوع الشكلية والموضوعية حسب القانون التونسي.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
                {allowRegistrations && (
                  <button onClick={() => onNavigate('register')} className="w-full sm:w-auto px-8 py-4 bg-yellow-500 text-slate-900 rounded-xl font-bold text-lg hover:bg-yellow-400 transition shadow-lg flex items-center justify-center">
                    إنشاء حساب مجاني
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                )}
                <button onClick={() => setIsVideoModalOpen(true)} className={`w-full sm:w-auto px-8 py-4 ${isDark ? 'bg-white/5 text-white border-white/10 hover:bg-white/10' : 'bg-slate-900/5 text-slate-900 border-slate-300 hover:bg-slate-900/10'} border rounded-xl font-bold text-lg transition flex items-center justify-center`}>
                  شاهد الفيديو التعريفي
                </button>
              </div>
            </div>
            <div className="lg:w-1/2 w-full" id="demo">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-blue-600 rounded-2xl blur opacity-30 animate-pulse"></div>
                <InteractiveDemo isDark={isDark} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section id="features" className={`py-24 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-4`}>أدوات خارقة للمحامي العصري</h2>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-2xl mx-auto`}>تكنولوجيا مصممة خصيصاً لتناسب احتياجات المحكمة التونسية والإجراءات القانونية المعقدة.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '🧠', title: 'ذكاء اصطناعي قانوني', desc: 'نموذج مدرب على مجلة الإجراءات الجزائية ومجلة الالتزامات والعقود لاستخراج الدفوع بدقة.' },
              { icon: '👁️', title: 'OCR متطور للمحاضر', desc: 'تحويل صور محاضر البحث والوثائق المكتوبة بخط اليد أو الآلة الكاتبة القديمة إلى نص رقمي قابل للبحث.' },
              { icon: '🔒', title: 'سرية تامة للموكلين', desc: 'بيانات قضاياك مشفرة ولا يتم مشاركتها أو استخدامها لتدريب النماذج العامة.' },
              { icon: '📅', title: 'إدارة مكتب شاملة', desc: 'لوحة تحكم تفاعلية لمتابعة الجلسات، التنبيهات، والوضع المالي للمكتب.' },
              { icon: '⚖️', title: 'تحديثات قانونية', desc: 'مواكبة آلية لأحدث التنقيحات القانونية وفقه القضاء التونسي.' },
              { icon: '📱', title: 'مكتبك في جيبك', desc: 'تطبيق ويب سريع يعمل على الهاتف والحاسوب للوصول للملفات من داخل قاعة المحكمة.' },
            ].map((feature, i) => (
              <div key={i} className={`group p-8 rounded-2xl ${isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800/50' : 'bg-slate-50 border-slate-200 hover:bg-white'} border hover:border-yellow-500/50 transition duration-300`}>
                <div className={`w-14 h-14 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner border`}>{feature.icon}</div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-3 group-hover:text-yellow-400 transition-colors`}>{feature.title}</h3>
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={`py-24 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-4`}>باقات تناسب جميع المحامين</h2>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-2xl mx-auto`}>اختر الخطة المناسبة لحجم مكتبك وطبيعة عملك. الأسعار بالدينار التونسي.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-2xl p-8 border flex flex-col transition duration-300`}>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>البداية</h3>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm mb-6`}>للمحامين المتمرنين والطلبة</p>
              <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-6`}>0<span className={`text-lg ${isDark ? 'text-slate-500' : 'text-slate-400'} font-normal`}> د.ت / شهر</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className={`flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'} text-sm`}><span className="text-green-500 ml-2">✓</span> إدارة {planLimits.basic?.cases ?? 5} قضايا نشطة</li>
                <li className={`flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'} text-sm`}><span className="text-green-500 ml-2">✓</span> تحليل آلي محدود (10 وثائق/شهر)</li>
                <li className={`flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'} text-sm`}><span className="text-green-500 ml-2">✓</span> الوصول للمكتبة القانونية</li>
                <li className={`flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'} text-sm`}><span className="text-green-500 ml-2">✓</span> دعم عبر البريد</li>
              </ul>
              <button onClick={() => allowRegistrations ? onNavigate('register') : scrollToSection('contact')} className={`w-full py-3 ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'} ${isDark ? 'text-white' : 'text-slate-900'} rounded-xl font-medium transition`}>{allowRegistrations ? 'مجاناً' : 'تواصل معنا'}</button>
            </div>
            <div className={`${isDark ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-yellow-500/50' : 'bg-gradient-to-b from-white to-slate-50 border-yellow-500/50'} rounded-2xl p-8 border flex flex-col relative transform md:-translate-y-4 shadow-2xl`}>
              <div className="absolute top-0 right-1/2 transform translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-slate-900 px-4 py-1 rounded-full text-xs font-bold">الأكثر طلباً</div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>المحترف</h3>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm mb-6`}>للمحامين المستقلين</p>
              <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-6`}>{pricing.pro}<span className={`text-lg ${isDark ? 'text-slate-500' : 'text-slate-400'} font-normal`}> د.ت / شهر</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className={`flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'} text-sm`}><span className="text-yellow-500 ml-2">✓</span> إدارة {planLimits.pro?.cases ?? 50} قضية نشطة</li>
                <li className={`flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'} text-sm`}><span className="text-yellow-500 ml-2">✓</span> تحليل ذكي غير محدود بنموذج AI متطور</li>
                <li className={`flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'} text-sm`}><span className="text-yellow-500 ml-2">✓</span> OCR غير محدود للمحاضر</li>
                <li className={`flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'} text-sm`}><span className="text-yellow-500 ml-2">✓</span> تقارير PDF احترافية</li>
                <li className={`flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'} text-sm`}><span className="text-yellow-500 ml-2">✓</span> تنبيهات الجلسات SMS</li>
              </ul>
              <button onClick={() => allowRegistrations ? onNavigate('register') : scrollToSection('contact')} className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-900 rounded-xl font-bold transition shadow-lg">
                {allowRegistrations ? 'ابدأ التجربة المجانية' : 'تواصل معنا'}
              </button>
            </div>
            <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-2xl p-8 border flex flex-col transition duration-300`}>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>المكتب</h3>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm mb-6`}>لمكاتب المحاماة والشركات</p>
              <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-6`}>{pricing.enterprise}<span className={`text-lg ${isDark ? 'text-slate-500' : 'text-slate-400'} font-normal`}> د.ت / شهر</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className={`flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'} text-sm`}><span className="text-green-500 ml-2">✓</span> قضايا غير محدودة</li>
                <li className={`flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'} text-sm`}><span className="text-green-500 ml-2">✓</span> 3 حسابات محامين</li>
                <li className={`flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'} text-sm`}><span className="text-green-500 ml-2">✓</span> لوحة تحكم إدارية متقدمة</li>
                <li className={`flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'} text-sm`}><span className="text-green-500 ml-2">✓</span> أرشيف سحابي مشفر (100GB)</li>
                <li className={`flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'} text-sm`}><span className="text-green-500 ml-2">✓</span> أولوية الدعم الفني 24/7</li>
              </ul>
              <button onClick={() => scrollToSection('contact')} className={`w-full py-3 ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'} ${isDark ? 'text-white' : 'text-slate-900'} rounded-xl font-medium transition`}>تواصل معنا</button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className={`py-24 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
        <div className="container mx-auto px-6">
          <div className={`max-w-4xl mx-auto ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'} rounded-2xl p-8 md:p-12 border`}>
            <div className="text-center mb-10">
              <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-4`}>هل لديك استفسار؟</h2>
              <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>فريقنا جاهز للإجابة على جميع أسئلتك حول المنصة.</p>
            </div>
            <form className="space-y-6" onSubmit={handleContactSubmit}>
              {submitStatus === 'success' && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20 border-green-500/50 text-green-200' : 'bg-green-50 border-green-200 text-green-800'} border`}>
                  <p>شكراً لتواصلك معنا! تم إرسال رسالتك بنجاح وسنرد عليك قريباً.</p>
                </div>
              )}
              {submitStatus === 'error' && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20 border-red-500/50 text-red-200' : 'bg-red-50 border-red-200 text-red-800'} border`}>
                  <p>حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى لاحقاً.</p>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-2`}>الاسم أو اسم المكتب</label>
                  <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} className={`w-full ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-lg px-4 py-3 focus:border-yellow-500 outline-none transition`} placeholder="الاسم الكامل أو اسم المكتب" required disabled={isSubmitting} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-2`}>البريد الإلكتروني</label>
                  <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={`w-full ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-lg px-4 py-3 focus:border-yellow-500 outline-none transition`} placeholder="example@email.com" required disabled={isSubmitting} />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-2`}>الرسالة</label>
                <textarea rows={4} value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} className={`w-full ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-lg px-4 py-3 focus:border-yellow-500 outline-none transition`} placeholder="كيف يمكننا مساعدتك؟" required disabled={isSubmitting}></textarea>
              </div>
              <button type="submit" disabled={isSubmitting} className={`w-full py-4 ${isDark ? 'bg-white text-slate-900 hover:bg-gray-100' : 'bg-slate-900 text-white hover:bg-slate-800'} font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}>
                {isSubmitting ? (
                  <><svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>جاري الإرسال...</>
                ) : 'إرسال الرسالة'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${isDark ? 'bg-slate-950 border-slate-900' : 'bg-slate-50 border-slate-200'} border-t pt-20 pb-10`}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 space-x-reverse mb-6 cursor-pointer" onClick={() => { onNavigate('landing'); window.scrollTo(0, 0); }}>
                <img src="/assets/logo.png" alt="المحامي" className="w-8 h-8 rounded object-contain" />
                <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>المحامي</span>
              </div>
              <p className={isDark ? 'text-slate-500' : 'text-slate-600'}>المنصة الأولى في تونس التي تستخدم الذكاء الاصطناعي التوليدي لمساعدة المحامين في تحقيق العدالة بكفاءة وسرعة.</p>
            </div>
            <div>
              <h4 className={`${isDark ? 'text-white' : 'text-slate-900'} font-bold mb-6`}>روابط سريعة</h4>
              <ul className={`space-y-3 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                <li><button onClick={() => { onNavigate('landing'); window.scrollTo(0, 0); }} className="hover:text-yellow-400 transition">الرئيسية</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-yellow-400 transition">عن المنصة</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-yellow-400 transition">الأسعار</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-yellow-400 transition">اتصل بنا</button></li>
              </ul>
            </div>
            <div>
              <h4 className={`${isDark ? 'text-white' : 'text-slate-900'} font-bold mb-6`}>قانوني</h4>
              <ul className={`space-y-3 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                <li><button onClick={() => onNavigate('terms')} className="hover:text-yellow-400 transition">شروط الاستخدام</button></li>
                <li><button onClick={() => onNavigate('privacy')} className="hover:text-yellow-400 transition">سياسة الخصوصية</button></li>
              </ul>
            </div>
          </div>
          <div className={`border-t ${isDark ? 'border-slate-900' : 'border-slate-200'} pt-8 text-center ${isDark ? 'text-slate-600' : 'text-slate-500'} text-sm`}>
            &copy; 2025 منصة المحامي. صنع في تونس 🇹🇳
          </div>
        </div>
      </footer>

      <CookieConsentToast onAccept={() => localStorage.setItem('cookieConsent', 'true')} onViewPrivacy={() => onNavigate('privacy')} />

      {isVideoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsVideoModalOpen(false)}>
          <div className={`relative w-full max-w-4xl ${isDark ? 'bg-slate-900' : 'bg-white'} rounded-2xl shadow-2xl overflow-hidden`} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsVideoModalOpen(false)} className={`absolute top-4 left-4 z-10 p-2 rounded-full ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'} transition`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <video className="absolute top-0 left-0 w-full h-full" controls autoPlay src="/assets/video.mp4">
                متصفحك لا يدعم تشغيل الفيديو.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};