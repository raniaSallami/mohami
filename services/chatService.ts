/**
 * Chat Service - Handles chat API calls
 */
import { storageService } from './storageService';
import { fetchWithTokenRefresh } from './apiInterceptor';

const API_BASE = 'http://localhost:3001/api';

export interface ChatMessage {
  id?: string;
  conversation_id: string;
  sender_type: 'user' | 'admin';
  sender_id?: string;
  sender_name: string;
  message: string;
  attachments?: any[];
  created_at?: string;
}

export interface ChatConversation {
  id?: string;
  user_id: string;
  user_name: string;
  user_email: string;
  status: 'active' | 'closed';
  created_at?: string;
  updated_at?: string;
  last_message_at?: string;
}

class ChatService {
  private baseUrl = API_BASE;

  getAuthHeaders(): HeadersInit {
    const token = storageService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async listConversations(page: number = 1): Promise<any> {
    const response = await fetchWithTokenRefresh(
      `${this.baseUrl}/conversations?page=${page}`,
      { headers: this.getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return response.json();
  }

  async getConversation(conversationId: string): Promise<any> {
    const response = await fetchWithTokenRefresh(
      `${this.baseUrl}/conversations/${conversationId}`,
      { headers: this.getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch conversation');
    return response.json();
  }

  async createConversation(data: Partial<ChatConversation>): Promise<ChatConversation> {
    const response = await fetchWithTokenRefresh(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create conversation');
    return response.json();
  }

  async sendMessage(conversationId: string, message: Partial<ChatMessage>): Promise<ChatMessage> {
    const response = await fetchWithTokenRefresh(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(message),
      }
    );
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  }

  async closeConversation(conversationId: string): Promise<void> {
    const response = await fetchWithTokenRefresh(
      `${this.baseUrl}/conversations/${conversationId}/close`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error('Failed to close conversation');
  }

  async getTeamMessages(limit: number = 50): Promise<any> {
    const response = await fetchWithTokenRefresh(
      `${this.baseUrl}/team/messages?limit=${limit}`,
      { headers: this.getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch team messages');
    return response.json();
  }

  async sendTeamMessage(message: string): Promise<any> {
    const response = await fetchWithTokenRefresh(`${this.baseUrl}/team/messages`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ message }),
    });
    if (!response.ok) throw new Error('Failed to send team message');
    return response.json();
  }
}

export const chatService = new ChatService();
