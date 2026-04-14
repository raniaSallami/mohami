import React, { useState } from 'react';
import { Modal } from './UI';

interface TermsAcceptanceModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onViewTerms: () => void;
  onViewPrivacy: () => void;
}

export const TermsAcceptanceModal: React.FC<TermsAcceptanceModalProps> = ({
  isOpen,
  onAccept,
  onViewTerms,
  onViewPrivacy
}) => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isScrolledToBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (isScrolledToBottom && !hasScrolled) {
      setHasScrolled(true);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccepted(e.target.checked);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title={window.__t("قبول شروط الاستخدام وسياسة الخصوصية")} preventClose={true}>
      <div className="space-y-6" dir="rtl">
        <div className="bg-blue-50 border-e-4 border-blue-400 p-4 rounded">
          <p className="text-blue-900 font-bold mb-2">{window.__t("⚠️ تنبيه مهم")}</p>
          <p className="text-blue-800 text-sm">
            {window.__t(`يرجى قراءة شروط الاستخدام وسياسة الخصوصية بعناية قبل المتابعة. 
\n            باستخدام هذه المنصة، فإنك توافق على الالتزام بجميع الشروط والأحكام.`)}
          </p>
        </div>

        <div 
          className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg p-4 bg-slate-50"
          onScroll={handleScroll}
        >
          <h3 className="font-bold text-slate-900 mb-3">{window.__t("شروط الاستخدام")}</h3>
          <p className="text-sm text-slate-700 mb-4">
            {window.__t("منصة \"المحامي\" مملوكة ومدارة من قبل شركة")} <strong>NOVALABS WEB DESIGN</strong>{window.__t(`. 
\n            باستخدام هذه المنصة، فإنك تقر بأنك قد قرأت وفهمت ووافقت على الالتزام بجميع الشروط والأحكام.`)}
          </p>
          
          <h4 className="font-bold text-slate-800 mb-2">{window.__t("نقاط مهمة:")}</h4>
          <ul className="list-disc list-inside space-y-2 text-sm text-slate-700 mb-4 me-4">
            <li>{window.__t("التحليلات المقدمة هي أدوات مساعدة وليست بديلاً عن الرأي القانوني المهني")}</li>
            <li>{window.__t("أنت مسؤول عن الحفاظ على سرية معلومات حسابك")}</li>
            <li>{window.__t("جميع البيانات محمية ومشفرة وفقاً لأعلى معايير الأمان")}</li>
            <li>{window.__t("الخوادم موجودة داخل الأراضي التونسية")}</li>
            <li>{window.__t("لا نستخدم بياناتك لتدريب نماذج الذكاء الاصطناعي العامة")}</li>
          </ul>

          <h3 className="font-bold text-slate-900 mb-3 mt-6">{window.__t("سياسة الخصوصية")}</h3>
          <p className="text-sm text-slate-700 mb-4">
            {window.__t(`نحن ملتزمون بحماية خصوصيتك وبياناتك الشخصية. جميع البيانات الحساسة مشفرة 
\n            أثناء النقل والتخزين باستخدام أحدث تقنيات التشفير (TLS 1.3, AES-256).`)}
          </p>

          <h4 className="font-bold text-slate-800 mb-2">{window.__t("حماية البيانات:")}</h4>
          <ul className="list-disc list-inside space-y-2 text-sm text-slate-700 mb-4 me-4">
            <li>{window.__t("تشفير جميع الاتصالات باستخدام SSL/TLS")}</li>
            <li>{window.__t("تشفير كلمات المرور باستخدام خوارزميات hash آمنة")}</li>
            <li>{window.__t("عدم تخزين البيانات الحساسة في نص واضح")}</li>
            <li>{window.__t("الخوادم موجودة في تونس")}</li>
            <li>{window.__t("لا نشارك بياناتك مع أطراف ثالثة")}</li>
          </ul>

          <p className="text-xs text-slate-500 mt-4">
            {window.__t("للاطلاع على النصوص الكاملة، يرجى زيارة صفحات شروط الاستخدام وسياسة الخصوصية.")}
          </p>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <input
            type="checkbox"
            id="accept-terms"
            checked={accepted && hasScrolled}
            onChange={handleCheckboxChange}
            disabled={!hasScrolled}
            className="w-4 h-4 text-gold-600 border-gray-300 rounded focus:ring-gold-500 disabled:opacity-50"
          />
          <label htmlFor="accept-terms" className={`text-sm ${hasScrolled ? 'text-slate-700' : 'text-slate-400'}`}>
            {hasScrolled 
              ? window.__t("أوافق على شروط الاستخدام وسياسة الخصوصية") 
              : window.__t("يرجى التمرير للأسفل لقراءة الشروط الكاملة")}
          </label>
        </div>

        <div className="flex space-x-3 space-x-reverse pt-4 border-t">
          <button
            onClick={onViewTerms}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            {window.__t("قراءة الشروط الكاملة")}
          </button>
          <button
            onClick={onViewPrivacy}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            {window.__t("قراءة سياسة الخصوصية")}
          </button>
        </div>

        <button
          onClick={onAccept}
          disabled={!hasScrolled || !accepted}
          className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-gray-300 disabled:cursor-not-allowed text-slate-900 font-bold py-3 rounded-lg transition"
        >
          {accepted && hasScrolled ? window.__t("أوافق على الشروط والمتابعة") : hasScrolled ? window.__t("يرجى الموافقة على الشروط") : window.__t("يرجى قراءة الشروط أولاً")}
        </button>
      </div>
    </Modal>
  );
};
