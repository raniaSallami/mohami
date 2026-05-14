/**
 * Notification Service - Handles notifications API
 */
import { storageService } from './storageService';
import { fetchWithTokenRefresh } from './apiInterceptor';

const API_BASE = '/api';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'admin' | 'appointment' | 'invoice' | 'system' | 'info' | 'success' | 'error' | 'warning' | 'case';
  read: boolean;
  created_at: string;
  link?: string;
  metadata?: any;
}

class NotificationService {
  private baseUrl = API_BASE;
  private notificationListeners: Set<(notifications: Notification[]) => void> = new Set();
  private pollInterval: NodeJS.Timeout | null = null;
  private lastNotificationIds: Set<string> = new Set();
  private isFirstLoad: boolean = true;

  getAuthHeaders(): HeadersInit {
    const token = storageService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getNotifications(page: number = 1, limit: number = 20): Promise<any> {
    const response = await fetchWithTokenRefresh(
      `${this.baseUrl}/notifications?page=${page}&limit=${limit}`,
      { headers: this.getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  }

  async markAsRead(notificationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
  }

  async markAllAsRead(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to mark all as read');
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete notification');
  }

  async getUnreadCount(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/notifications/unread-count`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch unread count');
    const data = await response.json();
    return data.count;
  }

  subscribe(listener: (notifications: Notification[]) => void): void {
    this.notificationListeners.add(listener);
    this.startPolling();
  }

  unsubscribe(listener: (notifications: Notification[]) => void): void {
    this.notificationListeners.delete(listener);
    if (this.notificationListeners.size === 0) {
      this.stopPolling();
    }
  }

  private startPolling(): void {
    if (this.pollInterval) return;
    
    this.pollInterval = setInterval(async () => {
      try {
        if (!storageService.getAccessToken()) return;
        
        const data = await this.getNotifications(1, 20);
        const notifications: Notification[] = data.notifications || [];
        
        // Notify listeners
        this.notificationListeners.forEach(listener => listener(notifications));
        
        // Check for new notifications to trigger browser alerts
        if (!this.isFirstLoad) {
          notifications.forEach(notif => {
            if (!notif.read && !this.lastNotificationIds.has(notif.id)) {
              if ('Notification' in window && window.Notification.permission === 'granted') {
                new window.Notification(notif.title, {
                  body: notif.message,
                  icon: '/favicon.ico'
                });
              }
            }
          });
        }
        
        // Update tracked IDs
        this.lastNotificationIds = new Set(notifications.map(n => n.id));
        this.isFirstLoad = false;
      } catch (error) {
        console.error('Notification polling error:', error);
      }
    }, 4000); // Poll every 4 seconds
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  notify(title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info'): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/mouhami-icon.png',
      });
    }
  }

  requestPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

export const notificationService = new NotificationService();
