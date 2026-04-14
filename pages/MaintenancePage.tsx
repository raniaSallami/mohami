import React from 'react';

export const MaintenancePage = (
  { onNavigate, appName = window.__t("المحامي"), onLogout }: 
  { onNavigate: (page: string) => void; appName?: string; onLogout?: () => void }
) => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
    <div className="max-w-md">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-500/20 flex items-center justify-center">
        <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-3">{window.__t("وضع الصيانة")}</h1>
      <p className="text-slate-400 mb-8">{window.__t("المنصة متوقفة مؤقتاً للصيانة. سنعود قريباً.")}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => onLogout ? onLogout() : onNavigate('login')}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition"
        >
          {onLogout ? window.__t("تسجيل الخروج والدخول كإدارة") : window.__t("تسجيل دخول الإدارة")}
        </button>
      </div>
    </div>
  </div>
);
