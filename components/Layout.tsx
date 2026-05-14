import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { apiService } from '../services/apiService';
import { NotificationBell } from './NotificationBell';
import { ArrowRight, User as UserIcon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentPage, onNavigate }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isRTL, setIsRTL] = useState(document.documentElement.dir !== 'ltr');

  // Watch for dir attribute changes (triggered by i18n language switch)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsRTL(document.documentElement.dir !== 'ltr');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
    return () => observer.disconnect();
  }, []);

  const isAdmin = user.role === UserRole.ADMIN;

  const NavItem = ({ page, icon, label }: { page: string; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => {
        onNavigate(page);
        setSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 relative group border border-transparent ${
        currentPage === page
          ? 'bg-white/10 text-white border-white/5 shadow-xl'
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {currentPage === page && (
        <div className={`absolute ${isRTL ? '-end-1' : '-end-1'} top-1/2 -translate-y-1/2 w-1.5 h-8 bg-orange-600 rounded-full shadow-[0_0_15px_rgba(234,88,12,0.6)]`}></div>
      )}
      <span className={`text-xl transition-transform duration-300 group-hover:scale-110 ${currentPage === page ? 'text-orange-500' : 'text-slate-500 group-hover:text-white'}`}>{icon}</span>
      <span className="font-bold text-sm tracking-wide">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        className={`sidebar-mobile fixed lg:relative z-30 w-72 h-full bg-[#1e1b4b] text-white flex flex-col shadow-2xl transition-transform transform border-e border-white/5 ${
          isRTL
            ? (isSidebarOpen ? 'translate-x-0 end-0' : 'translate-x-full end-0')
            : (isSidebarOpen ? 'translate-x-0 start-0' : '-translate-x-full start-0')
        } ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'} lg:translate-x-0 lg:start-auto lg:end-auto lg:relative`}
      >
        <div className="p-8 flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-xl flex items-center justify-center shadow-lg shadow-orange-400/30 rotate-3 group transition-all hover:rotate-0 hover:scale-110 cursor-pointer">
              <svg className="text-white drop-shadow-sm w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 3v18" />
                <path d="M5 8l-2 5h8l-2-5" />
                <path d="M19 8l-2 5h8l-2-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter" style={{ fontFamily: "'Tajawal', sans-serif" }}>
              {window.__t("المحامي")}
            </h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          {isAdmin ? (
            <>
              <NavItem page="admin-dashboard" icon="📊" label={window.__t("لوحة التحكم")} />
              <NavItem page="admin-users" icon="👥" label={window.__t("المستخدمين")} />
              <NavItem page="admin-marketing" icon="📧" label={window.__t("البريد التسويقي")} />
              <NavItem page="admin-chat" icon="💬" label={window.__t("المحادثات")} />
              <NavItem page="admin-settings" icon="⚙️" label={window.__t("الإعدادات العامة")} />
            </>
          ) : (
            <>
              <NavItem page="dashboard" icon="📊" label={window.__t("نظرة عامة")} />
              <NavItem page="cases" icon="📁" label={window.__t("القضايا")} />
              <NavItem page="calendar" icon="📅" label={window.__t("الروزنامة")} />
              <NavItem page="courses" icon="📚" label={window.__t("المكتبة القانونية")} />
              <NavItem page="contracts" icon="📝" label={window.__t("العقود")} />
              {user.subscriptionPlan === 'enterprise' && <NavItem page="team" icon="👥" label={window.__t("فريق العمل")} />}
              {user.subscriptionPlan === 'enterprise' && !user.organizationOwnerId && <NavItem page="pending-cases" icon="⏳" label={window.__t("طلبات معلقة")} />}
              <NavItem page="notifications" icon="🔔" label={window.__t("الإشعارات")} />
              <NavItem page="settings" icon="⚙️" label={window.__t("الإعدادات")} />
            </>
          )}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/10">
          <button
            onClick={() => {
              const dashboardPage = isAdmin ? 'admin-dashboard' : 'dashboard';
              onNavigate(currentPage === 'profile' ? dashboardPage : 'profile');
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 mb-6 group transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 font-bold flex-shrink-0 overflow-hidden border border-white/10 group-hover:border-orange-500/50 group-hover:text-orange-500 transition-all duration-300">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 overflow-hidden text-start">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{user.role === UserRole.LAWYER ? window.__t("محامي") : window.__t("مدير")}</p>
            </div>
          </button>
          <button 
            onClick={onLogout}
            className="w-full py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {window.__t("تسجيل الخروج")}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between sticky top-0 z-[100]">
           <div className="flex items-center gap-2">
             {/* Back Arrow for sub-pages */}
             {!['dashboard', 'admin-dashboard'].includes(currentPage) && (
               <button 
                 onClick={() => window.history.back()}
                 className="p-2 -me-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                 title={window.__t("رجوع")}
               >
                 <ArrowRight className="w-6 h-6" />
               </button>
             )}
             <h1 className="text-xl font-bold text-slate-800 lg:hidden">{window.__t("المحامي")}</h1>
           </div>
           <div className="flex items-center gap-4">
             <button onClick={async () => { 
               const newLang = window.__i18n.language === 'ar' ? 'fr' : 'ar';
               try {
                 await apiService.updateLanguage(newLang);
                 window.__i18n?.changeLanguage(newLang); 
                 setSidebarOpen(false); 
                 window.location.reload(); 
               } catch (error) {
                 console.error('Failed to update language:', error);
                 // Still change language locally even if API fails
                 window.__i18n?.changeLanguage(newLang); 
                 setSidebarOpen(false); 
                 window.location.reload(); 
               }
             }} className="px-3 py-1 bg-slate-100 rounded hover:bg-slate-200 font-medium text-slate-700">
               {window.__i18n?.language === 'ar' ? 'Français' : 'العربية'}
             </button>
             <NotificationBell
               onNotificationClick={(notification) => {
                 if (notification.link) {
                   const page = (notification.link || '').replace(/^[#/]+/, '').split('/')[0] || '';
                   if (page) onNavigate(page);
                 }
               }}
               onNavigate={onNavigate}
             />
             <button onClick={() => setSidebarOpen(true)} className="text-slate-600 p-2 lg:hidden">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
           </button>
           </div>
        </header>
        
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};