/**
 * Storage Service - Handles localStorage and session data
 */
import { User } from '../types';
import { fetchWithTokenRefresh } from './apiInterceptor';

const API_BASE = 'http://localhost:3001/api';

class StorageService {
  private readonly CURRENT_USER_KEY = 'mouhami_current_user';
  private readonly TOKEN_KEY = 'mouhami_token';
  private readonly SETTINGS_KEY = 'mouhami_general_settings';
  private readonly CASES_KEY = 'mouhami_cases';

  async init(): Promise<void> {
    const token = this.getAccessToken();
    if (token && this.isTokenExpired()) {
      this.logout();
    }
  }

  // Normalize backend snake_case to frontend camelCase
  private normalizeUser(user: any): User | null {
    if (!user) return null;
    return {
      ...user,
      id: user.id || user._id,
      email: user.email,
      email_verified: user.email_verified || false,
      name: user.name,
      role: user.role,
      subscriptionPlan: user.subscription_plan || user.subscriptionPlan || 'basic',
      subscriptionStatus: user.subscription_status || user.subscriptionStatus || 'active',
      organizationOwnerId: user.organization_owner_id || user.organizationOwnerId,
      phone: user.phone,
      account_type: user.account_type,
      bar_number: user.bar_number,
      cabinet_name: user.cabinet_name,
      bar_registration_number: user.bar_registration_number,
      office_address: user.office_address,
      number_of_lawyers: user.number_of_lawyers,
      university: user.university,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  // User Management
  setCurrentUser(user: any): void {
    const normalized = this.normalizeUser(user);
    if (normalized) localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(normalized));
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem(this.CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  // Alias for compatibility
  getUser(): User | null {
    return this.getCurrentUser();
  }

  setUser(user: any): void {
    this.setCurrentUser(user);
  }

  async updateUser(userUpdate: any): Promise<void> {
    const token = this.getAccessToken();
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/users/${userUpdate.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: userUpdate.name, 
          email: userUpdate.email,
          phone: userUpdate.phone,
          account_type: userUpdate.account_type,
          bar_number: userUpdate.bar_number,
          cabinet_name: userUpdate.cabinet_name,
          university: userUpdate.university
        }),
      });
      if (response.ok) {
        const freshUser = await response.json();
        this.setUser(freshUser);
      }
    } catch (error) {
      console.error('Failed to update user profile:', error);
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ ok: boolean, message?: string }> {
    const token = this.getAccessToken();
    if (!token) return { ok: false, message: 'Not authenticated' };
    try {
      const response = await fetch(`${API_BASE}/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (response.ok) return { ok: true };
      const data = await response.json();
      return { ok: false, message: data.detail || 'Current password incorrect' };
    } catch {
      return { ok: false, message: 'Network error' };
    }
  }

  async getCurrentUserFresh(): Promise<User | null> {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const user = await response.json();
        const normalized = this.normalizeUser(user);
        this.setCurrentUser(normalized);
        return normalized;
      }
      return null;
    } catch {
      return null;
    }
  }

  clearUser(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  // Token Management
  setToken(token: any): void {
    if (token.expires_in) {
      token.expiresAt = Date.now() + token.expires_in * 1000;
    }
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(token));
  }

  getToken(): any {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return token ? JSON.parse(token) : null;
  }

  getAccessToken(): string | null {
    const token = this.getToken();
    return token?.access_token || null;
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token?.expiresAt) return false;
    return Date.now() > token.expiresAt;
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('almohami_access_token');
  }

  // General Settings
  async getGeneralSettings(): Promise<any> {
    const cached = localStorage.getItem(this.SETTINGS_KEY);
    if (cached) return JSON.parse(cached);

    try {
      const response = await fetch(`${API_BASE}/settings/general`);
      if (response.ok) {
        const settings = await response.json();
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
        return settings;
      }
    } catch {}

    return { maintenanceMode: false, allowRegistrations: true, appName: 'المحامي' };
  }

  setGeneralSettings(settings: any): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  // Plan Pricing & Limits (with fallback defaults)
  async getPlanPricing(): Promise<{ pro: number; enterprise: number } | null> {
    try {
      const response = await fetch(`${API_BASE}/settings/pricing`);
      if (response.ok) return response.json();
    } catch {}
    return null; // caller uses defaults
  }

  async getPlanLimits(): Promise<Record<string, { cases: number; contracts: number }> | null> {
    try {
      const response = await fetch(`${API_BASE}/settings/plan-limits`);
      if (response.ok) return response.json();
    } catch {}
    return null; // caller uses defaults
  }

  // Cases Cache - Local storage methods
  getCasesFromCache(): any[] {
    const cases = localStorage.getItem(this.CASES_KEY);
    return cases ? JSON.parse(cases) : [];
  }

  setCases(cases: any[]): void {
    localStorage.setItem(this.CASES_KEY, JSON.stringify(cases));
  }

  // IP Verification OTP
  async createIpVerificationOtp(userId: string, email: string, name: string, ip: string): Promise<void> {
    const response = await fetch(`${API_BASE}/device-security/create-ip-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.getAccessToken() && { Authorization: `Bearer ${this.getAccessToken()}` }),
      },
      body: JSON.stringify({ user_id: userId, email, name, ip }),
    });
    if (!response.ok) throw new Error('Failed to create OTP');
  }

  async verifyIpOtp(userId: string, otp: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/device-security/verify-ip-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, otp }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Refresh Token Management
  async refreshAccessToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token?.refresh_token) {
      this.logout();
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: token.refresh_token }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update access token while keeping refresh token
        const updated = {
          ...token,
          access_token: data.access_token,
          expiresAt: Date.now() + (data.expires_in * 1000),
        };
        this.setToken(updated);
        return true;
      } else {
        // Refresh token expired or invalid, force re-login
        this.logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      return false;
    }
  }

  // Logout with server-side revocation
  async logoutAsync(logoutAllDevices: boolean = false): Promise<void> {
    const token = this.getAccessToken();
    
    // Try to notify backend (logout may fail if token expired, which is ok)
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ logout_all_devices: logoutAllDevices }),
        });
      } catch {
        // Ignore errors - proceed with local logout anyway
      }
    }
    
    // Clear local tokens
    this.clearToken();
    this.clearUser();
  }

  // Logout
  logout(): void {
    this.clearUser();
    this.clearToken();
  }

  clearAll(): void {
    localStorage.clear();
    sessionStorage.clear();
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser() && !!this.getAccessToken() && !this.isTokenExpired();
  }

  // Signup Email OTP - Step 1: Send verification code to email
  async createSignupEmailOtp(email: string, name: string, recaptchaToken?: string): Promise<{ ok: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE}/auth/signup-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, recaptcha_token: recaptchaToken || '' }),
      });

      if (response.ok) {
        return { ok: true };
      }

      const data = await response.json();
      return { ok: false, message: data.detail || 'فشل إرسال رمز التحقق' };
    } catch {
      return { ok: false, message: 'خطأ في الاتصال بالخادم' };
    }
  }

  // Signup Email OTP - Step 2: Verify the OTP code
  async verifySignupEmailOtp(email: string, otp: string): Promise<{ ok: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE}/auth/verify-signup-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      if (response.ok) {
        return { ok: true };
      }

      const data = await response.json();
      return { ok: false, message: data.detail || 'رمز التحقق غير صحيح' };
    } catch {
      return { ok: false, message: 'خطأ في الاتصال بالخادم' };
    }
  }

  // Register a new user (after OTP is verified)
  async register(name: string, email: string, password: string): Promise<any> {
    // Get a fresh reCAPTCHA token for registration
    let recaptchaToken = '';
    if ((window as any).grecaptcha) {
      try {
        recaptchaToken = await (window as any).grecaptcha.execute(
          '6LfUwIUsAAAAAHhZ9shKyoYxjV0Yjgp2loqj4tFN',
          { action: 'register' }
        );
      } catch (err) {
        console.error('Failed to generate reCAPTCHA token for register:', err);
      }
    }

    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, recaptcha_token: recaptchaToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'فشل إنشاء الحساب');
    }

    const data = await response.json();

    // Backend returns { token: { access_token, refresh_token }, user: {...} }
    if (data.token) {
      const tokenData = {
        access_token: data.token.access_token,
        refresh_token: data.token.refresh_token,
        token_type: data.token.token_type || 'bearer',
      };
      this.setToken(tokenData);
      this.setUser(data.user);
    }

    return this.getCurrentUser();
  }

  // Submit payment receipt for paid plans
  async submitPayment(plan: 'pro' | 'enterprise', receiptBase64: string): Promise<void> {
    // For now, store locally — payment verification is manual
    const paymentData = {
      plan,
      receipt: receiptBase64,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    localStorage.setItem('mouhami_payment_pending', JSON.stringify(paymentData));
  }

  // ════════════════════════════════════════════════════════
  // DASHBOARD & CONTRACTS MIGRATION METHODS
  // ════════════════════════════════════════════════════════

  // Temporary Mocks for Dashboard Migration
  async getTeamMembers(): Promise<any[]> {
    return [];
  }

  async getCasesByUserId(userId: string): Promise<any[]> {
    return this.getCases(); // Fallback to list
  }

  async getCases(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/cases?page=1&limit=500`, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAccessToken() && { Authorization: `Bearer ${this.getAccessToken()}` }),
        },
      });
      if (response.ok) {
        const data = await response.json();
        return (data.cases || []).map((c: any) => ({
          ...c,
          clientName: c.client_name,
          dateCreated: c.date_created,
          documents: c.documents || []
        }));
      }
      return [];
    } catch {
      return [];
    }
  }

  async getCaseById(id: string): Promise<any | null> {
    try {
      const response = await fetch(`${API_BASE}/cases/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAccessToken() && { Authorization: `Bearer ${this.getAccessToken()}` }),
        },
      });
      if (response.ok) {
        const c = await response.json();
        return {
          ...c,
          clientName: c.client_name,
          dateCreated: c.date_created,
          documents: c.documents || [],
          chatHistory: c.chat_history || []
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async addCase(caseData: any): Promise<{ pendingApproval: boolean }> {
    try {
      const payload = {
        title: caseData.title,
        client_name: caseData.clientName,
        type: caseData.type,
        status: caseData.status || 'pending',
        description: caseData.description || ""
      };
      const response = await fetch(`${API_BASE}/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAccessToken() && { Authorization: `Bearer ${this.getAccessToken()}` }),
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        return { pendingApproval: data.status === 'pending' };
      }
      throw new Error('Failed to create case');
    } catch (e) {
      console.error("Failed to add case", e);
      throw e;
    }
  }

  async updateCase(caseData: any): Promise<void> {
    try {
      const payload = {
        title: caseData.title,
        client_name: caseData.clientName,
        type: caseData.type,
        status: caseData.status,
        description: caseData.description
      };
      await fetch(`${API_BASE}/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAccessToken() && { Authorization: `Bearer ${this.getAccessToken()}` }),
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error("Failed to update case", e);
    }
  }

  async deleteCase(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/cases/${id}`, {
        method: 'DELETE',
        headers: {
          ...(this.getAccessToken() && { Authorization: `Bearer ${this.getAccessToken()}` }),
        }
      });
    } catch (e) {
      console.error("Failed to delete case", e);
    }
  }

  // Contract Methods wrapping FastAPI backend
  async getContracts(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/contracts?page=1&limit=200`, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAccessToken() && { Authorization: `Bearer ${this.getAccessToken()}` }),
        },
      });
      if (response.ok) {
        const data = await response.json();
        // mapping backend contract fields -> frontend 'c.dateCreated' etc.
        return (data.contracts || []).map((c: any) => ({
          ...c,
          dateCreated: c.date_created || c.created_at || new Date().toISOString()
        }));
      }
      return [];
    } catch {
      return [];
    }
  }

  async saveContract(contract: any): Promise<void> {
    try {
      const payload = {
        title: contract.title,
        type: contract.type,
        parties: contract.parties,
        content: contract.content
      };
      await fetch(`${API_BASE}/contracts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAccessToken() && { Authorization: `Bearer ${this.getAccessToken()}` }),
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error("Failed to save contract", e);
    }
  }

  async deleteContract(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/contracts/${id}`, {
        method: 'DELETE',
        headers: {
          ...(this.getAccessToken() && { Authorization: `Bearer ${this.getAccessToken()}` }),
        }
      });
    } catch (e) {
      console.error("Failed to delete contract", e);
    }
  }

  // Event Methods wrapping FastAPI backend
  async getEvents(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/events?page=1&limit=200`, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAccessToken() && { Authorization: `Bearer ${this.getAccessToken()}` }),
        },
      });
      if (response.ok) {
        const data = await response.json();
        // mapping backend event fields to frontend 'CalendarEvent' expected fields
        return (data.events || []).map((e: any) => ({
          ...e,
          caseId: e.case_id,
          userId: e.user_id,
          userName: e.user?.name || e.user_name || undefined,
          caseTitle: e.case?.title || e.case_title || undefined
        }));
      }
      return [];
    } catch {
      return [];
    }
  }

  async addEvent(event: any): Promise<CalendarEvent> {
    try {
      const payload: any = {
        title: event.title,
        date: event.date,
        type: event.type,
      };

      if (event.time) payload.time = event.time;
      if (event.description) payload.description = event.description;
      if (event.caseId) payload.case_id = event.caseId;

      const response = await fetchWithTokenRefresh(`${API_BASE}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend validation error details:', JSON.stringify(errorData, null, 2));
        throw new Error(`Failed to add event: ${response.status}`);
      }

      const data = await response.json();
      return {
        ...data,
        caseId: data.case_id,
        userId: data.user_id,
        userName: data.user?.name || data.user_name || undefined,
        caseTitle: data.case?.title || data.case_title || undefined,
      };
    } catch (e) {
      console.error('Failed to add event', e);
      throw e;
    }
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      const response = await fetchWithTokenRefresh(`${API_BASE}/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to delete event details:', JSON.stringify(errorData, null, 2));
        throw new Error(`Failed to delete event: ${response.status}`);
      }
    } catch (e) {
      console.error('Failed to delete event', e);
      throw e;
    }
  }

  async checkUsageLimit(feature: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/users/me/usage/${feature}`, {
        headers: {
          ...(this.getAccessToken() && { Authorization: `Bearer ${this.getAccessToken()}` }),
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data.allowed === true;
      }
      return true; // fail open for mock purposes
    } catch {
      return true;
    }
  }

  // Invoice Methods
  async getInvoices(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/invoices`, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAccessToken() && { Authorization: `Bearer ${this.getAccessToken()}` }),
        },
      });
      if (response.ok) {
        const data = await response.json();
        return data.invoices || [];
      }
      return [];
    } catch {
      return [];
    }
  }
}

export const storageService = new StorageService();