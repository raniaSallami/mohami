/**
 * Database Service - This is a placeholder for client-side database operations
 * Note: Direct database access should happen via the FastAPI backend API
 * This file is kept for backward compatibility
 */
import { storageService } from './storageService';

const API_BASE = '/api';

/**
 * Pool interface for compatibility
 * All actual database operations should use fetch() to call the backend API
 */
class DBPool {
  private baseUrl = API_BASE;

  getAuthHeaders(): HeadersInit {
    const token = storageService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Execute a query via the backend API
   * Do NOT execute raw SQL on the frontend!
   */
  async query(sql: string, params?: any[]): Promise<any> {
    console.warn('⚠️ Direct query() called. Use API endpoints instead!');
    throw new Error('Direct database queries not supported on frontend. Use API endpoints.');
  }

  /**
   * Helper to fetch users (replace direct DB queries)
   */
  async getUsers(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/users`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    const data = await response.json();
    return data.users || [];
  }

  /**
   * Helper to fetch user by ID
   */
  async getUserById(userId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/users/${userId}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('User not found');
    return response.json();
  }

  /**
   * Helper to update user
   */
  async updateUser(userId: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/users/${userId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  }

  /**
   * Helper to delete user
   */
  async deleteUser(userId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/users/${userId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete user');
  }

  /**
   * Helper to fetch cases
   */
  async getCases(filters?: any): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        params.append(key, String(value));
      });
    }
    const response = await fetch(`${this.baseUrl}/cases?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch cases');
    const data = await response.json();
    return data.cases || [];
  }

  /**
   * Helper to fetch invoices
   */
  async getInvoices(filters?: any): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        params.append(key, String(value));
      });
    }
    const response = await fetch(`${this.baseUrl}/invoices?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch invoices');
    const data = await response.json();
    return data.invoices || [];
  }
}

export const pool = new DBPool();
