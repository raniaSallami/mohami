/**
 * Visitor Service - Tracks visitor analytics
 */
import { storageService } from './storageService';

const API_BASE = 'http://localhost:3001/api';

export interface VisitorData {
  id?: string;
  visitor_id: string;
  email?: string;
  page: string;
  timestamp?: string;
  session_id?: string;
}

export interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  visitsToday: number;
  visitsThisWeek: number;
  visitsThisMonth: number;
}

export interface VisitorChartPoint {
  label: string;
  visits: number;
}

export interface RegistrationChartPoint {
  label: string;
  count: number;
}

class VisitorService {
  private baseUrl = API_BASE;
  private sessionId: string;
  private visitorId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.visitorId = this.getOrCreateVisitorId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getOrCreateVisitorId(): string {
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('visitor_id', visitorId);
    }
    return visitorId;
  }

  getAuthHeaders(): HeadersInit {
    const token = storageService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async trackPageView(page: string): Promise<void> {
    const user = storageService.getUser();
    
    try {
      await fetch(`${this.baseUrl}/analytics/page-view`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          visitor_id: this.visitorId,
          page,
          email: user?.email,
          session_id: this.sessionId,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.log('Analytics tracking skipped (non-critical)');
    }
  }

  async trackAction(action: string, data?: any): Promise<void> {
    const user = storageService.getUser();
    
    try {
      await fetch(`${this.baseUrl}/analytics/action`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          visitor_id: this.visitorId,
          action,
          data,
          email: user?.email,
          session_id: this.sessionId,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.log('Action tracking skipped (non-critical)');
    }
  }

  async trackError(errorMessage: string, stackTrace?: string): Promise<void> {
    const user = storageService.getUser();
    
    try {
      await fetch(`${this.baseUrl}/analytics/error`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          visitor_id: this.visitorId,
          error: errorMessage,
          stack: stackTrace,
          email: user?.email,
          session_id: this.sessionId,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.log('Error tracking skipped (non-critical)');
    }
  }

  getVisitorId(): string {
    return this.visitorId;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async getVisitorStats(): Promise<VisitorStats> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/stats/visitors`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    } catch {
      return { totalVisits: 0, uniqueVisitors: 0, visitsToday: 0, visitsThisWeek: 0, visitsThisMonth: 0 };
    }
  }

  async getVisitsChartData(days = 14): Promise<VisitorChartPoint[]> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/stats/visits-chart?days=${days}`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      return data.map((d: any) => ({
        label: d.date,
        visits: d.visits
      }));
    } catch {
      return [];
    }
  }

  async getRegistrationsChartData(months = 6): Promise<RegistrationChartPoint[]> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/stats/registrations-chart?months=${months}`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      return data.map((d: any) => ({
        label: d.month,
        count: d.count
      }));
    } catch {
      return [];
    }
  }
}

export const visitorService = new VisitorService();
