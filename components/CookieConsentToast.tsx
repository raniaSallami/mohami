import React, { useState, useEffect } from 'react';

interface CookieConsentToastProps {
  onAccept: () => void;
  onViewPrivacy: () => void;
  isDark?: boolean;
}

export const CookieConsentToast: React.FC<CookieConsentToastProps> = ({
  onAccept,
  onViewPrivacy,
  isDark = false
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Show after a small delay for better UX
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 start-0 end-0 z-50 p-4 animate-slideUp" dir={document.documentElement.dir}>
      <div className={`max-w-4xl mx-auto rounded-lg shadow-2xl p-6 border-2 border-orange-500/30 ${isDark ? 'bg-[#131B2E] text-white' : 'bg-white text-slate-900'}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {window.__t("🍪 ملفات تعريف الارتباط (Cookies)")}
            </h3>
            <p className={`text-sm mb-2 ${isDark ? 'text-white/60' : 'text-slate-700'}`}>
              {window.__t(`نستخدم ملفات تعريف الارتباط لتحسين تجربة استخدامك للمنصة وحفظ تفضيلاتك. 
\n              باستمرارك في التصفح، فإنك توافق على استخدامنا لملفات تعريف الارتباط.`)}
            </p>
            <button
              onClick={onViewPrivacy}
              className="text-sm text-orange-500 hover:text-orange-400 underline font-medium"
            >
              {window.__t("معرفة المزيد في سياسة الخصوصية")}
            </button>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={onViewPrivacy}
              className={`px-4 py-2 text-sm rounded-lg transition border ${isDark ? 'border-white/10 text-white/70 hover:bg-white/5' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
            >
              {window.__t("التفاصيل")}
            </button>
            <button
              onClick={() => {
                onAccept();
                setIsVisible(false);
              }}
              className="px-6 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition shadow-lg shadow-orange-500/20"
            >
              {window.__t("موافق")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
