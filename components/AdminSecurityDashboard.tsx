/**
 * Admin Security Dashboard
 * Monitor device security events and audit logs
 */

import React, { useState, useEffect } from 'react';
import './AdminSecurityDashboard.scss';

interface SecurityEvent {
  id: number;
  ip_address: string;
  user_id: string;
  event_type: string;
  details: string;
  created_at: string;
}

interface DashboardStats {
  total_events: number;
  device_verified: number;
  failed_otp: number;
  unauthorized_reported: number;
  last_24h: number;
}

export const AdminSecurityDashboard: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDays, setFilterDays] = useState<number>(7);

  const eventTypeColors = {
    device_verified: '#16a34a',
    failed_otp: '#ef4444',
    unauthorized_reported: '#ea580c',
    logout_all_devices: '#f59e0b',
    device_confirmed: '#06b6d4',
    device_removed: '#8b5cf6',
  };

  const eventTypeLabels = {
    device_verified: window.__t("جهاز تم التحقق منه"),
    failed_otp: window.__t("فشل التحقق من الرمز"),
    unauthorized_reported: window.__t("نشاط مريب مبلغ عنه"),
    logout_all_devices: window.__t("تسجيل خروج من جميع الأجهزة"),
    device_confirmed: window.__t("جهاز تم تأكيده"),
    device_removed: window.__t("جهاز تم حذفه"),
  };

  // Fetch security data
  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        const response = await fetch(
          `/api/admin/security/events?days=${filterDays}&event_type=${filterType}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch security data');
        }

        const data = await response.json();
        setEvents(data.events);
        setStats(data.stats);
        setError('');
      } catch (err) {
        setError(window.__t("فشل تحميل بيانات الأمان"));
        console.error('Error fetching security data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityData();
  }, [filterType, filterDays]);

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-TN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Export logs
  const handleExport = async () => {
    try {
      const response = await fetch(
        `/api/admin/security/export?days=${filterDays}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security_logs_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err) {
      setError(window.__t("فشل تصدير السجلات"));
    }
  };

  return (
    <div className="admin-security-dashboard" dir="rtl">
      {/* Header */}
      <div className="dashboard-header">
        <h1>{window.__t("لوحة تحكم الأمان")}</h1>
        <p>{window.__t("مراقبة أحداث أمان الأجهزة والمستخدمين")}</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.total_events || 0}</div>
          <div className="stat-label">{window.__t("إجمالي الأحداث")}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{stats?.device_verified || 0}</div>
          <div className="stat-label">{window.__t("أجهزة تم التحقق منها")}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-value">{stats?.failed_otp || 0}</div>
          <div className="stat-label">{window.__t("محاولات فشل الرمز")}</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-value">{stats?.unauthorized_reported || 0}</div>
          <div className="stat-label">{window.__t("أنشطة مريبة")}</div>
        </div>
        <div className="stat-card info">
          <div className="stat-value">{stats?.last_24h || 0}</div>
          <div className="stat-label">{window.__t("الأحداث - آخر 24 ساعة")}</div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="controls-section">
        <div className="filters">
          <div className="filter-group">
            <label>{window.__t("نوع الحدث:")}</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">{window.__t("جميع الأحداث")}</option>
              <option value="device_verified">{window.__t("أجهزة تم التحقق منها")}</option>
              <option value="failed_otp">{window.__t("فشل الرمز")}</option>
              <option value="unauthorized_reported">{window.__t("نشاط مريب")}</option>
              <option value="logout_all_devices">{window.__t("تسجيل خروج كامل")}</option>
              <option value="device_confirmed">{window.__t("أجهزة تم تأكيدها")}</option>
              <option value="device_removed">{window.__t("أجهزة تم حذفها")}</option>
            </select>
          </div>

          <div className="filter-group">
            <label>{window.__t("الفترة الزمنية:")}</label>
            <select
              value={filterDays}
              onChange={(e) => setFilterDays(parseInt(e.target.value))}
            >
              <option value={1}>{window.__t("آخر 24 ساعة")}</option>
              <option value={7}>{window.__t("آخر 7 أيام")}</option>
              <option value={30}>{window.__t("آخر 30 يوم")}</option>
              <option value={90}>{window.__t("آخر 3 أشهر")}</option>
            </select>
          </div>

          <button className="export-button" onClick={handleExport}>
            {window.__t("📥 تصدير السجلات")}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{window.__t("جاري تحميل الأحداث...")}</p>
        </div>
      )}

      {/* Events Table */}
      {!loading && events.length > 0 && (
        <div className="events-section">
          <h2>{window.__t("آخر الأحداث الأمنية")}</h2>
          <div className="events-table">
            <table>
              <thead>
                <tr>
                  <th>{window.__t("التاريخ والوقت")}</th>
                  <th>{window.__t("نوع الحدث")}</th>
                  <th>{window.__t("عنوان IP")}</th>
                  <th>{window.__t("معرف المستخدم")}</th>
                  <th>{window.__t("التفاصيل")}</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className={`event-row event-${event.event_type}`}>
                    <td className="date">{formatDate(event.created_at)}</td>
                    <td>
                      <span
                        className="event-badge"
                        style={{
                          backgroundColor:
                            eventTypeColors[
                              event.event_type as keyof typeof eventTypeColors
                            ] || '#64748b',
                        }}
                      >
                        {eventTypeLabels[
                          event.event_type as keyof typeof eventTypeLabels
                        ] || event.event_type}
                      </span>
                    </td>
                    <td className="ip-address">{event.ip_address}</td>
                    <td className="user-id">{event.user_id?.slice(0, 8) || 'N/A'}</td>
                    <td className="details">{event.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && events.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>{window.__t("لا توجد أحداث")}</h3>
          <p>{window.__t("لم يتم تسجيل أحداث أمنية للفترة المحددة")}</p>
        </div>
      )}

      {/* Security Alerts */}
      <div className="alerts-section">
        <h2>{window.__t("⚠️ التنبيهات والتوصيات")}</h2>
        <div className="alerts-grid">
          <div className="alert-card warning">
            <h4>{window.__t("نشاط متكرر")}</h4>
            <p>{window.__t("راقب محاولات فشل الرموز المتكررة من نفس عنوان IP")}</p>
          </div>
          <div className="alert-card info">
            <h4>{window.__t("تحديثات منتظمة")}</h4>
            <p>{window.__t("راجع سجلات الأمان بانتظام للكشف عن الأنماط المريبة")}</p>
          </div>
          <div className="alert-card success">
            <h4>{window.__t("التوثيق")}</h4>
            <p>{window.__t("احتفظ بنسخة احتياطية من سجلات الأمان لأغراض المراجعة")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSecurityDashboard;
