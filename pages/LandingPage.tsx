import React, { useState, useEffect } from 'react';
import { generateCreativeImage } from '../services/geminiService';
import { CookieConsentToast } from '../components/CookieConsentToast';
import { visitorService } from '../services/visitorService';
import { storageService } from '../services/storageService';

/* ─── Interactive Demo (glassmorphism version) ────────────────── */
const InteractiveDemo = ({ isDark }: { isDark: boolean }) => {
  const [step, setStep] = useState(0);
  const [notificationIndex, setNotificationIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  const notifications = [
    { type: 'appointment', title: window.__t("موعد جديد"), detail: window.__t("أحمد بن علي - 16:30"), icon: "📅" },
    { type: 'court', title: window.__t("جلسة قادمة"), detail: window.__t("محكمة الاستئناف - غداً"), icon: "⚖️" },
    { type: 'message', title: window.__t("رسالة جديدة"), detail: window.__t("الأستاذ بن صالح"), icon: "💬" }
  ];

  useEffect(() => {
    const loop = async () => {
      setStep(1);
      await new Promise(r => setTimeout(r, 2000));
      setStep(2);
      await new Promise(r => setTimeout(r, 1500));
      setStep(3);
      await new Promise(r => setTimeout(r, 4000));
      setStep(0);
      setNotificationIndex((prev) => (prev + 1) % notifications.length);
      await new Promise(r => setTimeout(r, 1000));
      loop();
    };
    loop();
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto h-[400px] group" dir="ltr">
      <div className={`absolute inset-0 rounded-3xl flex flex-col md:flex-row border shadow-2xl overflow-hidden ${isDark ? 'bg-white/5 border-white/10 shadow-white/5' : 'bg-white/60 border-white/40 shadow-slate-200/30'} backdrop-blur-xl`}>
      {/* Sidebar */}
      <div className={`w-full md:w-20 flex md:flex-col items-center py-4 gap-4 md:gap-6 z-20 justify-center md:justify-start border-e ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/50 border-slate-200/60'}`}>
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 dark:from-slate-200 dark:to-white mb-0 md:mb-4 mx-4 md:mx-0 shadow-lg shadow-slate-400/20 dark:shadow-white/10"></div>
        <div className={`p-2  transition duration-300 ${step === 1 ? 'bg-orange-500/20 text-slate-400 shadow-lg shadow-orange-400/20' : isDark ? 'text-white dark:text-orange-600/30' : 'text-slate-400'}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <div className={`p-2  transition duration-300 ${step === 2 ? 'bg-orange-500/20 text-orange-400 animate-pulse shadow-lg shadow-orange-400/20' : isDark ? 'text-white/30' : 'text-slate-400'}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
        </div>
        <div className={`p-2  transition duration-300 ${step === 3 ? 'bg-orange-400/20 text-emerald-400 shadow-lg shadow-emerald-400/20' : isDark ? 'text-white/30' : 'text-slate-400'}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </div>

      {/* Document area */}
      <div className={`flex-1 relative p-6 flex items-center justify-center overflow-hidden ${isDark ? 'bg-white/[0.02]' : 'bg-white/30'}`}>
        <div className={`relative w-64 h-80  shadow-xl ${isDark ? 'bg-white/10 border border-white/10' : 'bg-white border border-slate-200/50'}`}>
          <div className="p-4 space-y-2">
            <div className={`w-1/2 h-4 rounded ${isDark ? 'bg-white/10' : 'bg-slate-200'} mb-4`}></div>
            <div className={`w-full h-2 rounded ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}></div>
            <div className={`w-full h-2 rounded ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}></div>
            <div className={`w-3/4 h-2 rounded ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}></div>
            <div className={`w-full h-2 rounded ${isDark ? 'bg-white/5' : 'bg-slate-100'} mt-4`}></div>
            <div className={`w-full h-2 rounded ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}></div>
            <div className={`w-full h-2 rounded ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}></div>
            <div className={`w-5/6 h-2 rounded ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}></div>
            {step === 3 && (
              <>
                <div className="absolute top-20 end-2 w-5/6 h-2 bg-red-400/30 rounded animate-pulse"></div>
                <div className="absolute top-32 end-2 w-2/3 h-2 bg-red-400/30 rounded animate-pulse"></div>
              </>
            )}
          </div>
          {step === 1 && (
            <div className="absolute top-0 start-0 w-full h-1 bg-gradient-to-r from-orange-600 to-amber-800 dark:from-slate-200 dark:to-white shadow-[0_0_20px_rgba(51,65,85,0.4)] animate-scan rounded-full"></div>
          )}
        </div>
      </div>

      {/* Results panel */}
      <div className={`w-full md:w-80 p-6 flex flex-col border-s ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/40 border-slate-200/50'} backdrop-blur-sm`}>
        <h4 className="text-slate-600 dark:text-white/60 text-sm font-bold uppercase tracking-wider mb-4 flex items-center">
          {step === 0 && window.__t("في انتظار الملف...")}
          {step === 1 && <><span className="animate-spin ms-2">⟳</span> {window.__t("جاري المسح الضوئي...")}</>}
          {step === 2 && <><span className="animate-pulse ms-2">⚡</span> {window.__t("تحليل الذكاء الاصطناعي...")}</>}
          {step === 3 && <><span className="ms-2">✓</span> {window.__t("تم استخراج الثغرات")}</>}
        </h4>
        <div className="flex-1 space-y-3">
          {step >= 2 && (
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 mt-2 bg-orange-400 rounded-full shrink-0"></div>
              <div className={`${isDark ? 'bg-white/5 text-white/60' : 'bg-slate-100 text-orange-400'} p-2  text-xs w-full backdrop-blur-sm`}>
                <div className={`h-2 w-3/4 ${isDark ? 'bg-white/10' : 'bg-slate-200'} rounded mb-1 animate-pulse`}></div>
                <div className={`h-2 w-1/2 ${isDark ? 'bg-white/10' : 'bg-slate-200'} rounded animate-pulse`}></div>
              </div>
            </div>
          )}
          {step === 3 && (
            <>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 mt-2 bg-red-400 rounded-full shrink-0"></div>
                <div className={`${isDark ? 'bg-red-500/10 border-red-500/20 text-red-200' : 'bg-red-50 border-red-200 text-red-800'} border p-3  text-xs w-full`}>
                  <strong>{window.__t("ثغرة إجرائية:")}</strong> {window.__t("عدم تطابق توقيت المحضر مع توقيت الإيقاف الفعلي (الفصل 13 م.إ.ج).")}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 mt-2 bg-orange-400 rounded-full shrink-0"></div>
                <div className={`${isDark ? 'bg-slate-500/10 border-slate-500/20 text-slate-200 dark:bg-white/10 dark:border-white/20 dark:text-white' : 'bg-slate-50 border-slate-200 text-orange-600'} border p-3  text-xs w-full`}>
                  <strong>{window.__t("تنويه:")}</strong> {window.__t("غياب توقيع المحامي في الاستنطاق الأولي.")}
                </div>
              </div>
            </>
          )}
        </div>
        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-slate-200/60'}`}>
          <div className={`flex justify-between text-xs ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
            <span>{window.__t("الدقة: 98%")}</span>
            <span>{window.__t("الوقت: 0.4 ثانية")}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Stable Notification - Integrated in Demo */}
    <div className={`absolute -top-10 -start-10 md:-start-16 z-30 transition-all duration-1000 transform opacity-100 scale-100 shadow-2xl`}>
        <div className={`flex items-center gap-4 p-4 rounded-2xl border glass min-w-[280px] ${isDark ? 'bg-[#15151a]/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
            {notifications[notificationIndex].icon}
          </div>
          <div>
            <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{notifications[notificationIndex].title}</div>
            <div className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>{notifications[notificationIndex].detail}</div>
          </div>
          <div className="ms-auto flex flex-col items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">{window.__t("متصل")}</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        .animate-scan { animation: scan 2s linear infinite; }
      `}</style>
    </div>
  );
};

/* ─── Main Landing Page ───────────────────────────────────────── */
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
  
  // Luxury UI States
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

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

  // Track scrolling for Progress Bar & Back to Top button
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = window.scrollY;
      setScrollY(totalScroll);
      setIsScrolled(totalScroll > 20);
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${totalScroll / windowHeight}`;
      setScrollProgress(Number(scroll) * 100);
      setShowBackToTop(totalScroll > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  const featureItems = [
    { 
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>, 
      title: window.__t("ذكاء اصطناعي قانوني"), 
      desc: window.__t("نموذج مدرب على مجلة الإجراءات الجزائية ومجلة الالتزامات والعقود لاستخراج الدفوع بدقة."),
      color: "neutral"
    },
    { 
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>, 
      title: window.__t("OCR متطور للمحاضر"), 
      desc: window.__t("تحويل صور محاضر البحث والوثائق المكتوبة بخط اليد أو الآلة الكاتبة القديمة إلى نص رقمي قابل للبحث."),
      color: "neutral"
    },
    { 
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>, 
      title: window.__t("سرية تامة للموكلين"), 
      desc: window.__t("بيانات قضاياك مشفرة ولا يتم مشاركتها أو استخدامها لتدريب النماذج العامة."),
      color: "neutral"
    },
    { 
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, 
      title: window.__t("إدارة مكتب شاملة"), 
      desc: window.__t("لوحة تحكم تفاعلية لمتابعة الجلسات، التنبيهات، والوضع المالي للمكتب."),
      color: "neutral"
    },
    { 
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 01-6.001 0M18 7l-3 9m3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>, 
      title: window.__t("تحديثات قانونية"), 
      desc: window.__t("مواكبة آلية لأحدث التنقيحات القانونية وفقه القضاء التونسي."),
      color: "neutral"
    },
    { 
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>, 
      title: window.__t("مكتبك في جيبك"), 
      desc: window.__t("تطبيق ويب سريع يعمل على الهاتف والحاسوب للوصول للملفات من داخل قاعة المحكمة."),
      color: "neutral"
    },
  ];

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden scroll-smooth transition-colors duration-500 ${isDark ? 'bg-[#0B1121] text-white' : 'bg-[#fafaf9] text-slate-900'}`}>





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
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; width: max-content; animation: marquee 35s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
        
        /* ─── REAL ORANGE METALLIC & SHINE (SUNSET REFINED) ─── */
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
        
        /* Custom Premium Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #f97316; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #fbbf24; }
      `}</style>

      {/* ─── Floating Decorative Orbs (Sunset Mastery) ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-40 -end-[10%] w-[900px] h-[900px] rounded-full anim-float-d ${isDark ? 'bg-orange-600/[0.12]' : 'bg-orange-200/[0.4]'} blur-[120px]`}></div>
        <div className={`absolute top-[15%] -start-[15%] w-[700px] h-[700px] rounded-full anim-float ${isDark ? 'bg-orange-600/[0.08]' : 'bg-orange-100/[0.3]'} blur-[100px]`}></div>
        <div className={`absolute bottom-[10%] end-[5%] w-[800px] h-[800px] rounded-full anim-glow ${isDark ? 'bg-orange-500/[0.05]' : 'bg-orange-50/[0.2]'} blur-[130px]`}></div>
        
        {/* Subtle Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat"></div>
      </div>

      {/* ─── NAVBAR (Sleek Compact Glass) ─── */}
      <nav className={`fixed left-0 right-0 z-50 transition-all duration-700 ${isScrolled ? 'top-2 px-6 md:px-0' : 'top-4 px-6 md:px-0'}`}>
        <div className={`container mx-auto transition-all duration-700 ${isDark ? 'bg-white/[0.08] border-white/10 shadow-2xl shadow-black/40' : 'bg-white/70 border-white shadow-2xl shadow-slate-200/50'} backdrop-blur-3xl px-8 rounded-full flex justify-between items-center ${isScrolled ? 'py-1.5' : 'py-3'}`}>
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { onNavigate('landing'); window.scrollTo(0, 0); }}>
            <div className={`flex items-center justify-center transition-all duration-700 group-hover:scale-110 anim-balance ${isScrolled ? 'w-7 h-7' : 'w-9 h-9'} flex-shrink-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-xl shadow-lg shadow-orange-400/30`}>
              <svg className={`text-white drop-shadow-sm ${isScrolled ? 'w-4 h-4' : 'w-5 h-5'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 3v18" />
                <path d="M5 8l-2 5h8l-2-5" />
                <path d="M19 8l-2 5h8l-2-5" />
              </svg>
            </div>
            <span className={`font-bold tracking-tight transition-all duration-700 anim-text-shimmer ${isScrolled ? 'text-lg' : 'text-2xl'} ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>Al-Mohami</span>
          </div>

          {/* Links */}
          <div className={`hidden md:flex items-center gap-8 font-medium text-xs tracking-wide uppercase ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            <button onClick={() => scrollToSection('features')} className="hover:text-orange-600 dark:hover:text-white transition-colors duration-200">{window.__t("المميزات")}</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-orange-600 dark:hover:text-white transition-colors duration-200">{window.__t("كيف يعمل")}</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-orange-600 dark:hover:text-white transition-colors duration-200">{window.__t("الأسعار")}</button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { 
                const lang = window.__i18n?.language === 'ar' ? 'fr' : 'ar';
                window.__i18n?.changeLanguage(lang); 
                window.location.reload(); 
              }} 
              className={`w-8 h-8 rounded-lg font-bold text-[10px] flex items-center justify-center transition-all ${isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-orange-600 hover:bg-slate-100'}`}
            >
              {window.__i18n?.language === 'ar' ? 'FR' : 'AR'}
            </button>
            <button onClick={() => setIsDark(!isDark)} className={`p-1.5 rounded-lg transition-all duration-300 ${isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-orange-600 hover:bg-slate-100'}`}>
              {isDark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            <button onClick={() => onNavigate('login')} className={`font-bold px-4 py-2 transition-all text-[11px] uppercase tracking-wider ${isDark ? 'text-white/50 hover:text-white' : 'text-slate-600 hover:text-orange-600'}`}>{window.__t("دخول")}</button>
            {allowRegistrations && (
              <button onClick={() => onNavigate('register')} className="px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600 shadow-xl shadow-orange-500/20 transform hover:-translate-y-0.5">
                {window.__t("ابدأ مجاناً")}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <header className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden min-h-[90vh] flex items-center">
        {/* Hero background image */}
        <div className="absolute inset-0 z-0 transition-opacity duration-1000" style={{ opacity: heroImage ? 0.15 : 0 }}>
          {heroImage && <img src={heroImage} alt="Tunisian Law Office" className="w-full h-full object-cover" />}
        </div>
        <div className={`absolute inset-0 z-0 ${isDark ? 'bg-gradient-to-b from-[#0B1121] via-[#0B1121]/98 to-[#0B1121]' : 'bg-gradient-to-b from-[#fafaf9] via-[#fafaf9]/95 to-[#fafaf9]'}`}></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto relative px-6 md:px-16 py-12 lg:py-16 rounded-[3.5rem] overflow-hidden">
            {/* 💎 Ultra Glassmorphism Shield */}
            <div className={`absolute inset-0 -z-10 transition-all duration-700 ${isDark ? 'bg-[#131B2E]/90 border-white/10' : 'bg-white/40 border-white/60'} backdrop-blur-[40px] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.3)] rounded-[3.5rem]`}></div>
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

            {/* 💎 TEXT GROUP (Shrinks on scroll) */}
            <div 
              style={{ 
                transform: `scale(${Math.max(0.1, 1 - scrollY / 450)})`,
                opacity: Math.max(0, 1 - scrollY / 600),
                transformOrigin: 'center center'
              }}
              className="w-full flex flex-col items-center"
            >
              {/* Badge */}
              <div className={`group inline-flex items-center gap-3 px-6 py-2.5 rounded-full glass border transition-all duration-300 hover:scale-105 mb-6 anim-reveal-blur ${isDark ? 'bg-orange-500/5 border-[#B38728]/20' : 'bg-white/80 border-[#B38728]/20 shadow-xl shadow-yellow-100/40'}`}>
                <div className="relative flex h-2.5 w-2.5">
                  <div className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[#FCF6BA]"></div>
                  <div className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#B38728]"></div>
                </div>
                <span className={`text-sm font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>{window.__t("الذكاء الاصطناعي الأول للمحامي التونسي")}</span>
              </div>

              {/* Heading */}
              <h1 className={`text-5xl lg:text-[5.5rem] font-black leading-[1.05] mb-8 tracking-[-0.02em] anim-reveal-blur ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ animationDelay: '150ms' }}>
                {window.__t("استخرج ثغرات القضايا")} <br />
                <div className={`mt-2 bg-clip-text text-transparent bg-gradient-to-b ${isDark ? 'from-white via-white/80 to-white/60' : 'from-slate-900 via-slate-800 to-slate-700'}`}>{window.__t("بسرعة البرق")}</div>
              </h1>

              {/* Subtitle */}
              <p className={`text-lg lg:text-xl mb-12 leading-relaxed max-w-3xl mx-auto anim-reveal-blur ${isDark ? 'text-white/50' : 'text-slate-500'}`} style={{ animationDelay: '300ms' }}>
                {window.__t("منصة متطورة تعتمد على نموذج ذكاء اصطناعي مطور خصيصاً لتحليل المحاضر، العقود، والملفات القضائية واستخراج الدفوع الشكلية والموضوعية حسب القانون التونسي.")}
              </p>
            </div>

            {/* Interactive Demo - Embedded in Hero */}
            <div className="w-full max-w-4xl mx-auto mb-10 anim-scale" style={{ animationDelay: '300ms' }}>
              <div className="relative">
                <div className={`absolute -inset-3 rounded-2xl blur-xl anim-glow ${isDark ? 'bg-white/5' : 'bg-slate-200/40'}`}></div>
                <InteractiveDemo isDark={isDark} />
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 anim-slide-up w-full" style={{ animationDelay: '400ms' }}>
              {allowRegistrations && (
                <button onClick={() => onNavigate('register')} className={`w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex items-center justify-center gap-3 orange-metallic shine-effect text-slate-900 shadow-xl shadow-orange-500/20`}>
                  {window.__t("إنشاء حساب مجاني")}
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </button>
              )}
              <button onClick={() => setIsVideoModalOpen(true)} className={`w-full sm:w-auto px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 glass-sm border ${isDark ? 'bg-white/5 text-white/70 border-white/20 hover:bg-white/10 hover:text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-orange-500 shadow-lg shadow-slate-100/50'}`}>
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <span className={isDark ? '' : 'hover:text-gold'}>{window.__t("شاهد الفيديو التعريفي")}</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* ═══════════════ ROLLING SHOWCASE (SUBTLE LUXURY) ═══════════════ */}
      <section className="py-16 md:py-20 relative overflow-hidden flex items-center bg-gradient-to-b from-transparent via-[#fafaf9] to-transparent dark:via-[#0a0a0f]">
        
        {/* Subtle glowing center area - Toned down */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[100px] bg-orange-500/10 blur-[80px] pointer-events-none rounded-[100%]"></div>

        {/* Scrolling Track */}
        <div className="relative w-full flex items-center overflow-hidden py-4">
           {/* Fade edge overlays */}
           <div className={`absolute top-0 bottom-0 start-0 w-24 md:w-56 z-10 pointer-events-none bg-gradient-to-r ${isDark ? 'from-[#0a0a0f] to-transparent' : 'from-[#fafaf9] to-transparent'}`}></div>
           <div className={`absolute top-0 bottom-0 end-0 w-24 md:w-56 z-10 pointer-events-none bg-gradient-to-l ${isDark ? 'from-[#0a0a0f] to-transparent' : 'from-[#fafaf9] to-transparent'}`}></div>
           
           <div className="flex animate-marquee items-center" dir="ltr" style={{ animationDuration: '80s' }}>
             {[...Array(4)].map((_, arrayIndex) => (
               <div key={arrayIndex} className="flex gap-6 md:gap-8 px-4 items-center whitespace-nowrap">
                 {[
                    { text: window.__t("تحليل إلكتروني للمحاضر"), icon: "⚡" },
                    { text: window.__t("استخراج الثغرات والوقائع"), icon: "🔍" },
                    { text: window.__t("توليد التقارير تلقائياً"), icon: "📄" },
                    { text: window.__t("إدارة الجلسات الذكية"), icon: "⚖️" },
                    { text: window.__t("تشفير سحابي تام"), icon: "🛡️" },
                    { text: window.__t("مكتبة فقه القضاء"), icon: "📚" }
                 ].map((item, i) => (
                   <div 
                     key={`${arrayIndex}-${i}`} 
                     className={`flex items-center gap-4 px-8 py-4 md:px-10 md:py-5 rounded-full border glass flex-shrink-0 cursor-default transition-all duration-500 ease-out hover:scale-[1.08] hover:-translate-y-2 hover:shadow-2xl hover:z-20 ${isDark ? 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]' : 'bg-white/80 border-slate-200/80 hover:border-slate-300 hover:bg-white'} shadow-sm`}
                   >
                     <span className="text-2xl md:text-3xl filter drop-shadow-md">{item.icon}</span>
                     <span 
                       dir="auto" 
                       className={`text-lg md:text-xl font-extrabold tracking-wide transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`} 
                       style={{ fontFamily: "'Tajawal', sans-serif" }}>
                       {item.text}
                     </span>
                   </div>
                 ))}
               </div>
             ))}
           </div>
        </div>
      </section>





      {/* ═══════════════ FEATURES ═══════════════ */}
      <section id="features" className="py-28 relative overflow-hidden">
        {/* Background Accents */}
        <div className={`absolute top-1/4 start-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none ${isDark ? 'bg-orange-500/5' : 'bg-yellow-100/30'}`}></div>
        <div className={`absolute bottom-1/4 end-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none ${isDark ? 'bg-blue-500/5' : 'bg-blue-100/30'}`}></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border text-sm font-bold mb-6 shadow-sm mx-auto anim-reveal ${isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-white border-slate-200/60 text-slate-600'}`}>
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span>{window.__t("أدوات المنصة")}</span>
            </div>
            <h2 className={`text-4xl md:text-6xl font-black mb-6 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{window.__t("أدوات خارقة للمحامي العصري")}</h2>
            <p className={`max-w-2xl mx-auto text-lg lg:text-xl font-medium leading-relaxed ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{window.__t("تكنولوجيا مصممة خصيصاً لتناسب احتياجات المحكمة التونسية والإجراءات القانونية المعقدة.")}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureItems.map((feature, i) => (
              <div key={i} className={`group p-10 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-3 cursor-default relative overflow-hidden glass-sm 
                ${isDark ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]' : 'bg-white border-slate-100 hover:border-orange-200 shadow-xl shadow-slate-200/20'}
              `}>
                {/* Hover Gradient Effect */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-orange-500/5 to-transparent`}></div>
                
                <div className="relative z-10">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-black/5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-slate-700 dark:text-white group-hover:text-orange-500`}>
                    {feature.icon}
                  </div>
                  <h3 className={`text-2xl font-extrabold mb-4 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{feature.title}</h3>
                  <p className={`text-base lg:text-lg leading-relaxed font-medium transition-colors ${isDark ? 'text-white/40 group-hover:text-white/60' : 'text-slate-500 group-hover:text-slate-600'}`}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TRUST / STATS ═══════════════ */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className={`rounded-3xl p-12 md:p-16 border glass-sm ${isDark ? 'bg-[#131B2E]/60 border-white/[0.08]' : 'bg-gradient-to-br from-slate-50 to-white border-slate-200/60'}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: '98%', label: window.__t("دقة التحليل") },
                { value: '0.4s', label: window.__t("سرعة المعالجة") },
                { value: '24/7', label: window.__t("دعم متواصل") },
                { value: '100%', label: window.__t("تشفير البيانات") },
              ].map((stat, i) => (
                <div key={i} className="group">
                  <div className={`text-4xl md:text-5xl font-black mb-2 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</div>
                  <div className={`text-sm font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS (WORKFLOW) ═══════════════ */}
      <section id="how-it-works" className="py-28 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-24">
            <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border text-sm font-bold mb-6 shadow-sm mx-auto ${isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-white border-slate-200/60 text-slate-600'}`}>
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span>{window.__t("كيف تعمل المنصة؟")}</span>
            </div>
            <h2 className={`text-4xl md:text-6xl font-black mb-6 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{window.__t("خطوات بسيطة نحو المرافعة الذكية")}</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative max-w-6xl mx-auto">
            {/* Connection Line Behind Cards (Desktop) */}
            <div className={`hidden md:block absolute top-[40%] left-10 right-10 h-0.5 z-0 ${isDark ? 'bg-white/[0.03]' : 'bg-slate-100'}`}></div>

            {[
              {
                step: "1",
                title: window.__t("ارفع ملفاتك"),
                desc: window.__t("قم برفع المحاضر، العقود أو أي ملف قضائي بشكل آمن."),
                icon: (
                  <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )
              },
              {
                step: "2",
                title: window.__t("التحليل بالذكاء الاصطناعي"),
                desc: window.__t("يقوم النظام العصبوني بتحليل الوقائع واستخراج الدفوع والعيوب الإجرائية."),
                icon: (
                  <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
                  </svg>
                )
              },
              {
                step: "3",
                title: window.__t("النتائج والمرافعة"),
                desc: window.__t("احصل على تقرير مفصل للطباعة وابدأ مرافعتك بثقة عالية."),
                icon: (
                  <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              }
            ].map((item, index) => (
              <div key={index} className={`group relative z-10 p-12 rounded-[3.5rem] border text-center transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] glass-sm ${isDark ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/20'}`}>
                {/* Step Number Badge */}
                <div className={`absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${isDark ? 'bg-orange-500' : 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600'} text-white border border-white/20`}>
                  {item.step}
                </div>
                
                <div className={`w-24 h-24 mx-auto rounded-[2.5rem] flex items-center justify-center mb-10 mt-4 transition-all duration-500 group-hover:scale-110 group-hover:bg-orange-500/10 ${isDark ? 'bg-white/5 shadow-inner border border-white/5' : 'bg-orange-50 shadow-inner border border-orange-100'}`}>
                  {item.icon}
                </div>
                
                <h3 className={`text-2xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                <p className={`leading-relaxed text-lg font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PRICING ═══════════════ */}
      <section id="pricing" className="py-28 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className={`text-3xl md:text-5xl font-extrabold mb-5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{window.__t("باقات تناسب جميع المحامين")}</h2>
            <p className={`max-w-2xl mx-auto text-lg ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{window.__t("اختر الخطة المناسبة لحجم مكتبك وطبيعة عملك. الأسعار بالدينار التونسي.")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Basic */}
            <div className={`rounded-3xl p-8 border flex flex-col transition-all duration-300 glass-sm ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white/60 border-slate-200/60'}`}>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{window.__t("البداية")}</h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{window.__t("للمحامين المتمرنين والطلبة")}</p>
              <div className={`text-5xl font-extrabold mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>0<span className={`text-base font-normal ms-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>{window.__t("د.ت / شهر")}</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className={`flex items-center text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}><span className="text-emerald-400 ms-2 text-lg">✓</span> {window.__t("إدارة")} {planLimits.basic?.cases ?? 5} {window.__t("قضايا نشطة")}</li>
                <li className={`flex items-center text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}><span className="text-emerald-400 ms-2 text-lg">✓</span> {window.__t("تحليل آلي محدود (10 وثائق/شهر)")}</li>
                <li className={`flex items-center text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}><span className="text-emerald-400 ms-2 text-lg">✓</span> {window.__t("الوصول للمكتبة القانونية")}</li>
                <li className={`flex items-center text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}><span className="text-emerald-400 ms-2 text-lg">✓</span> {window.__t("دعم عبر البريد")}</li>
              </ul>
              <button onClick={() => allowRegistrations ? onNavigate('register') : scrollToSection('contact')} className={`w-full py-3.5  font-bold transition-all duration-200 ${isDark ? 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10' : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200'}`}>{allowRegistrations ? window.__t("مجاناً") : window.__t("تواصل معنا")}</button>
            </div>

            {/* Pro — Featured */}
            <div className={`rounded-3xl p-8 border flex flex-col relative transform md:-translate-y-4 transition-all duration-300 ${isDark ? 'bg-white/[0.04] border-white/20 shadow-2xl shadow-white/5' : 'bg-slate-50 border-slate-300 shadow-2xl shadow-slate-200/50'}`}>
              <div className={`absolute top-0 end-1/2 transform translate-x-1/2 -translate-y-1/2 px-5 py-1.5 rounded-full text-xs font-black shadow-xl border border-white/20 whitespace-nowrap bg-gradient-to-r from-orange-400 to-orange-600 text-white`}>{window.__t("الأكثر طلباً")}</div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{window.__t("المحترف")}</h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{window.__t("للمحامين المستقلين")}</p>
              <div className={`text-5xl font-extrabold mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>{pricing.pro}<span className={`text-base font-normal ms-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>{window.__t("د.ت / شهر")}</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className={`flex items-center text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}><span className={`ms-2 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>✓</span> {window.__t("إدارة")} {planLimits.pro?.cases ?? 50} {window.__t("قضية نشطة")}</li>
                <li className={`flex items-center text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}><span className={`ms-2 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>✓</span> {window.__t("تحليل ذكي غير محدود بنموذج AI متطور")}</li>
                <li className={`flex items-center text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}><span className={`ms-2 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>✓</span> {window.__t("OCR غير محدود للمحاضر")}</li>
                <li className={`flex items-center text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}><span className={`ms-2 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>✓</span> {window.__t("تقارير PDF احترافية")}</li>
                <li className={`flex items-center text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}><span className={`ms-2 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>✓</span> {window.__t("تنبيهات الجلسات SMS")}</li>
              </ul>
              <button onClick={() => allowRegistrations ? onNavigate('register') : scrollToSection('contact')} className="w-full py-4 rounded-2xl font-bold transition-all duration-500 shadow-xl hover:shadow-2xl hover:-translate-y-1 orange-metallic shine-effect text-slate-900 shadow-orange-500/20">
                {allowRegistrations ? window.__t("ابدأ التجربة المجانية") : window.__t("تواصل معنا")}
              </button>
            </div>

            {/* Enterprise */}
            <div className={`rounded-3xl p-8 border flex flex-col transition-all duration-300 glass-sm ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white/60 border-slate-200/60'}`}>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{window.__t("المكتب")}</h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{window.__t("لمكاتب المحاماة والشركات")}</p>
              <div className={`text-5xl font-extrabold mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>{pricing.enterprise}<span className={`text-base font-normal ms-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>{window.__t("د.ت / شهر")}</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className={`flex items-center text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}><span className="text-emerald-400 ms-2 text-lg">✓</span> {window.__t("قضايا غير محدودة")}</li>
                <li className={`flex items-center text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}><span className="text-emerald-400 ms-2 text-lg">✓</span> {window.__t("3 حسابات محامين")}</li>
                <li className={`flex items-center text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}><span className="text-emerald-400 ms-2 text-lg">✓</span> {window.__t("لوحة تحكم إدارية متقدمة")}</li>
                <li className={`flex items-center text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}><span className="text-emerald-400 ms-2 text-lg">✓</span> {window.__t("أرشيف سحابي مشفر (100GB)")}</li>
                <li className={`flex items-center text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}><span className="text-emerald-400 ms-2 text-lg">✓</span> {window.__t("أولوية الدعم الفني 24/7")}</li>
              </ul>
              <button onClick={() => scrollToSection('contact')} className={`w-full py-3.5  font-bold transition-all duration-200 ${isDark ? 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10' : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200'}`}>{window.__t("تواصل معنا")}</button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CONTACT ═══════════════ */}
      <section id="contact" className="py-28 relative">
        <div className="container mx-auto px-6">
          <div className={`max-w-4xl mx-auto rounded-3xl p-8 md:p-12 border glass-sm ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white/60 border-slate-200/60'}`}>
            <div className="text-center mb-12">
              <h2 className={`text-3xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{window.__t("هل لديك استفسار؟")}</h2>
              <p className={isDark ? 'text-white/40' : 'text-slate-500'}>{window.__t("فريقنا جاهز للإجابة على جميع أسئلتك حول المنصة.")}</p>
            </div>
            <form className="space-y-6" onSubmit={handleContactSubmit}>
              {submitStatus === 'success' && (
                <div className={`p-4  border ${isDark ? 'bg-orange-400/10 border-orange-400/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                  <p>{window.__t("شكراً لتواصلك معنا! تم إرسال رسالتك بنجاح وسنرد عليك قريباً.")}</p>
                </div>
              )}
              {submitStatus === 'error' && (
                <div className={`p-4  border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  <p>{window.__t("حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى لاحقاً.")}</p>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/50' : 'text-slate-600'}`}>{window.__t("الاسم أو اسم المكتب")}</label>
                  <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} className={`w-full rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-slate-400/50 dark:focus:ring-white/30 outline-none transition-all border ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:bg-white/10' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-300 focus:bg-white focus:border-slate-400 dark:focus:border-white'}`} placeholder={window.__t("الاسم الكامل أو اسم المكتب")} required disabled={isSubmitting} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/50' : 'text-slate-600'}`}>{window.__t("البريد الإلكتروني")}</label>
                  <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={`w-full rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-slate-400/50 dark:focus:ring-white/30 outline-none transition-all border ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:bg-white/10' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-300 focus:bg-white focus:border-slate-400 dark:focus:border-white'}`} placeholder="example@email.com" required disabled={isSubmitting} />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/50' : 'text-slate-600'}`}>{window.__t("الرسالة")}</label>
                <textarea rows={4} value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} className={`w-full rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-slate-400/50 dark:focus:ring-white/30 outline-none transition-all border resize-none ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:bg-white/10' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-300 focus:bg-white focus:border-slate-400 dark:focus:border-white'}`} placeholder={window.__t("كيف يمكننا مساعدتك؟")} required disabled={isSubmitting}></textarea>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white dark:bg-white dark:text-orange-600 font-bold  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-orange-600/20 dark:hover:shadow-white/10 hover:-translate-y-0.5 flex items-center justify-center">
                {isSubmitting ? (
                  <><svg className="animate-spin -ms-1 me-3 h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{window.__t("جاري الإرسال...")}</>
                ) : window.__t("إرسال الرسالة")}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className={`border-t pt-20 pb-10 ${isDark ? 'bg-[#0B1121] border-white/[0.06]' : 'bg-[#fafaf9] border-slate-200/60'}`}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6 cursor-pointer group" onClick={() => { onNavigate('landing'); window.scrollTo(0, 0); }}>
                <div className="flex items-center justify-center transition-all duration-700 group-hover:scale-110 anim-balance w-9 h-9 flex-shrink-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-xl shadow-lg shadow-orange-400/30">
                  <svg className="text-white drop-shadow-sm w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 3v18" />
                    <path d="M5 8l-2 5h8l-2-5" />
                    <path d="M19 8l-2 5h8l-2-5" />
                  </svg>
                </div>
                <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>Al-Mohami</span>
              </div>
              <p className={`max-w-md ${isDark ? 'text-white/30' : 'text-slate-500'}`}>{window.__t("المنصة الأولى في تونس التي تستخدم الذكاء الاصطناعي التوليدي لمساعدة المحامين في تحقيق العدالة بكفاءة وسرعة.")}</p>
            </div>
            <div>
              <h4 className={`font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>{window.__t("روابط سريعة")}</h4>
              <ul className={`space-y-3 ${isDark ? 'text-white/30' : 'text-slate-500'}`}>
                <li><button onClick={() => { onNavigate('landing'); window.scrollTo(0, 0); }} className="hover:text-orange-600 dark:hover:text-white transition-colors">{window.__t("الرئيسية")}</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-orange-600 dark:hover:text-white transition-colors">{window.__t("عن المنصة")}</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-orange-600 dark:hover:text-white transition-colors">{window.__t("الأسعار")}</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-orange-600 dark:hover:text-white transition-colors">{window.__t("اتصل بنا")}</button></li>
              </ul>
            </div>
            <div>
              <h4 className={`font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>{window.__t("قانوني")}</h4>
              <ul className={`space-y-3 ${isDark ? 'text-white/30' : 'text-slate-500'}`}>
                <li><button onClick={() => onNavigate('terms')} className="hover:text-orange-600 dark:hover:text-white transition-colors">{window.__t("شروط الاستخدام")}</button></li>
                <li><button onClick={() => onNavigate('privacy')} className="hover:text-orange-600 dark:hover:text-white transition-colors">{window.__t("سياسة الخصوصية")}</button></li>
              </ul>
            </div>
          </div>
          <div className={`border-t pt-8 text-center text-sm ${isDark ? 'border-white/[0.06] text-white/20' : 'border-slate-200/60 text-slate-400'}`}>
            {window.__t("© 2026 منصة المحامي. صنع في تونس TN")}
          </div>
        </div>
      </footer>

      {/* Cookie Consent */}
      <CookieConsentToast 
        onAccept={() => localStorage.setItem('cookieConsent', 'true')} 
        onViewPrivacy={() => onNavigate('privacy')} 
        isDark={isDark}
      />

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsVideoModalOpen(false)}>
          <div className={`relative w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden ${isDark ? 'bg-[#0B1121]' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsVideoModalOpen(false)} className={`absolute top-4 start-4 z-10 p-2.5  glass transition-all ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-white'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <video className="absolute top-0 start-0 w-full h-full" controls autoPlay src="/assets/video.mp4">
                {window.__t("متصفحك لا يدعم تشغيل الفيديو.")}
              </video>
            </div>
          </div>
        </div>
      )}

      {/* ─── Back to Top Button ─── */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 end-6 md:bottom-10 md:end-10 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 transform flex items-center justify-center backdrop-blur-md ${isDark ? 'bg-white/10 text-white hover:bg-white hover:text-black border border-white/20' : 'bg-white text-orange-600 hover:bg-orange-600 hover:text-white border border-slate-200'} ${showBackToTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}
        aria-label="Back to top"
      >
        <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      </button>

    </div>
  );
};
