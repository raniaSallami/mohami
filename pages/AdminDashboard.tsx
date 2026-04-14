
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User, UserRole, Invoice } from '../types';
import { Modal, Spinner, Toast } from '../components/UI';
import { notificationService } from '../services/notificationService';
import { emailService } from '../services/emailService';
import { visitorService, VisitorStats, VisitorChartPoint, RegistrationChartPoint } from '../services/visitorService';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// User Row Component with Edit/Delete/Upgrade
const UserRow: React.FC<{ user: User; onUpdate: () => void; onDelete: () => void }> = ({ user, onUpdate, onDelete }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [selectedPlan, setSelectedPlan] = useState(user.subscriptionPlan || 'basic');
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
            user.subscriptionPlan === 'basic' ? 'bg-gray-100' : 
            user.subscriptionPlan === 'pro' ? 'bg-purple-100 text-purple-700' : 
            'bg-gold-100 text-gold-800'
          }`}>
            {user.subscriptionPlan === 'basic' ? window.__t("البداية") : 
             user.subscriptionPlan === 'pro' ? window.__t("المحترف") : window.__t("المكتب")}
          </span>
        </td>
        <td className="px-6 py-4">
          {user.subscriptionStatus === 'pending_approval' ? (
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
              ✏️
            </button>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="text-green-600 hover:text-green-800 text-xs px-2 py-1 rounded hover:bg-green-50 transition"
              title={window.__t("ترقية الباقة")}
            >
              ⬆️
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50 transition"
              title={window.__t("حذف")}
            >
              🗑️
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
            disabled={loading || selectedPlan === user.subscriptionPlan}
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

export const AdminDashboard = ({ view = 'overview' }: { view?: 'overview' | 'users' }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
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

  useEffect(() => {
    loadData();
    loadVisitorStats();
    loadAdvancedStats();
    const interval = setInterval(() => {
      loadVisitorStats();
      loadAdvancedStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const usersData = await storageService.getAllUsers();
    setUsers(usersData);
    const invoicesData = await storageService.getAllPendingInvoices();
    setPendingInvoices(invoicesData);
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
      const { pool } = await import('../services/db');
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const [revenueRes, monthRevRes, newCasesRes, planRes, contractsRes] = await Promise.all([
        pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'paid'"),
        pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'paid' AND date >= $1", [monthStart]),
        pool.query("SELECT COUNT(*) as c FROM cases WHERE date_created >= $1", [monthStart]),
        pool.query("SELECT subscription_plan, COUNT(*) as c FROM users WHERE role != 'ADMIN' GROUP BY subscription_plan"),
        pool.query("SELECT COUNT(*) as c FROM contracts")
      ]);
      const planMap: Record<string, number> = { basic: 0, pro: 0, enterprise: 0 };
      (planRes.rows || []).forEach((r: any) => { planMap[r.subscription_plan || 'basic'] = parseInt(r.c) || 0; });
      setAdvancedStats({
        revenueTotal: parseFloat(revenueRes.rows[0]?.total || '0'),
        revenueThisMonth: parseFloat(monthRevRes.rows[0]?.total || '0'),
        newCasesThisMonth: parseInt(newCasesRes.rows[0]?.c || '0'),
        totalContracts: parseInt(contractsRes.rows[0]?.c || '0'),
        planBreakdown: planMap
      });
    } catch (e) {
      console.error('Error loading advanced stats:', e);
    }
  };

  const handleApprove = async (id: string) => {
      if(!confirm(window.__t("تأكيد تفعيل الباقة لهذا المستخدم؟"))) return;
      setLoading(true);
      try {
      await storageService.approveInvoice(id);
        // Send notification to admin about the action
        const { notificationService } = await import('../services/notificationService');
        const invoice = pendingInvoices.find(inv => inv.id === id);
        if (invoice) {
          await notificationService.createNotification(
            'admin-1', // Admin user ID
            'admin',
            window.__t("تم تفعيل اشتراك"),
            `تم تفعيل باقة ${invoice.planName} للمستخدم ${invoice.userName}`,
            '/admin-dashboard',
            { invoiceId: id, userId: invoice.userEmail }
          );
          
          // Send upgrade email to user
          try {
            const planNames: Record<string, string> = {
              basic: window.__t("البداية"),
              pro: window.__t("المحترف"),
              enterprise: window.__t("المكتب")
            };
            const planName = planNames[invoice.planName] || invoice.planName;
            await emailService.sendPlanUpgradeEmail(invoice.userEmail || '', invoice.userName || '', planName);
          } catch (emailError) {
            console.error('Failed to send upgrade email:', emailError);
          }
        }
      await loadData();
      } catch (error) {
        console.error('Error approving invoice:', error);
      } finally {
      setLoading(false);
      setSelectedReceipt(null);
      }
  };

  const handleReject = async (id: string) => {
      if(!confirm(window.__t("رفض هذا الطلب؟"))) return;
      setLoading(true);
      try {
      await storageService.rejectInvoice(id);
        // Send notification to admin about the action
        const { notificationService } = await import('../services/notificationService');
        const invoice = pendingInvoices.find(inv => inv.id === id);
        if (invoice) {
          await notificationService.createNotification(
            'admin-1', // Admin user ID
            'admin',
            window.__t("تم رفض طلب تفعيل"),
            `تم رفض طلب تفعيل باقة ${invoice.planName} للمستخدم ${invoice.userName}`,
            '/admin-dashboard',
            { invoiceId: id, userId: invoice.userEmail }
          );
        }
      await loadData();
      } catch (error) {
        console.error('Error rejecting invoice:', error);
      } finally {
      setLoading(false);
      }
  };

  const lawyers = users.filter(u => u.role === UserRole.LAWYER);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">{window.__t("لوحة تحكم المسؤول")}</h2>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
          <p className="text-slate-400 text-sm mb-1">{window.__t("إجمالي المستخدمين")}</p>
          <h3 className="text-4xl font-bold">{users.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-gray-500 text-sm mb-1">{window.__t("المحامين النشطين")}</p>
          <h3 className="text-4xl font-bold text-slate-800">{lawyers.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-gray-500 text-sm mb-1">{window.__t("طلبات التفعيل")}</p>
          <h3 className={`text-4xl font-bold ${pendingInvoices.length > 0 ? 'text-orange-500' : 'text-slate-800'}`}>{pendingInvoices.length}</h3>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <p className="text-blue-100 text-sm mb-1">{window.__t("زوار المنصة (اليوم)")}</p>
          <h3 className="text-4xl font-bold">
            {loadingStats ? <Spinner /> : visitorStats?.visitsToday || 0}
          </h3>
          <p className="text-blue-100 text-xs mt-2">
            {window.__t("إجمالي:")} {visitorStats?.totalVisits || 0} {window.__t("| فريد:")} {visitorStats?.uniqueVisitors || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-gray-500 text-sm mb-1">{window.__t("إيرادات الشهر")}</p>
          <h3 className="text-4xl font-bold text-slate-800">{advancedStats?.revenueThisMonth?.toFixed(2) ?? '0'} TND</h3>
        </div>
      </div>

      {/* Advanced Metrics */}
      {advancedStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg">
            <p className="text-emerald-100 text-sm mb-1">{window.__t("إجمالي الإيرادات")}</p>
            <h3 className="text-3xl font-bold">{advancedStats.revenueTotal.toFixed(2)} {window.__t("د.ت")}</h3>
          </div>
          <div className="bg-gradient-to-br from-violet-500 to-violet-600 text-white p-6 rounded-xl shadow-lg">
            <p className="text-violet-100 text-sm mb-1">{window.__t("قضايا هذا الشهر")}</p>
            <h3 className="text-3xl font-bold">{advancedStats.newCasesThisMonth}</h3>
          </div>
          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white p-6 rounded-xl shadow-lg">
            <p className="text-cyan-100 text-sm mb-1">{window.__t("إجمالي العقود")}</p>
            <h3 className="text-3xl font-bold">{advancedStats.totalContracts}</h3>
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mt-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            {window.__t("📊 إحصائيات الزوار والتسجيلات")}
            <button
              onClick={loadVisitorStats}
              className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition"
              title={window.__t("تحديث")}
            >
              🔄
            </button>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-blue-600 text-sm mb-1">{window.__t("إجمالي الزيارات")}</p>
              <p className="text-2xl font-bold text-blue-900">{visitorStats.totalVisits.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-green-600 text-sm mb-1">{window.__t("زوار فريدون")}</p>
              <p className="text-2xl font-bold text-green-900">{visitorStats.uniqueVisitors.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <p className="text-purple-600 text-sm mb-1">{window.__t("هذا الأسبوع")}</p>
              <p className="text-2xl font-bold text-purple-900">{visitorStats.visitsThisWeek.toLocaleString()}</p>
            </div>
            <div className="bg-gold-50 p-4 rounded-lg border border-gold-200">
              <p className="text-gold-700 text-sm mb-1">{window.__t("هذا الشهر")}</p>
              <p className="text-2xl font-bold text-gold-900">{visitorStats.visitsThisMonth.toLocaleString()}</p>
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
          
          {/* Financial Requests Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-2">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-orange-50">
                <h3 className="font-bold text-orange-800">{window.__t("طلبات تفعيل الاشتراك (تحويل بنكي)")}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-end">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="px-6 py-3">{window.__t("المحامي")}</th>
                            <th className="px-6 py-3">{window.__t("الباقة المطلوبة")}</th>
                            <th className="px-6 py-3">{window.__t("المبلغ")}</th>
                            <th className="px-6 py-3">{window.__t("التاريخ")}</th>
                            <th className="px-6 py-3">{window.__t("الوصل")}</th>
                            <th className="px-6 py-3">{window.__t("إجراءات")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {pendingInvoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-bold">{inv.userName}</div>
                                    <div className="text-xs text-gray-500">{inv.userEmail}</div>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-800">{inv.planName}</td>
                                <td className="px-6 py-4">{inv.amount} TND</td>
                                <td className="px-6 py-4">{new Date(inv.date).toLocaleDateString((document.documentElement.lang === 'ar' ? 'ar-TN' : 'fr-FR'))}</td>
                                <td className="px-6 py-4">
                                    <button 
                                      onClick={() => setSelectedReceipt(inv.receiptData || null)}
                                      className="text-blue-600 hover:underline text-xs"
                                    >
                                        {window.__t("معاينة الصورة")}
                                    </button>
                                </td>
                                <td className="px-6 py-4 flex space-x-2 space-x-reverse">
                                    <button onClick={() => handleApprove(inv.id)} className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition">{window.__t("تفعيل")}</button>
                                    <button onClick={() => handleReject(inv.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition">{window.__t("رفض")}</button>
                                </td>
                            </tr>
                        ))}
                        {pendingInvoices.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-400">{window.__t("لا توجد طلبات معلقة")}</td></tr>
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

      {/* Receipt Modal */}
      <Modal isOpen={!!selectedReceipt} onClose={() => setSelectedReceipt(null)} title={window.__t("صورة وصل التحويل")}>
          <div className="flex justify-center bg-gray-100 p-4 rounded">
              {selectedReceipt && (
                  <img src={`data:image/png;base64,${selectedReceipt}`} alt="Receipt" className="max-w-full max-h-[60vh] object-contain" />
              )}
          </div>
      </Modal>
    </div>
  );
};
