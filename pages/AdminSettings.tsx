import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User, PLAN_LIMITS } from '../types';
import { Modal, Toast, Spinner } from '../components/UI';

interface SystemSettings {
  appName: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  geminiApiKey: string;
  notificationPollingInterval: number;
}

interface PlanPricing {
  pro: number;
  enterprise: number;
}

export const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'plans' | 'notifications' | 'security' | 'stats'>('general');
  
  // General Settings
  const [settings, setSettings] = useState<SystemSettings>({
    appName: window.__t("المحامي"),
    maintenanceMode: false,
    allowRegistrations: true,
    geminiApiKey: '',
    notificationPollingInterval: 3000
  });

  // Plan Pricing
  const [pricing, setPricing] = useState<PlanPricing>({
    pro: 59,
    enterprise: 199
  });

  // Plan Limits
  const [planLimits, setPlanLimits] = useState(PLAN_LIMITS);

  // Statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCases: 0,
    totalContracts: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    loadSettings();
    loadStatistics();
  }, []);

  const loadSettings = async () => {
    try {
      // Load from database
      const savedSettings = await storageService.getSystemSetting('general_settings');
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...savedSettings }));
      }
      
      const savedPricing = await storageService.getPlanPricing();
      if (savedPricing) {
        setPricing(savedPricing);
      }

      const savedLimits = await storageService.getPlanLimits();
      if (savedLimits) {
        setPlanLimits(savedLimits);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const users = await storageService.getAllUsers();
      const cases = await storageService.getCases();
      
      // Get all contracts from database
      const { pool } = await import('../services/db');
      const contractsResult = await pool.query('SELECT COUNT(*) as count FROM contracts');
      const revenueResult = await pool.query(
        "SELECT SUM(amount) as total FROM invoices WHERE status = 'paid'"
      );
      
      setStats({
        totalUsers: users.length,
        totalCases: cases.length,
        totalContracts: parseInt(contractsResult.rows[0]?.count || '0'),
        totalRevenue: parseFloat(revenueResult.rows[0]?.total || '0')
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleSaveGeneral = async () => {
    setLoading(true);
    try {
      await storageService.setSystemSetting('general_settings', settings);
      setNotification({ msg: window.__t("تم حفظ الإعدادات العامة بنجاح"), type: 'success' });
    } catch (error) {
      setNotification({ msg: window.__t("حدث خطأ أثناء الحفظ"), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePricing = async () => {
    setLoading(true);
    try {
      await storageService.setSystemSetting('pricing', pricing);
      setNotification({ msg: window.__t("تم حفظ الأسعار بنجاح"), type: 'success' });
    } catch (error) {
      setNotification({ msg: window.__t("حدث خطأ أثناء الحفظ"), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLimits = async () => {
    setLoading(true);
    try {
      await storageService.setSystemSetting('plan_limits', planLimits);
      setNotification({ msg: window.__t("تم حفظ حدود الخطط بنجاح"), type: 'success' });
    } catch (error) {
      setNotification({ msg: window.__t("حدث خطأ أثناء الحفظ"), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const users = await storageService.getAllUsers();
      const cases = await storageService.getCases();
      
      // Get all contracts from database
      const { pool } = await import('../services/db');
      const contractsResult = await pool.query('SELECT * FROM contracts');
      const contracts = contractsResult.rows.map(row => ({
        id: row.id,
        title: row.title,
        type: row.type,
        parties: row.parties,
        content: row.content,
        dateCreated: row.date_created
      }));
      
      const data = {
        exportDate: new Date().toISOString(),
        users,
        cases,
        contracts
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setNotification({ msg: window.__t("تم تصدير البيانات بنجاح"), type: 'success' });
    } catch (error) {
      setNotification({ msg: window.__t("حدث خطأ أثناء التصدير"), type: 'error' });
    }
  };

  const TabButton = ({ id, label, icon }: { id: string, label: string, icon: string }) => (
    <button
      onClick={() => setActiveTab(id as any)}
      className={`flex items-center space-x-2 space-x-reverse px-6 py-3 rounded-lg transition-colors ${
        activeTab === id
          ? 'bg-slate-900 text-white'
          : 'bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">{window.__t("إعدادات النظام")}</h2>
          <p className="text-gray-500 mt-1">{window.__t("إدارة إعدادات المنصة والخطط والمستخدمين")}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 bg-gray-50 p-2 rounded-xl">
        <TabButton id="general" label={window.__t("الإعدادات العامة")} icon="⚙️" />
        <TabButton id="plans" label={window.__t("الخطط والأسعار")} icon="💰" />
        <TabButton id="notifications" label={window.__t("الإشعارات")} icon="🔔" />
        <TabButton id="security" label={window.__t("الأمان")} icon="🔒" />
        <TabButton id="stats" label={window.__t("الإحصائيات")} icon="📊" />
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 border-b pb-3">{window.__t("الإعدادات العامة")}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{window.__t("اسم التطبيق")}</label>
              <input
                type="text"
                value={settings.appName}
                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700">{window.__t("وضع الصيانة")}</label>
                <p className="text-xs text-gray-500 mt-1">{window.__t("إيقاف المنصة مؤقتاً للصيانة")}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700">{window.__t("السماح بالتسجيل")}</label>
                <p className="text-xs text-gray-500 mt-1">{window.__t("السماح للمستخدمين الجدد بالتسجيل")}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowRegistrations}
                  onChange={(e) => setSettings({ ...settings, allowRegistrations: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{window.__t("مفتاح API للذكاء الاصطناعي")}</label>
              <input
                type="password"
                value={settings.geminiApiKey}
                onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                placeholder={window.__t("أدخل مفتاح API")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">{window.__t("يستخدم للذكاء الاصطناعي وتحليل الوثائق")}</p>
            </div>
          </div>

          <button
            onClick={handleSaveGeneral}
            disabled={loading}
            className="w-full md:w-auto px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center space-x-2 space-x-reverse"
          >
            {loading ? <Spinner /> : null}
            <span>{window.__t("حفظ الإعدادات")}</span>
          </button>
        </div>
      )}

      {/* Plans & Pricing */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Pricing */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6">{window.__t("أسعار الخطط")}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-800">{window.__t("باقة المحترف")}</h4>
                  <span className="text-2xl font-bold text-gold-600">Pro</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{window.__t("السعر (د.ت)")}</label>
                    <input
                      type="number"
                      value={pricing.pro}
                      onChange={(e) => setPricing({ ...pricing, pro: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-800">{window.__t("باقة المكتب")}</h4>
                  <span className="text-2xl font-bold text-purple-600">Enterprise</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{window.__t("السعر (د.ت)")}</label>
                    <input
                      type="number"
                      value={pricing.enterprise}
                      onChange={(e) => setPricing({ ...pricing, enterprise: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSavePricing}
              disabled={loading}
              className="mt-6 w-full md:w-auto px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
            >
              {window.__t("حفظ الأسعار")}
            </button>
          </div>

          {/* Plan Limits */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6">{window.__t("حدود الخطط")}</h3>
            
            <div className="space-y-6">
              {Object.entries(planLimits).map(([plan, limits]) => (
                <div key={plan} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-slate-800 mb-4 capitalize">{plan}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">{window.__t("عدد القضايا")}</label>
                      <input
                        type="number"
                        value={limits.cases}
                        onChange={(e) => setPlanLimits({
                          ...planLimits,
                          [plan]: { ...limits, cases: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">{window.__t("عدد العقود")}</label>
                      <input
                        type="number"
                        value={limits.contracts}
                        onChange={(e) => setPlanLimits({
                          ...planLimits,
                          [plan]: { ...limits, contracts: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">{window.__t("حد رفع الملف (MB)")}</label>
                      <input
                        type="number"
                        value={(limits as any).maxFileSizeMB ?? 100}
                        onChange={(e) => setPlanLimits({
                          ...planLimits,
                          [plan]: { ...limits, maxFileSizeMB: parseInt(e.target.value) || 100 }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                        placeholder="100"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveLimits}
              disabled={loading}
              className="mt-6 w-full md:w-auto px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
            >
              {window.__t("حفظ الحدود")}
            </button>
          </div>
        </div>
      )}

      {/* Notifications Settings */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 border-b pb-3">{window.__t("إعدادات الإشعارات")}</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {window.__t("فترة فحص الإشعارات (بالميلي ثانية)")}
            </label>
            <input
              type="number"
              value={settings.notificationPollingInterval}
              onChange={(e) => setSettings({ ...settings, notificationPollingInterval: parseInt(e.target.value) || 3000 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900"
            />
            <p className="text-xs text-gray-500 mt-1">{window.__t("القيمة الافتراضية: 3000 (3 ثواني)")}</p>
          </div>

          <button
            onClick={handleSaveGeneral}
            disabled={loading}
            className="w-full md:w-auto px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
          >
            {window.__t("حفظ الإعدادات")}
          </button>
        </div>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 border-b pb-3">{window.__t("الأمان والنسخ الاحتياطي")}</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-bold text-blue-800 mb-2">{window.__t("تصدير البيانات")}</h4>
              <p className="text-sm text-blue-700 mb-4">{window.__t("قم بتحميل نسخة احتياطية من جميع البيانات (المستخدمين، القضايا، العقود)")}</p>
              <button
                onClick={handleExportData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {window.__t("تصدير البيانات")}
              </button>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-bold text-yellow-800 mb-2">{window.__t("تحذير")}</h4>
              <p className="text-sm text-yellow-700">{window.__t("تأكد من حفظ نسخة احتياطية بانتظام لحماية بياناتك")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
              <p className="text-blue-100 text-sm mb-2">{window.__t("إجمالي المستخدمين")}</p>
              <h3 className="text-4xl font-bold">{stats.totalUsers}</h3>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
              <p className="text-green-100 text-sm mb-2">{window.__t("إجمالي القضايا")}</p>
              <h3 className="text-4xl font-bold">{stats.totalCases}</h3>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
              <p className="text-purple-100 text-sm mb-2">{window.__t("إجمالي العقود")}</p>
              <h3 className="text-4xl font-bold">{stats.totalContracts}</h3>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-6 rounded-xl shadow-lg">
              <p className="text-amber-100 text-sm mb-2">{window.__t("إجمالي الإيرادات")}</p>
              <h3 className="text-4xl font-bold">{stats.totalRevenue.toFixed(2)} {window.__t("د.ت")}</h3>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">{window.__t("معلومات النظام")}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">{window.__t("إصدار النظام")}</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">{window.__t("تاريخ آخر نسخة احتياطية")}</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">{window.__t("حالة قاعدة البيانات")}</span>
                <span className="font-medium text-green-600">{window.__t("متصل")}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <Toast
          message={notification.msg}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

