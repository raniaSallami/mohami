import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { storageService } from './services/storageService';
import { User, UserRole } from './types';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Dashboard } from './pages/Dashboard';
import { CaseList } from './pages/CaseList';
import { NewCase } from './pages/NewCase';
import { CaseDetail } from './pages/CaseDetail';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminSettings } from './pages/AdminSettings';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { TermsPage, PrivacyPage } from './pages/Legal';
import { Courses } from './pages/Courses';
import { Contracts } from './pages/Contracts';
import { Calendar } from './pages/Calendar';
import { AdminChat } from './pages/AdminChat';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { TeamPage } from './pages/TeamPage';
import { PendingCasesPage } from './pages/PendingCasesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { InviteAcceptPage } from './pages/InviteAcceptPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { Marketing } from './pages/Marketing';
import { SecurityAlertPage } from './pages/SecurityAlertPage';
import { PaymentResult } from './pages/PaymentResult';
import { Chatbot } from './components/Chatbot';
import { Toast } from './components/UI';
import { TermsAcceptanceModal } from './components/TermsAcceptanceModal';
import { IpVerificationModal } from './components/IpVerificationModal';
import { DeviceVerificationPage } from './components/DeviceVerificationPage';
import { visitorService } from './services/visitorService';
import { ipService } from './services/ipService';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseFilter, setCaseFilter] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingIpVerificationUser, setPendingIpVerificationUser] = useState<User | null>(null);
  const [securityAlertParams, setSecurityAlertParams] = useState<{ alertType: 'confirm' | 'not-me'; userEmail: string } | null>(null);
  const [systemSettings, setSystemSettings] = useState<{ maintenanceMode: boolean; allowRegistrations: boolean; appName: string }>({
    maintenanceMode: false,
    allowRegistrations: true,
    appName: 'المحامي'
  });

  useEffect(() => {
    const initApp = async () => {
      await storageService.init();
      try {
        const gs = await storageService.getGeneralSettings();
        setSystemSettings({
          maintenanceMode: !!gs.maintenanceMode,
          allowRegistrations: gs.allowRegistrations !== false,
          appName: gs.appName || 'المحامي'
        });
      } catch (_) { /* use defaults */ }
      const hash = window.location.hash.slice(1);
      const parts = hash ? hash.split('/') : [];
      const hashPage = parts[0] || null;
      const hashCaseId = parts[1] || null;
      const hashToken = parts[1] || null;

      // Check for security-alert routes
      if (hashPage === 'security-alert' && parts[1]) {
        const alertType = parts[1] as 'confirm' | 'not-me';
        const userEmail = parts[2] || '';
        if (['confirm', 'not-me'].includes(alertType) && userEmail) {
          setCurrentPage('security-alert');
          setSecurityAlertParams({ alertType, userEmail });
          setLoading(false);
          return;
        }
      }

      // Handle payment return even when already authenticated
      if (hashPage === 'payment') {
        setCurrentPage('payment');
        setLoading(false);
        return;
      }

      let currentUser = storageService.getCurrentUser();
      if (currentUser) {
        const fresh = await storageService.getCurrentUserFresh();
        if (fresh) {
          currentUser = fresh;
          storageService.setCurrentUser(fresh);
        }
        const { valid, currentIP } = await ipService.validateSessionIP(currentUser.id);
        if (!valid && currentIP) {
          setPendingIpVerificationUser(currentUser);
          setUser(null);
          setCurrentPage('landing');
          window.history.replaceState({}, '', '/#landing');
          try {
            await storageService.createIpVerificationOtp(currentUser.id, currentUser.email, currentUser.name, currentIP);
          } catch (e) {
            storageService.logout();
            setPendingIpVerificationUser(null);
            setNotification({ msg: 'فشل إرسال رمز التحقق. تم تسجيل الخروج.', type: 'error' });
          }
        } else if (!valid) {
          setUser(currentUser); // Can't get IP - allow to avoid blocking
          const defaultPage = currentUser.role === UserRole.ADMIN ? 'admin-dashboard' : 'dashboard';
          const validPages = ['dashboard', 'cases', 'new-case', 'case-detail', 'settings', 'profile', 'calendar', 'contracts', 'courses', 'team', 'pending-cases', 'notifications', 'admin-dashboard', 'admin-users', 'admin-settings', 'admin-chat', 'admin-marketing'];
          const page = (hashPage && validPages.includes(hashPage)) ? hashPage : defaultPage;
          setCurrentPage(page);
          if (hashCaseId) setSelectedCaseId(hashCaseId);
          window.history.replaceState({ page }, '', `/#${page}${hashCaseId ? '/' + hashCaseId : ''}`);
        } else {
          setUser(currentUser);
          const defaultPage = currentUser.role === UserRole.ADMIN ? 'admin-dashboard' : 'dashboard';
          const validPages = ['dashboard', 'cases', 'new-case', 'case-detail', 'settings', 'profile', 'calendar', 'contracts', 'courses', 'team', 'pending-cases', 'notifications', 'admin-dashboard', 'admin-users', 'admin-settings', 'admin-chat', 'admin-marketing'];
          const page = (hashPage && validPages.includes(hashPage)) ? hashPage : defaultPage;
          setCurrentPage(page);
          if (hashCaseId) setSelectedCaseId(hashCaseId);
          window.history.replaceState({ page }, '', `/#${page}${hashCaseId ? '/' + hashCaseId : ''}`);
        }
      } else if (hashPage === 'payment') {
        // Handle payment return even if not logged in (verify logic will handle auth)
        setCurrentPage('payment');
        setLoading(false);
        return;
      } else {
        if (hashPage === 'invite' && hashToken && hashToken.length > 10) {
          setCurrentPage('invite');
          setInviteToken(hashToken);
          window.history.replaceState({}, '', `/#invite/${hashToken}`);
        } else {
          const page = ['landing', 'login', 'register', 'terms', 'privacy'].includes(hashPage || '') ? (hashPage || 'landing') : 'landing';
          setCurrentPage(page);
          setInviteToken(null);
        }
        window.history.replaceState({}, '', window.location.hash || '/#landing');
      }
      setLoading(false);
    };
    initApp();
  }, []);

  const handleLogin = (user: User) => {
    setUser(user);
    
    // Check if user has accepted terms
    const termsAccepted = localStorage.getItem(`termsAccepted_${user.id}`);
    if (!termsAccepted) {
      // Show terms modal for first-time login
      setShowTermsModal(true);
    } else {
      setCurrentPage(user.role === UserRole.ADMIN ? 'admin-dashboard' : 'dashboard');
      setNotification({ msg: `مرحباً بك ${user.name}`, type: 'success' });
    }
  };

  const handleAcceptTerms = () => {
    localStorage.setItem('termsAccepted', 'true');
    localStorage.setItem('termsAcceptedDate', new Date().toISOString());
    setShowTermsModal(false);
    if (user) {
      localStorage.setItem(`termsAccepted_${user.id}`, 'true');
      localStorage.setItem(`termsAcceptedDate_${user.id}`, new Date().toISOString());
      setCurrentPage(user.role === UserRole.ADMIN ? 'admin-dashboard' : 'dashboard');
      setNotification({ msg: `مرحباً بك ${user.name}`, type: 'success' });
    } else {
      setNotification({ msg: 'شكراً لقبولك الشروط. يمكنك المتابعة.', type: 'success' });
    }
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
    setCurrentPage('landing');
    setNotification({ msg: 'تم تسجيل الخروج بنجاح', type: 'info' });
  };

  const handleNavigate = (page: string, params?: string) => {
    if (page === 'case-detail') {
      if (params) setSelectedCaseId(params);
    } else if (page === 'cases') {
      setCaseFilter(params || null);
    }
    
    setCurrentPage(page);
    // Use History API so browser Back stays within the app
    const path = params ? `${page}/${params}` : page;
    window.history.pushState({ page, params }, '', `/#${path}`);
    window.scrollTo(0, 0);
  };

  // Handle browser Back/Forward - navigate within platform
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.slice(1) || 'landing';
      const [page, caseId] = hash.split('/');
      if (page) {
        setCurrentPage(page);
        if (caseId) setSelectedCaseId(caseId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check for admin chat route
  useEffect(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/2473464708734803' || hash === '#2473464708734803') {
      setCurrentPage('admin-chat');
      window.history.replaceState({}, '', '/#2473464708734803');
    }
  }, []);

  // Show terms modal when guest tries to access login/register - MUST be before any early returns (Rules of Hooks)
  useEffect(() => {
    if (!user && (currentPage === 'login' || currentPage === 'register')) {
      const termsAccepted = localStorage.getItem('termsAccepted');
      if (!termsAccepted) setShowTermsModal(true);
    }
  }, [user, currentPage]);

  const showNotification = (msg: string, type: 'success' | 'error' | 'info') => {
    setNotification({ msg, type });
  };

  const handleVerifyOtp = async (otp: string): Promise<boolean> => {
    if (!pendingIpVerificationUser) return false;
    const ok = await storageService.verifyIpOtp(pendingIpVerificationUser.id, otp);
    if (ok) {
      setUser(pendingIpVerificationUser);
      setPendingIpVerificationUser(null);
      setCurrentPage(pendingIpVerificationUser.role === UserRole.ADMIN ? 'admin-dashboard' : 'dashboard');
      setNotification({ msg: `مرحباً بك ${pendingIpVerificationUser.name}`, type: 'success' });
    }
    return ok;
  };

  const handleCancelIpVerification = () => {
    if (pendingIpVerificationUser) {
      storageService.logout();
      ipService.clearIPBinding(pendingIpVerificationUser.id);
    }
    setPendingIpVerificationUser(null);
    setCurrentPage('landing');
    setNotification({ msg: 'تم تسجيل الخروج', type: 'info' });
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (pendingIpVerificationUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <IpVerificationModal
          isOpen={true}
          userName={pendingIpVerificationUser.name}
          onVerify={handleVerifyOtp}
          onCancel={handleCancelIpVerification}
        />
      </div>
    );
  }

  if (!user) {
    if (currentPage === 'security-alert' && securityAlertParams) {
      return (
        <SecurityAlertPage
          onNavigate={handleNavigate}
          alertType={securityAlertParams.alertType}
        />
      );
    }
    if (currentPage === 'invite' && inviteToken) {
      return (
        <InviteAcceptPage
          token={inviteToken}
          onAccept={(u) => {
            storageService.setCurrentUser(u);
            localStorage.setItem(`termsAccepted_${u.id}`, 'true');
            setUser(u);
            setInviteToken(null);
            setCurrentPage('team');
            setNotification({ msg: `مرحباً بك ${u.name}`, type: 'success' });
          }}
          onNavigate={(p) => { setCurrentPage(p); setInviteToken(null); handleNavigate(p); }}
        />
      );
    }
    if (systemSettings.maintenanceMode) {
      if (currentPage === 'login') return <LoginPage onLogin={handleLogin} onNavigate={handleNavigate} allowRegistrations={false} />;
      return <MaintenancePage onNavigate={handleNavigate} appName={systemSettings.appName} />;
    }
    if (currentPage === 'deviceVerification') {
      return (
        <DeviceVerificationPage
          onSuccess={() => {
            // After successful OTP verification, the backend returns tokens
            // Fetch fresh user data
            storageService.getCurrentUserFresh().then(u => {
              if (u) {
                setUser(u);
                setCurrentPage('dashboard');
                setNotification({ msg: 'تم التحقق من الجهاز بنجاح', type: 'success' });
              }
            });
          }}
          onNavigate={handleNavigate}
        />
      );
    }
    if (currentPage === 'payment') {
      const status = window.location.hash.includes('success') ? 'success' : 'fail';
      return (
        <PaymentResult
          status={status as 'success' | 'fail'}
          onNavigate={handleNavigate}
          onRefreshUser={(u) => setUser(u)}
        />
      );
    }
    if (currentPage === 'login') return <LoginPage onLogin={handleLogin} onNavigate={handleNavigate} allowRegistrations={systemSettings.allowRegistrations} />;
    if (currentPage === 'register') {
      if (!systemSettings.allowRegistrations) {
        return (
          <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
            <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md text-center">
              <h2 className="text-xl font-bold text-slate-800 mb-4">التسجيل مغلق حالياً</h2>
              <p className="text-gray-600 mb-6">التسجيل غير متاح في الوقت الحالي. يرجى المحاولة لاحقاً.</p>
              <button onClick={() => handleNavigate('landing')} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
                العودة للرئيسية
              </button>
            </div>
          </div>
        );
      }
      return <RegisterPage onLogin={handleLogin} onNavigate={handleNavigate} />;
    }
    if (currentPage === 'terms') return <TermsPage onBack={() => handleNavigate('landing')} />;
    if (currentPage === 'privacy') return <PrivacyPage onBack={() => handleNavigate('landing')} />;
    if (currentPage === 'admin-chat') return <AdminChat />;
    return (
      <>
        <LandingPage onNavigate={handleNavigate} allowRegistrations={systemSettings.allowRegistrations} />
        <Chatbot />
      </>
    );
  }

  if (systemSettings.maintenanceMode && user.role !== UserRole.ADMIN) {
    const handleLogoutThenLogin = () => {
      storageService.logout();
      setUser(null);
      setCurrentPage('login');
    };
    return (
      <MaintenancePage
        onNavigate={handleNavigate}
        appName={systemSettings.appName}
        onLogout={handleLogoutThenLogin}
      />
    );
  }

  // Router Logic for Authenticated Users
  const renderPage = () => {
    if (user.role === UserRole.ADMIN) {
      switch (currentPage) {
        case 'admin-dashboard': return <AdminDashboard />;
        case 'admin-users': return <AdminUsersPage />;
        case 'admin-settings': return <AdminSettings />;
        case 'admin-chat': return <AdminChat />;
        case 'admin-marketing': return <Marketing />;
        default: return <AdminDashboard />;
      }
    } else {
      switch (currentPage) {
        case 'dashboard': return <Dashboard onNavigate={handleNavigate} user={user} />;
        case 'cases': return <CaseList onNavigate={handleNavigate} initialFilter={caseFilter || undefined} />;
        case 'new-case': return <NewCase onNavigate={handleNavigate} />;
        case 'case-detail': return <CaseDetail caseId={selectedCaseId!} onBack={() => handleNavigate('cases')} />;
        case 'settings': return <SettingsPage user={user} onUpdateUser={(u) => { setUser(u); showNotification('تم تحديث البيانات', 'success'); }} />;
        case 'profile': return <ProfilePage user={user} onNavigate={handleNavigate} onUpdateUser={(u) => setUser(u)} />;
        case 'courses': return <Courses />;
        case 'contracts': return <Contracts />;
        case 'calendar': return <Calendar />;
        case 'team': return <TeamPage user={user} onNavigate={handleNavigate} onRefreshUser={(u) => setUser(u)} />;
        case 'pending-cases': return <PendingCasesPage user={user} onNavigate={handleNavigate} onNotification={showNotification} />;
        case 'notifications': return <NotificationsPage onNavigate={handleNavigate} />;
        case 'payment': {
          const status = window.location.hash.includes('success') ? 'success' : 'fail';
          return <PaymentResult status={status as 'success' | 'fail'} onNavigate={handleNavigate} onRefreshUser={setUser} />;
        }
        default: return <Dashboard onNavigate={handleNavigate} user={user} />;
      }
    }
  };

  return (
    <>
      <Layout user={user} onLogout={handleLogout} currentPage={currentPage} onNavigate={handleNavigate}>
        {notification && <Toast message={notification.msg} type={notification.type} onClose={() => setNotification(null)} />}
        {renderPage()}
      </Layout>
      {currentPage !== 'admin-chat' && <Chatbot />}
      <Toaster position="top-center" />
      
      {/* Terms Acceptance Modal - for logged-in users + guests (login/register) */}
      {(user || showTermsModal) && (
        <TermsAcceptanceModal
          isOpen={showTermsModal}
          onAccept={handleAcceptTerms}
          onViewTerms={() => {
            setShowTermsModal(false);
            handleNavigate('terms');
          }}
          onViewPrivacy={() => {
            setShowTermsModal(false);
            handleNavigate('privacy');
          }}
        />
      )}
    </>
  );
}