import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { NotificationBell } from './NotificationBell';
import { ArrowRight } from 'lucide-react';

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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        currentPage === page
          ? 'bg-primary-900 text-white shadow-lg'
          : 'text-gray-300 hover:bg-primary-800 hover:text-white'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
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
        className={`sidebar-mobile fixed lg:relative z-30 w-64 h-full bg-slate-900 text-white flex flex-col shadow-2xl transition-transform transform ${
          isRTL
            ? (isSidebarOpen ? 'translate-x-0 end-0' : 'translate-x-full end-0')
            : (isSidebarOpen ? 'translate-x-0 start-0' : '-translate-x-full start-0')
        } ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'} lg:translate-x-0 lg:start-auto lg:end-auto lg:relative`}
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center">
              <span className="text-slate-900 font-bold text-lg">{window.__t("م")}</span>
            </div>
            <h1 className="text-2xl font-bold text-gold-500 tracking-tight">{window.__t("المحامي")}</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400">
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

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => {
              const dashboardPage = isAdmin ? 'admin-dashboard' : 'dashboard';
              onNavigate(currentPage === 'profile' ? dashboardPage : 'profile');
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity text-start"
          >
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden border border-slate-700">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-gray-400">{user.role === UserRole.LAWYER ? window.__t("محامي") : window.__t("مدير")}</p>
            </div>
          </button>
          <button 
            onClick={onLogout}
            className="w-full py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors text-white"
          >
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
             <button onClick={() => { window.__i18n?.changeLanguage(window.__i18n.language === 'ar' ? 'fr' : 'ar'); setSidebarOpen(false); /* Force re-render simple fallback */ window.location.reload(); }} className="px-3 py-1 bg-slate-100 rounded hover:bg-slate-200 font-medium text-slate-700">
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