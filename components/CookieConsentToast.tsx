import React, { useState, useEffect } from 'react';

interface CookieConsentToastProps {
  onAccept: () => void;
  onViewPrivacy: () => void;
}

export const CookieConsentToast: React.FC<CookieConsentToastProps> = ({
  onAccept,
  onViewPrivacy
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
      <div className="max-w-4xl mx-auto bg-white border-2 border-gold-500 rounded-lg shadow-2xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              {window.__t("🍪 ملفات تعريف الارتباط (Cookies)")}
            </h3>
            <p className="text-sm text-slate-700 mb-2">
              {window.__t(`نستخدم ملفات تعريف الارتباط لتحسين تجربة استخدامك للمنصة وحفظ تفضيلاتك. 
\n              باستمرارك في التصفح، فإنك توافق على استخدامنا لملفات تعريف الارتباط.`)}
            </p>
            <button
              onClick={onViewPrivacy}
              className="text-sm text-gold-600 hover:text-gold-700 underline"
            >
              {window.__t("معرفة المزيد في سياسة الخصوصية")}
            </button>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={onViewPrivacy}
              className="px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              {window.__t("التفاصيل")}
            </button>
            <button
              onClick={() => {
                onAccept();
                setIsVisible(false);
              }}
              className="px-6 py-2 text-sm bg-gold-500 hover:bg-gold-400 text-slate-900 font-bold rounded-lg transition"
            >
              {window.__t("موافق")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
