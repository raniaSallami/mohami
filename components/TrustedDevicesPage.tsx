/**
 * Trusted Devices Manager
 * View, manage, and remove trusted devices
 */

import React, { useState, useEffect } from 'react';
import './TrustedDevicesPage.scss';

interface Device {
  device_id: string;
  device_name: string;
  ip_address: string;
  country: string;
  city: string;
  last_seen: string;
}

export const TrustedDevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deletingId, setDeletingId] = useState<string>('');

  // Fetch trusted devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch('/api/device/trusted-devices', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch devices');
        }

        const data = await response.json();
        setDevices(data);
        setError('');
      } catch (err) {
        setError('فشل تحميل قائمة الأجهزة');
        console.error('Error fetching devices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-TN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Delete device
  const handleDeleteDevice = async (deviceId: string) => {
    setDeletingId(deviceId);
    try {
      const response = await fetch(`/api/device/trusted-devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete device');
      }

      setDevices(devices.filter(d => d.device_id !== deviceId));
      setShowConfirmDelete(false);
      setSelectedDevice(null);
    } catch (err) {
      setError('فشل حذف الجهاز');
      console.error('Error deleting device:', err);
    } finally {
      setDeletingId('');
    }
  };

  // Logout from all devices
  const handleLogoutAll = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في تسجيل الخروج من جميع الأجهزة؟')) {
      return;
    }

    try {
      const response = await fetch('/api/device/logout-all-devices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    } catch (err) {
      setError('فشل تسجيل الخروج من جميع الأجهزة');
      console.error('Error logging out:', err);
    }
  };

  return (
    <div className="trusted-devices-container" dir="rtl">
      <div className="devices-header">
        <h1>الأجهزة الموثوقة</h1>
        <p>إدارة الأجهزة التي تثق بها</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>جاري تحميل الأجهزة...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && devices.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📱</div>
          <h3>لا توجد أجهزة موثوقة</h3>
          <p>عند تسجيل دخولك من جهاز جديد، سيتم إضافته هنا بعد التحقق منه.</p>
        </div>
      )}

      {/* Devices List */}
      {!loading && devices.length > 0 && (
        <>
          <div className="devices-grid">
            {devices.map((device) => (
              <div key={device.device_id} className="device-card">
                <div className="device-header">
                  <div className="device-icon">💻</div>
                  <div className="device-name-info">
                    <h3>{device.device_name}</h3>
                    <p className="device-ip">{device.ip_address}</p>
                  </div>
                </div>

                <div className="device-details">
                  <div className="detail-row">
                    <span className="detail-label">الموقع:</span>
                    <span className="detail-value">
                      {device.city && device.country
                        ? `${device.city}, ${device.country}`
                        : 'غير متوفر'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">آخر دخول:</span>
                    <span className="detail-value">{formatDate(device.last_seen)}</span>
                  </div>
                </div>

                <button
                  className="delete-button"
                  onClick={() => {
                    setSelectedDevice(device.device_id);
                    setShowConfirmDelete(true);
                  }}
                  disabled={deletingId === device.device_id}
                >
                  {deletingId === device.device_id ? 'حذف...' : 'إزالة الجهاز'}
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="action-section">
            <button className="logout-all-button" onClick={handleLogoutAll}>
              تسجيل الخروج من جميع الأجهزة
            </button>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirmDelete && (
        <div className="modal-overlay" onClick={() => setShowConfirmDelete(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>تأكيد حذف الجهاز</h2>
            <p>هل أنت متأكد من رغبتك في إزالة هذا الجهاز؟</p>
            <p className="warning">
              ستحتاج إلى التحقق عبر OTP عند تسجيل الدخول من هذا الجهاز مرة أخرى.
            </p>
            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => setShowConfirmDelete(false)}
              >
                إلغاء
              </button>
              <button
                className="confirm-button"
                onClick={() => handleDeleteDevice(selectedDevice!)}
                disabled={deletingId === selectedDevice}
              >
                {deletingId === selectedDevice ? 'جاري الحذف...' : 'تأكيد الحذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Tips */}
      <div className="security-tips">
        <h3>💡 نصائح الأمان</h3>
        <ul>
          <li>تحقق بانتظام من قائمة الأجهزة الموثوقة</li>
          <li>احذف أي جهاز لا تعرفه أو لا تستخدمه</li>
          <li>في حالة الاشتباه، استخدم "تسجيل الخروج من جميع الأجهزة"</li>
          <li>غير كلمة مرورك بانتظام لتعزيز الأمان</li>
        </ul>
      </div>
    </div>
  );
};

export default TrustedDevicesPage;
