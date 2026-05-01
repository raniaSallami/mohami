import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User, UserRole } from '../types';
import { Modal, Spinner } from '../components/UI';
import { emailService } from '../services/emailService';
import { pool } from '../services/db';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<{ cases: number; contracts: number; events: number } | null>(null);
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('basic');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setSelectedPlan(selectedUser.subscriptionPlan || (selectedUser as any).subscription_plan || 'basic');
      loadUserStats(selectedUser.id);
    } else {
      setUserStats(null);
    }
  }, [selectedUser]);

  const loadUsers = async () => {
    setLoading(true);
    const data = await storageService.getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  const loadUserStats = async (userId: string) => {
    try {
      const [casesRes, contractsRes, eventsRes] = await Promise.all([
        pool.query('SELECT COUNT(*) as c FROM cases WHERE user_id = $1', [userId]),
        pool.query('SELECT COUNT(*) as c FROM contracts WHERE user_id = $1', [userId]),
        pool.query('SELECT COUNT(*) as c FROM events WHERE user_id = $1', [userId])
      ]);
      setUserStats({
        cases: parseInt(casesRes.rows[0]?.c || '0'),
        contracts: parseInt(contractsRes.rows[0]?.c || '0'),
        events: parseInt(eventsRes.rows[0]?.c || '0')
      });
    } catch {
      setUserStats(null);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedUser) return;
    setUpgradeLoading(true);
    try {
      await storageService.upgradeUserPlan(selectedUser.id, selectedPlan as any);
      const planNames: Record<string, string> = { basic: window.__t("البداية"), pro: window.__t("المحترف"), enterprise: window.__t("المكتب") };
      await emailService.sendPlanUpgradeEmail(selectedUser.email, selectedUser.name, planNames[selectedPlan] || selectedPlan);
      setSelectedUser({ ...selectedUser, subscriptionPlan: selectedPlan as any, subscriptionStatus: 'active' });
      loadUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setUpgradeLoading(false);
    }
  };

  const filtered = users.filter((u) => {
    const uPlan = u.subscriptionPlan || (u as any).subscription_plan || 'basic';
    const uStatus = u.subscriptionStatus || (u as any).subscription_status || 'active';
    const matchPlan = filterPlan === 'all' || uPlan === filterPlan;
    const matchStatus = filterStatus === 'all' || uStatus === filterStatus;
    const matchSearch = !search || 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchPlan && matchStatus && matchSearch;
  });

  const planLabel = (p?: string) => ({ basic: window.__t("البداية"), pro: window.__t("المحترف"), enterprise: window.__t("المكتب") }[p || 'basic'] || p);
  const statusLabel = (s?: string) => ({ active: window.__t("نشط"), pending_approval: window.__t("قيد المراجعة"), expired: window.__t("منتهي") }[s || 'active'] || s);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">{window.__t("المستخدمين")}</h2>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder={window.__t("بحث بالاسم أو البريد...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
        />
        <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="px-4 py-2 border rounded-lg">
          <option value="all">{window.__t("جميع الباقات")}</option>
          <option value="basic">{window.__t("البداية")}</option>
          <option value="pro">{window.__t("المحترف")}</option>
          <option value="enterprise">{window.__t("المكتب")}</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border rounded-lg">
          <option value="all">{window.__t("جميع الحالات")}</option>
          <option value="active">{window.__t("نشط")}</option>
          <option value="pending_approval">{window.__t("قيد المراجعة")}</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-end">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-3">{window.__t("الاسم")}</th>
                  <th className="px-6 py-3">{window.__t("البريد")}</th>
                  <th className="px-6 py-3">{window.__t("الباقة")}</th>
                  <th className="px-6 py-3">{window.__t("الحالة")}</th>
                  <th className="px-6 py-3">{window.__t("الدور")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const uPlan = u.subscriptionPlan || (u as any).subscription_plan || 'basic';
                  const uStatus = u.subscriptionStatus || (u as any).subscription_status || 'active';
                  return (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                    <td className="px-6 py-4 text-slate-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        uPlan === 'basic' ? 'bg-gray-100' :
                        uPlan === 'pro' ? 'bg-purple-100 text-purple-700' : 'bg-gold-100 text-gold-800'
                      }`}>
                        {planLabel(uPlan)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={uStatus === 'pending_approval' ? 'text-orange-600' : 'text-green-600'}>
                        {statusLabel(uStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4">{u.role === UserRole.ADMIN ? window.__t("مدير") : window.__t("محامي")}</td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">{window.__t("لا يوجد مستخدمون matching الفلاتر")}</div>
        )}
      </div>

      <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title={window.__t("تفاصيل المستخدم")}>
        {selectedUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{window.__t("الاسم")}</label>
                <p className="font-medium">{selectedUser.name}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{window.__t("البريد")}</label>
                <p className="font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{window.__t("الباقة")}</label>
                <p>{planLabel(selectedUser.subscriptionPlan || (selectedUser as any).subscription_plan || 'basic')}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{window.__t("الحالة")}</label>
                <p>{statusLabel(selectedUser.subscriptionStatus || (selectedUser as any).subscription_status || 'active')}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">ID</label>
                <p className="text-xs font-mono text-gray-600">{selectedUser.id}</p>
              </div>
              {selectedUser.account_type && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{window.__t("نوع الحساب")}</label>
                  <p className="font-medium">{selectedUser.account_type === 'lawyer' ? window.__t("محامي") : selectedUser.account_type === 'student' ? window.__t("طالب") : window.__t("مكتب")}</p>
                </div>
              )}
              {selectedUser.bar_number && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{window.__t("رقم البطاقة")}</label>
                  <p className="font-medium">{selectedUser.bar_number}</p>
                </div>
              )}
              {selectedUser.cabinet_name && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{window.__t("اسم المكتب")}</label>
                  <p className="font-medium">{selectedUser.cabinet_name}</p>
                </div>
              )}
              {selectedUser.university && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{window.__t("الجامعة")}</label>
                  <p className="font-medium">{selectedUser.university}</p>
                </div>
              )}
              {selectedUser.organizationOwnerId && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{window.__t("عضو فريق (المكتب)")}</label>
                  <p className="text-xs">{window.__t("نعم")}</p>
                </div>
              )}
            </div>

            {userStats && (
              <div className="border-t pt-4">
                <h4 className="font-bold text-slate-700 mb-2">{window.__t("إحصائيات")}</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-blue-700">{userStats.cases}</p>
                    <p className="text-xs text-blue-600">{window.__t("قضايا")}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-purple-700">{userStats.contracts}</p>
                    <p className="text-xs text-purple-600">{window.__t("عقود")}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">{userStats.events}</p>
                    <p className="text-xs text-green-600">{window.__t("مواعيد")}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedUser.role !== UserRole.ADMIN && (
              <div className="border-t pt-4">
                <h4 className="font-bold text-slate-700 mb-2">{window.__t("ترقية الباقة")}</h4>
                <div className="flex gap-2">
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="basic">{window.__t("البداية")}</option>
                    <option value="pro">{window.__t("المحترف")}</option>
                    <option value="enterprise">{window.__t("المكتب")}</option>
                  </select>
                  <button
                    onClick={handleUpgrade}
                    disabled={upgradeLoading || selectedPlan === (selectedUser.subscriptionPlan || (selectedUser as any).subscription_plan || 'basic')}
                    className="px-4 py-2 bg-gold-500 text-slate-900 rounded-lg font-bold hover:bg-gold-400 disabled:opacity-50"
                  >
                    {upgradeLoading ? <Spinner /> : window.__t("ترقية")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
