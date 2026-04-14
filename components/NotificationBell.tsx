import React, { useState, useEffect, useRef } from 'react';
import { Notification as NotificationType } from '../types';
import { notificationService } from '../services/notificationService';

interface NotificationBellProps {
  onNotificationClick?: (notification: NotificationType) => void;
  onNavigate?: (page: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNotificationClick, onNavigate }) => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load initial notifications
    loadNotifications();
    loadUnreadCount();

    const handleNotifications = (apiNotifs: any[]) => {
      // Map API notifications to app NotificationType
      const newNotifs: NotificationType[] = apiNotifs.map(n => ({
        ...n,
        userId: n.user_id,
        createdAt: n.created_at,
      }));
      setNotifications(newNotifs);
      setUnreadCount(newNotifs.filter(n => !n.read).length);
    };

    notificationService.subscribe(handleNotifications);

    // Request notification permission
    if ('Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission();
    }

    return () => {
      notificationService.unsubscribe(handleNotifications);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications(1, 20);
      const notifs: NotificationType[] = (data.notifications || []).map((n: any) => ({
        ...n,
        userId: n.user_id,
        createdAt: n.created_at,
      }));
      setNotifications(notifs);
    } catch {}
  };

  const loadUnreadCount = async () => {
    const count = await notificationService.getUnreadCount();
    setUnreadCount(count);
  };

  const handleNotificationClick = async (notification: NotificationType) => {
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }

    if (onNotificationClick) {
      onNotificationClick(notification);
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: NotificationType['type']) => {
    switch (type) {
      case 'admin':
        return '👤';
      case 'appointment':
        return '📅';
      case 'invoice':
        return '💰';
      case 'system':
        return '⚙️';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'case':
        return '📁';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: NotificationType['type']) => {
    switch (type) {
      case 'admin':
        return 'bg-blue-100 text-blue-600';
      case 'appointment':
        return 'bg-purple-100 text-purple-600';
      case 'invoice':
        return 'bg-green-100 text-green-600';
      case 'error':
        return 'bg-red-100 text-red-600';
      case 'warning':
        return 'bg-yellow-100 text-yellow-600';
      case 'case':
        return 'bg-amber-100 text-amber-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 end-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute start-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">{window.__t("الإشعارات")}</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {window.__t("تحديد الكل كمقروء")}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>{window.__t("لا توجد إشعارات")}</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group relative ${
                    !notification.read ? 'bg-amber-50/50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div 
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm border border-white cursor-pointer ${getNotificationColor(notification.type)}`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p 
                          onClick={() => handleNotificationClick(notification)}
                          className={`text-sm font-bold truncate cursor-pointer ${!notification.read ? 'text-slate-900' : 'text-slate-500'}`}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-amber-100 rounded text-amber-600 transition-opacity"
                              title={window.__t("مقروء")}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      <p 
                        onClick={() => handleNotificationClick(notification)}
                        className="text-xs text-slate-600 line-clamp-2 cursor-pointer leading-relaxed"
                      >
                        {notification.message}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-[10px] font-medium text-slate-400">
                          {new Date(notification.createdAt).toLocaleDateString('ar-TN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {notification.link && (
                          <span className="text-[10px] text-amber-600 font-bold">{window.__t("عرض التفاصيل ←")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigate?.('notifications');
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {window.__t("عرض الكل")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

