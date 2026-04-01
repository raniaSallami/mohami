/**
 * Notification Service - Handles notifications API
 */
import { storageService } from './storageService';
import { fetchWithTokenRefresh } from './apiInterceptor';

const API_BASE = 'http://localhost:3001/api';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  created_at: string;
  action_url?: string;
}

class NotificationService {
  private baseUrl = API_BASE;
  private notificationListeners: Set<(notifications: Notification[]) => void> = new Set();
  private pollInterval: NodeJS.Timeout | null = null;

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
        
        const data = await this.getNotifications(1, 100);
        this.notificationListeners.forEach(listener => listener(data.notifications || []));
      } catch (error) {
        console.error('Notification polling error:', error);
      }
    }, 5000); // Poll every 5 seconds
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
