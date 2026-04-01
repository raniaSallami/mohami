/**
 * IP Service - Handles IP detection and verification
 */
import { storageService } from './storageService';

const API_BASE = 'http://localhost:3001/api';

export interface IPInfo {
  ip: string;
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
}

class IPService {
  private baseUrl = API_BASE;
  private cachedIP: string | null = null;

  getAuthHeaders(): HeadersInit {
    const token = storageService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Get current IP address
   */
  async getCurrentIP(): Promise<string> {
    if (this.cachedIP) return this.cachedIP;

    try {
      // Try to get IP from backend first
      const response = await fetch(`${this.baseUrl}/auth/current-ip`, {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        this.cachedIP = data.ip;
        return data.ip;
      }

      // Fallback to external service
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData: any = await ipResponse.json();
      this.cachedIP = ipData.ip;
      return ipData.ip;
    } catch (error) {
      console.error('Failed to get current IP:', error);
      return 'unknown';
    }
  }

  /**
   * Get detailed IP information
   */
  async getIPInfo(ip?: string): Promise<IPInfo> {
    const targetIP = ip || (await this.getCurrentIP());

    try {
      const response = await fetch(`${this.baseUrl}/auth/ip-info?ip=${targetIP}`, {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        return response.json();
      }

      // Return basic IP info if details unavailable
      return { ip: targetIP };
    } catch (error) {
      console.error('Failed to get IP info:', error);
      return { ip: targetIP };
    }
  }

  /**
   * Verify if IP is recognized for current user
   */
  async verifyIP(ip: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/device-security/verify-ip`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ ip }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.verified === true;
      }

      return false;
    } catch (error) {
      console.error('Failed to verify IP:', error);
      return false;
    }
  }

  /**
   * Validate session IP (check if current IP matches trusted IPs)
   */
  async validateSessionIP(userId: string): Promise<{ valid: boolean; currentIP?: string }> {
    try {
      const currentIP = await this.getCurrentIP();
      const verified = await this.verifyIP(currentIP);
      return { valid: verified, currentIP };
    } catch (error) {
      console.error('Failed to validate session IP:', error);
      return { valid: true }; // Allow on error
    }
  }

  /**
   * Add IP to trusted list
   */
  async trustIP(ip: string, label?: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/device-security/trust-ip`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ ip, label }),
    });

    if (!response.ok) throw new Error('Failed to trust IP');
  }

  /**
   * Remove IP from trusted list
   */
  async untrustIP(ip: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/device-security/untrust-ip`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ ip }),
    });

    if (!response.ok) throw new Error('Failed to remove trusted IP');
  }

  /**
   * Get list of trusted IPs
   */
  async getTrustedIPs(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/device-security/trusted-ips`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch trusted IPs');
    const data = await response.json();
    return data.trusted_ips || [];
  }

  /**
   * Check if connection needs IP verification
   */
  async requiresIPVerification(): Promise<boolean> {
    const currentIP = await this.getCurrentIP();
    return !await this.verifyIP(currentIP);
  }

  /**
   * Send verification code to email
   */
  async sendIPVerificationCode(email: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/send-ip-verification`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ email }),
    });

    if (!response.ok) throw new Error('Failed to send verification code');
  }

  /**
   * Verify with OTP code
   */
  async verifyWithOTP(code: string): Promise<boolean> {
    const currentIP = await this.getCurrentIP();

    const response = await fetch(`${this.baseUrl}/auth/verify-ip-otp`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ code, ip: currentIP }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.verified === true;
    }

    return false;
  }

  /**
   * Clear cached IP
   */
  clearCache(): void {
    this.cachedIP = null;
  }
}

export const ipService = new IPService();
