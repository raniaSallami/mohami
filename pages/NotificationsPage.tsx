import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { Notification } from '../types';
import { Spinner } from '../components/UI';

export const NotificationsPage = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await notificationService.getNotifications(1, 200);
        // Map API response to our typescript Notification type
        const mapped = (data.notifications || []).map((n: any) => ({
          ...n,
          createdAt: n.created_at,
          userId: n.user_id,
        }));
        setNotifications(mapped);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      await notificationService.markAsRead(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    }
    if (n.link) {
      const page = (n.link || '').replace(/^[#/]+/, '').split('/')[0] || '';
      if (page) onNavigate(page);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'admin': return '👤';
      case 'appointment': return '📅';
      case 'invoice': return '💰';
      case 'system': return '⚙️';
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'case': return '📁';
      default: return 'ℹ️';
    }
  };

  const getColor = (type: Notification['type']) => {
    switch (type) {
      case 'admin': return 'bg-blue-100 text-blue-600';
      case 'appointment': return 'bg-purple-100 text-purple-600';
      case 'invoice': return 'bg-green-100 text-green-600';
      case 'error': return 'bg-red-100 text-red-600';
      case 'warning': return 'bg-yellow-100 text-yellow-600';
      case 'case': return 'bg-amber-100 text-amber-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">جميع الإشعارات</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-gray-500 hover:text-gray-700"
          >
            رجوع
          </button>
          {notifications.some(n => !n.read) && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              تحديد الكل كمقروء
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">لا توجد إشعارات</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
            >
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl ${getColor(n.type)}`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{n.title}</p>
                    {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(n.createdAt).toLocaleString('ar-TN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
