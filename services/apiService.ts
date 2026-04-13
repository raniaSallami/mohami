import { storageService } from './storageService';
import { fetchWithTokenRefresh } from './apiInterceptor';
import { User } from '../types';

const API_BASE = 'http://localhost:3001/api';

export interface LoginStep1Response {
  needs_otp: boolean;
  user_id?: string;
  message?: string;
  user?: any;
  token?: any;
}

export interface LoginStep2Response {
  access_token: string;
  token_type: string;
  user: any;
  message?: string;
}

export interface AuthError {
  detail: string;
  code?: string;
}

class APIService {
  private baseUrl = API_BASE;

  getAuthHeaders(): HeadersInit {
    const token = storageService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Step 1: Initial login with email and password
   */
  async loginEmailStep1(email: string, password: string, recaptchaToken: string, fingerprint?: string): Promise<LoginStep1Response> {
    const response = await fetch(`${this.baseUrl}/auth/login/step1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email,
        password,
        recaptcha_token: recaptchaToken,
        fingerprint: fingerprint || undefined
      }),
    });

    if (!response.ok) {
      const error: AuthError = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  }

  /**
   * Step 2: Complete login with OTP
   */
  async loginEmailStep2(userId: string, otp: string, fingerprint: string): Promise<LoginStep2Response> {
    const response = await fetch(`${this.baseUrl}/auth/login/step2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        otp,
        fingerprint,
      }),
    });

    if (!response.ok) {
      const error: AuthError = await response.json();
      throw new Error(error.detail || 'OTP verification failed');
    }

    const data = await response.json();
    storageService.setToken(data);
    storageService.setUser(data.user);
    return data;
  }

  /**
   * Register new user - Step 1: Send OTP
   */
  async sendRegistrationOTP(
    email: string,
    password: string,
    name: string,
    phone: string,
    accountType: string
  ): Promise<{ message: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    try {
      const payload = {
        email,
        password,
        name,
        phone,
        account_type: accountType,
      };
      
      console.log('📤 Sending OTP request:', payload);
      
      const response = await fetch(`${this.baseUrl}/auth/register/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ OTP Error Response:', errorData);
        let errorMsg = 'Failed to send OTP';
        
        if (typeof errorData.detail === 'string') {
          errorMsg = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMsg = errorData.detail.map((e: any) => e.msg || e).join(', ');
        }
        
        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log('✅ OTP Sent Successfully:', result);
      return result;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('الطلب استغرق وقتاً طويلاً، يرجى التحقق من اتصالك بالإنترنت');
      }
      throw error;
    }
  }

  /**
   * Register new user - Step 2: Verify OTP
   */
  async verifyRegistrationOTP(email: string, otp: string): Promise<{ verified: boolean; message: string }> {
    const payload = { email, otp };
    console.log('🔐 Verifying OTP:', payload);
    
    const response = await fetch(`${this.baseUrl}/auth/register/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OTP Verification Error:', errorData);
      let errorMsg = 'OTP verification failed';
      
      if (typeof errorData.detail === 'string') {
        errorMsg = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMsg = errorData.detail.map((e: any) => e.msg || e).join(', ');
      }
      
      throw new Error(errorMsg);
    }

    const result = await response.json();
    console.log('✅ OTP Verified Successfully:', result);
    return result;
  }

  /**
   * Register new user - Step 3: Complete registration
   */
  async register(
    email: string,
    password: string,
    name: string,
    recaptchaToken: string,
    phone: string,
    accountType: string,
    subscriptionPlan?: string,
    barNumber?: string,
    cabinetName?: string,
    university?: string,
    role?: string,
    barRegistrationNumber?: string,
    officeAddress?: string,
    numberOfLawyers?: string
  ): Promise<LoginStep2Response> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        name,
        phone,
        account_type: accountType,
        subscription_plan: subscriptionPlan || 'basic',
        bar_number: barNumber,
        cabinet_name: cabinetName,
        university: university,
        bar_registration_number: barRegistrationNumber,
        office_address: officeAddress,
        number_of_lawyers: numberOfLawyers ? parseInt(numberOfLawyers) : null,
        recaptcha_token: recaptchaToken,
        role: role || 'LAWYER',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMsg = 'Failed to register';
      
      if (typeof errorData.detail === 'string') {
        errorMsg = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMsg = errorData.detail.map((e: any) => e.msg).join(', ');
      }
      
      throw new Error(errorMsg);
    }

    const data = await response.json();
    storageService.setToken(data);
    storageService.setUser(data.user);
    return data;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    storageService.clearAll();
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<any> {
    const response = await fetchWithTokenRefresh(`${this.baseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error: AuthError = await response.json();
      throw new Error(error.detail || 'Email verification failed');
    }

    return response.json();
  }

  /**
   * Forgot password - Step 1
   */
  async forgotPasswordStep1(email: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auth/forgot-password/step1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error: AuthError = await response.json();
      throw new Error(error.detail || 'Failed to initiate password reset');
    }

    return response.json();
  }

  /**
   * Forgot password - Step 2 (with OTP)
   */
  async forgotPasswordStep2(email: string, otp: string, newPassword: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auth/forgot-password/step2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        otp,
        new_password: newPassword,
      }),
    });

    if (!response.ok) {
      const error: AuthError = await response.json();
      throw new Error(error.detail || 'Password reset failed');
    }

    return response.json();
  }

  /**
   * Emergency reset password
   */
  async emergencyResetPassword(
    email: string,
    newPassword: string,
    logoutAllDevices: boolean = true
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auth/emergency-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        new_password: newPassword,
        logout_all_devices: logoutAllDevices,
      }),
    });

    if (!response.ok) {
      const error: AuthError = await response.json();
      throw new Error(error.detail || 'Emergency reset failed');
    }

    return response.json();
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await fetchWithTokenRefresh(`${this.baseUrl}/users/me`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  }

  /**
   * Update user profile - Supports file uploads (avatar) and deletion
   */
  async updateProfile(data: Partial<User> & { avatar?: File | null, deleteAvatar?: boolean }): Promise<User> {
    const isFormData = (data.avatar && typeof data.avatar !== 'string') || data.deleteAvatar;
    let body: any;
    let headers = { ...this.getAuthHeaders() } as any;

    if (isFormData) {
      // Use FormData for file uploads or deletion
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.avatar && typeof data.avatar !== 'string') formData.append('avatar', data.avatar);
      if (data.deleteAvatar) formData.append('delete_avatar', 'true');
      
      // For phone, etc.
      if ((data as any).phone) formData.append('phone', (data as any).phone);
      
      body = formData;
      delete headers['Content-Type'];
    } else {
      body = JSON.stringify(data);
    }

    const response = await fetchWithTokenRefresh(`${this.baseUrl}/users/profile`, {
      method: 'PUT',
      headers,
      body,
    });

    if (!response.ok) {
      const error: AuthError = await response.json();
      throw new Error(error.detail || 'Failed to update profile');
    }

    const updatedUser = await response.json();
    storageService.setUser(updatedUser);
    return updatedUser;
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetchWithTokenRefresh(`${this.baseUrl}/auth/change-password`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    if (!response.ok) {
      const error: AuthError = await response.json();
      throw new Error(error.detail || 'Password change failed');
    }
  }

  /**
   * Send OTP to email
   */
  async sendOTP(email: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error: AuthError = await response.json();
      throw new Error(error.detail || 'Failed to send OTP');
    }

    return response.json();
  }

  /**
   * Device security - Get trusted devices
   */
  async getTrustedDevices(): Promise<any[]> {
    const response = await fetchWithTokenRefresh(`${this.baseUrl}/device-security/devices`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch devices');
    }

    const data = await response.json();
    return data.devices || [];
  }

  /**
   * Device security - Verify device
   */
  async verifyDevice(deviceId: string, otp: string): Promise<any> {
    const response = await fetchWithTokenRefresh(`${this.baseUrl}/device-security/verify`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        device_id: deviceId,
        otp,
      }),
    });

    if (!response.ok) {
      const error: AuthError = await response.json();
      throw new Error(error.detail || 'Device verification failed');
    }

    return response.json();
  }

  /**
   * Device security - Trust device
   */
  async trustDevice(deviceId: string, name?: string): Promise<any> {
    const response = await fetchWithTokenRefresh(`${this.baseUrl}/device-security/trust`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        device_id: deviceId,
        name,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to trust device');
    }

    return response.json();
  }

  /**
   * Device security - Revoke device
   */
  async revokeDevice(deviceId: string): Promise<void> {
    const response = await fetchWithTokenRefresh(`${this.baseUrl}/device-security/revoke`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ device_id: deviceId }),
    });

    if (!response.ok) {
      throw new Error('Failed to revoke device');
    }
  }

  /**
   * Get cases
   */
  async getCases(page: number = 1, pageSize: number = 20): Promise<any> {
    const response = await fetchWithTokenRefresh(
      `${this.baseUrl}/cases?page=${page}&page_size=${pageSize}`,
      { headers: this.getAuthHeaders() }
    );

    if (!response.ok) throw new Error('Failed to fetch cases');
    return response.json();
  }

  /**
   * Create case
   */
  async createCase(caseData: any): Promise<any> {
    const response = await fetchWithTokenRefresh(`${this.baseUrl}/cases`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(caseData),
    });

    if (!response.ok) throw new Error('Failed to create case');
    return response.json();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const apiService = new APIService();
