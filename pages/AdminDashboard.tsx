
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User, UserRole } from '../types';
import { Modal, Spinner } from '../components/UI';
import { visitorService, VisitorStats, VisitorChartPoint, RegistrationChartPoint } from '../services/visitorService';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Users as UsersIcon, Scale, ArrowUpCircle, TrendingUp, DollarSign, Edit2, Trash2, RefreshCw } from 'lucide-react';

// User Row Component with Edit/Delete/Upgrade
const UserRow: React.FC<{ user: User | any; onUpdate: () => void; onDelete: () => void }> = ({ user, onUpdate, onDelete }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  
  const currentPlan = user.subscriptionPlan || user.subscription_plan || 'basic';
  const currentStatus = user.subscriptionStatus || user.subscription_status || 'active';
  
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const updatedUser = { ...user, name: editName, email: editEmail };
      await storageService.updateUser(updatedUser);
      onUpdate();
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating user:', error);
      alert(window.__t("حدث خطأ أثناء تحديث المستخدم"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await storageService.deleteUser(user.id);
      onDelete();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(window.__t("حدث خطأ أثناء حذف المستخدم"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await storageService.upgradeUserPlan(user.id, selectedPlan as any);
      // Send upgrade email
      const planNames: Record<string, string> = {
        basic: window.__t("البداية"),
        pro: window.__t("المحترف"),
        enterprise: window.__t("المكتب")
      };
      await emailService.sendPlanUpgradeEmail(user.email, user.name, planNames[selectedPlan] || selectedPlan);
      onUpdate();
      setShowUpgradeModal(false);
      alert(window.__t("تم ترقية الباقة بنجاح وتم إرسال بريد إلكتروني للمستخدم"));
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert(window.__t("حدث خطأ أثناء ترقية الباقة"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
        <td className="px-6 py-4 text-slate-500">{user.email}</td>
        <td className="px-6 py-4">
          <span className={`px-2 py-1 rounded text-xs ${
            currentPlan === 'basic' ? 'bg-gray-100' : 
            currentPlan === 'pro' ? 'bg-purple-100 text-purple-700' : 
            'bg-gold-100 text-gold-800'
          }`}>
            {currentPlan === 'basic' ? window.__t("البداية") : 
             currentPlan === 'pro' ? window.__t("المحترف") : window.__t("المكتب")}
          </span>
        </td>
        <td className="px-6 py-4">
          {currentStatus === 'pending_approval' ? (
            <span className="text-orange-500 font-bold text-xs">{window.__t("قيد المراجعة")}</span>
          ) : (
            <span className="text-green-600 text-xs font-bold">{window.__t("نشط")}</span>
          )}
        </td>
        <td className="px-6 py-4">
          <div className="flex space-x-2 space-x-reverse">
            <button
              onClick={() => setShowEditModal(true)}
              className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50 transition"
              title={window.__t("تعديل")}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="text-green-600 hover:text-green-800 text-xs px-2 py-1 rounded hover:bg-green-50 transition"
              title={window.__t("ترقية الباقة")}
            >
              <ArrowUpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50 transition"
              title={window.__t("حذف")}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={window.__t("تعديل المستخدم")}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{window.__t("الاسم")}</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{window.__t("البريد الإلكتروني")}</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? window.__t("جاري الحفظ...") : window.__t("حفظ التغييرات")}
          </button>
        </div>
      </Modal>

      {/* Upgrade Modal */}
      <Modal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} title={window.__t("ترقية الباقة")}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{window.__t("اختر الباقة الجديدة")}</label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="basic">{window.__t("البداية")}</option>
              <option value="pro">{window.__t("المحترف")}</option>
              <option value="enterprise">{window.__t("المكتب")}</option>
            </select>
          </div>
          <button
            onClick={handleUpgrade}
            disabled={loading || selectedPlan === currentPlan}
            className="w-full bg-gold-500 text-slate-900 py-2 rounded hover:bg-gold-400 disabled:opacity-50 font-bold"
          >
            {loading ? window.__t("جاري الترقية...") : window.__t("ترقية الباقة")}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title={window.__t("تأكيد الحذف")}>
        <div className="space-y-4">
          <p className="text-red-600">{window.__t("هل أنت متأكد من حذف المستخدم")} <strong>{user.name}</strong>{window.__t("؟")}</p>
          <p className="text-sm text-gray-600">{window.__t("لا يمكن التراجع عن هذه العملية.")}</p>
          <div className="flex space-x-3 space-x-reverse">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? window.__t("جاري الحذف...") : window.__t("حذف")}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
            >
              {window.__t("إلغاء")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export const AdminDashboard = ({ onNavigate }: { onNavigate?: (page: string) => void }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [visitorStats, setVisitorStats] = useState<VisitorStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [visitsChartData, setVisitsChartData] = useState<VisitorChartPoint[]>([]);
  const [registrationsChartData, setRegistrationsChartData] = useState<RegistrationChartPoint[]>([]);
  const [advancedStats, setAdvancedStats] = useState<{
    revenueTotal: number;
    revenueThisMonth: number;
    newCasesThisMonth: number;
    totalContracts: number;
    planBreakdown: { basic: number; pro: number; enterprise: number };
  } | null>(null);
  const [subscriptionActivities, setSubscriptionActivities] = useState<any[]>([]);
  const [showActivityDeleteConfirm, setShowActivityDeleteConfirm] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  const [isDeletingActivity, setIsDeletingActivity] = useState(false);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);

  useEffect(() => {
    loadData();
    loadVisitorStats();
    loadAdvancedStats();
    loadSubscriptionActivities();
    const interval = setInterval(() => {
      loadVisitorStats();
      loadAdvancedStats();
      loadSubscriptionActivities();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const usersData = await storageService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading admin users:', error);
      setUsers([]);
    }

  };

  const loadSubscriptionActivities = async () => {
    try {
      const activities = await storageService.getSubscriptionActivities(1, 10, 30);
      setSubscriptionActivities(activities);
    } catch (error) {
      console.error('Error loading subscription activities:', error);
      setSubscriptionActivities([]);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    setIsDeletingActivity(true);
    try {
      const success = await storageService.deleteSubscriptionActivity(id);
      if (success) {
        await loadSubscriptionActivities();
        setShowActivityDeleteConfirm(false);
      } else {
        alert(window.__t("حدث خطأ أثناء حذف العملية"));
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
    } finally {
      setIsDeletingActivity(false);
    }
  };

  const loadVisitorStats = async () => {
    try {
      setLoadingStats(true);
      const [stats, visitsData, regsData] = await Promise.all([
        visitorService.getVisitorStats(),
        visitorService.getVisitsChartData(14),
        visitorService.getRegistrationsChartData(6)
      ]);
      setVisitorStats(stats);
      setVisitsChartData(visitsData);
      setRegistrationsChartData(regsData);
    } catch (error) {
      console.error('Error loading visitor stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadAdvancedStats = async () => {
    try {
      const token = storageService.getAccessToken();
      const response = await fetch('http://localhost:3001/api/admin/stats', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error('Failed to load admin stats');
      const data = await response.json();
      const stats = data.advancedStats;
      setAdvancedStats({
        revenueTotal: stats.revenueTotal || 0,
        revenueThisMonth: stats.revenueThisMonth || 0,
        newCasesThisMonth: stats.newCasesThisMonth || 0,
        totalContracts: stats.totalContracts || 0,
        planBreakdown: {
          basic: stats.planBreakdown?.basic || 0,
          pro: stats.planBreakdown?.pro || 0,
          enterprise: stats.planBreakdown?.enterprise || 0,
        },
      });
    } catch (e) {
      console.error('Error loading advanced stats:', e);
    }
  };

  const lawyers = users.filter(u => u.role === UserRole.LAWYER);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">{window.__t("لوحة تحكم المسؤول")}</h2>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Users → Navigate to Users page */}
        <div
          onClick={() => onNavigate?.('admin-users')}
          className="bg-[#1e1b4b] text-white p-6 rounded-2xl shadow-xl border border-white/5 relative overflow-hidden group cursor-pointer hover:scale-[1.04] hover:shadow-2xl active:scale-[0.97] transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-2xl rounded-full -mr-10 -mt-10 group-hover:bg-orange-500/20 transition-all duration-500"></div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">{window.__t("إجمالي المستخدمين")}</p>
            <UsersIcon className="w-5 h-5 text-slate-500 group-hover:text-orange-400 transition-colors duration-300" />
          </div>
          <h3 className="text-4xl font-black tracking-tight">{users.length}</h3>
          <p className="text-orange-400/70 text-[10px] mt-3 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">{window.__t("عرض التفاصيل")} →</p>
        </div>

        {/* Active Lawyers → Navigate to Users page */}
        <div
          onClick={() => onNavigate?.('admin-users')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group cursor-pointer hover:scale-[1.04] hover:shadow-xl hover:border-indigo-200 active:scale-[0.97] transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">{window.__t("المحامين النشطين")}</p>
            <Scale className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors duration-300" />
          </div>
          <h3 className="text-4xl font-black text-[#1e1b4b] tracking-tight">{lawyers.length}</h3>
          <p className="text-indigo-400 text-[10px] mt-3 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">{window.__t("عرض التفاصيل")} →</p>
        </div>

        {/* Recent Upgrades → Scroll to subscription activities */}
        <div
          onClick={() => document.getElementById('subscription-activities')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group cursor-pointer hover:scale-[1.04] hover:shadow-xl hover:border-green-200 active:scale-[0.97] transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">{window.__t("عمليات الترقية الحديثة")}</p>
            <ArrowUpCircle className="w-5 h-5 text-slate-300 group-hover:text-green-500 transition-colors duration-300" />
          </div>
          <h3 className="text-4xl font-black text-[#1e1b4b] tracking-tight">{subscriptionActivities.length}</h3>
          <p className="text-green-500 text-[10px] mt-3 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">{window.__t("عرض السجل")} ↓</p>
        </div>

        {/* Platform Visitors → Scroll to visitor stats */}
        <div
          onClick={() => document.getElementById('visitor-stats')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="bg-[#1e1b4b] text-white p-6 rounded-2xl shadow-xl border border-white/5 relative overflow-hidden group cursor-pointer hover:scale-[1.04] hover:shadow-2xl active:scale-[0.97] transition-all duration-300"
        >
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-orange-500/10 blur-2xl rounded-full group-hover:bg-orange-500/25 transition-all duration-500"></div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">{window.__t("زوار المنصة (اليوم)")}</p>
            <TrendingUp className="w-5 h-5 text-slate-500 group-hover:text-orange-400 transition-colors duration-300" />
          </div>
          <h3 className="text-4xl font-black tracking-tight">
            {loadingStats ? <Spinner /> : visitorStats?.visitsToday || 0}
          </h3>
          <p className="text-orange-400/70 text-[10px] mt-2 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
            {window.__t("إجمالي:")} {visitorStats?.totalVisits || 0} · {window.__t("عرض التفاصيل")} ↓
          </p>
        </div>

        {/* Monthly Revenue → Toggle advanced metrics */}
        <div
          onClick={() => {
            setShowAdvancedMetrics(prev => !prev);
            if (!showAdvancedMetrics) {
              setTimeout(() => {
                document.getElementById('advanced-metrics')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }
          }}
          className={`bg-white p-6 rounded-2xl shadow-sm border ${showAdvancedMetrics ? 'border-orange-500 shadow-orange-100' : 'border-slate-100 hover:border-orange-200 hover:shadow-xl'} group cursor-pointer hover:scale-[1.04] active:scale-[0.97] transition-all duration-300`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">{window.__t("إيرادات الشهر")}</p>
            <DollarSign className={`w-5 h-5 transition-colors duration-300 ${showAdvancedMetrics ? 'text-orange-500' : 'text-slate-300 group-hover:text-orange-500'}`} />
          </div>
          <h3 className="text-3xl font-black text-orange-600 tracking-tight">{advancedStats?.revenueThisMonth?.toFixed(2) ?? '0'} <span className="text-sm font-bold">TND</span></h3>
          <p className="text-orange-400 text-[10px] mt-3 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
            {showAdvancedMetrics ? window.__t("إخفاء التفاصيل") + ' ↑' : window.__t("عرض التفاصيل") + ' ↓'}
          </p>
        </div>
      </div>

      {/* Advanced Metrics */}
      {advancedStats && showAdvancedMetrics && (
        <div id="advanced-metrics" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 scroll-mt-6">
          <div className="bg-[#1e1b4b] text-white p-6 rounded-2xl shadow-xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-2xl rounded-full -mr-10 -mt-10"></div>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-2">{window.__t("إجمالي الإيرادات")}</p>
            <h3 className="text-3xl font-black tracking-tight text-orange-400">{advancedStats.revenueTotal.toFixed(2)} {window.__t("د.ت")}</h3>
          </div>
          <div className="bg-[#1e1b4b] text-white p-6 rounded-2xl shadow-xl border border-white/5 relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-blue-500/5 blur-2xl rounded-full"></div>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-2">{window.__t("قضايا هذا الشهر")}</p>
            <h3 className="text-3xl font-black tracking-tight">{advancedStats.newCasesThisMonth}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-2">{window.__t("إجمالي العقود")}</p>
            <h3 className="text-3xl font-black text-[#1e1b4b] tracking-tight">{advancedStats.totalContracts}</h3>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-gray-500 text-sm mb-2">{window.__t("توزيع الباقات")}</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>{window.__t("البداية")}</span><span className="font-bold text-blue-600">{advancedStats.planBreakdown.basic}</span></div>
              <div className="flex justify-between"><span>{window.__t("المحترف")}</span><span className="font-bold text-gold-600">{advancedStats.planBreakdown.pro}</span></div>
              <div className="flex justify-between"><span>{window.__t("المكتب")}</span><span className="font-bold text-purple-600">{advancedStats.planBreakdown.enterprise}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Visitor Statistics Card */}
      {visitorStats && (
        <div id="visitor-stats" className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mt-6 scroll-mt-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            {window.__t("📊 إحصائيات الزوار والتسجيلات")}
            <button
              onClick={loadVisitorStats}
              className="text-slate-400 hover:text-blue-600 p-2 rounded hover:bg-blue-50 transition"
              title={window.__t("تحديث")}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 group hover:border-orange-200 transition-colors">
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">{window.__t("إجمالي الزيارات")}</p>
              <p className="text-2xl font-black text-[#1e1b4b] tracking-tight">{visitorStats.totalVisits.toLocaleString()}</p>
            </div>
            <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/10 group hover:border-orange-500/30 transition-colors">
              <p className="text-orange-600 text-[10px] uppercase tracking-widest font-bold mb-1">{window.__t("زوار فريدون")}</p>
              <p className="text-2xl font-black text-orange-900 tracking-tight">{visitorStats.uniqueVisitors.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">{window.__t("هذا الأسبوع")}</p>
              <p className="text-2xl font-black text-[#1e1b4b] tracking-tight">{visitorStats.visitsThisWeek.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">{window.__t("هذا الشهر")}</p>
              <p className="text-2xl font-black text-[#1e1b4b] tracking-tight">{visitorStats.visitsThisMonth.toLocaleString()}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-slate-700 mb-3">{window.__t("الزيارات (آخر 14 يوم)")}</h4>
              <div className="h-56">
                {visitsChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={visitsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">{window.__t("لا توجد بيانات")}</div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-slate-700 mb-3">{window.__t("التسجيلات (آخر 6 أشهر)")}</h4>
              <div className="h-56">
                {registrationsChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={registrationsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">{window.__t("لا توجد بيانات")}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div id="subscription-activities" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-2 scroll-mt-6">
            <div className="px-6 py-5 border-b border-slate-100 bg-[#1e1b4b] flex justify-between items-center">
              <h3 className="font-bold text-white text-sm uppercase tracking-widest">{window.__t("آخر عمليات ترقية الاشتراك")}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-end">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-3">{window.__t("المستخدم")}</th>
                    <th className="px-6 py-3">{window.__t("البريد")}</th>
                    <th className="px-6 py-3">{window.__t("الباقة")}</th>
                    <th className="px-6 py-3">{window.__t("المبلغ")}</th>
                    <th className="px-6 py-3">{window.__t("العملية")}</th>
                    <th className="px-6 py-3">{window.__t("التاريخ")}</th>
                    <th className="px-6 py-3">{window.__t("إجراءات")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscriptionActivities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-slate-800">{activity.user_name || '-'}</td>
                      <td className="px-6 py-4 text-slate-500">{activity.user_email || '-'}</td>
                      <td className="px-6 py-4">{activity.plan_name || '-'}</td>
                      <td className="px-6 py-4">{activity.amount ? `${activity.amount} TND` : '-'}</td>
                      <td className="px-6 py-4">{activity.event_type}</td>
                      <td className="px-6 py-4">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleString((document.documentElement.lang === 'ar' ? 'ar-TN' : 'fr-FR')) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => {
                            setActivityToDelete(activity.id);
                            setShowActivityDeleteConfirm(true);
                          }}
                          className="text-red-500 hover:text-red-700 text-xs font-bold"
                        >
                          {window.__t("حذف")}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {subscriptionActivities.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">{window.__t("لا توجد ترقيات حديثة")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-2">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{window.__t("قائمة المحامين")}</h3>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm text-end">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-3">{window.__t("الاسم")}</th>
                    <th className="px-6 py-3">{window.__t("البريد")}</th>
                    <th className="px-6 py-3">{window.__t("الباقة")}</th>
                    <th className="px-6 py-3">{window.__t("الحالة")}</th>
                    <th className="px-6 py-3">{window.__t("إجراءات")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lawyers.map(user => (
                    <UserRow 
                      key={user.id} 
                      user={user} 
                      onUpdate={loadData}
                      onDelete={loadData}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div>

      {/* Delete Activity Confirmation Modal */}
      <Modal isOpen={showActivityDeleteConfirm} onClose={() => setShowActivityDeleteConfirm(false)} title={window.__t("تأكيد حذف العملية")}>
        <div className="space-y-4">
          <p className="text-red-600">{window.__t("هل أنت متأكد من حذف هذه العملية من السجل؟")}</p>
          <div className="flex space-x-3 space-x-reverse">
            <button
              onClick={() => activityToDelete && handleDeleteActivity(activityToDelete)}
              disabled={isDeletingActivity}
              className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isDeletingActivity ? window.__t("جاري الحذف...") : window.__t("حذف")}
            </button>
            <button
              onClick={() => setShowActivityDeleteConfirm(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
            >
              {window.__t("إلغاء")}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
