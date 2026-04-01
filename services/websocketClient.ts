/**
 * WebSocket Client - Handles real-time chat communication
 */
import { storageService } from './storageService';

export type MessageType = 'message' | 'typing' | 'user_left' | 'history';

export interface WSMessage {
  type: MessageType;
  data?: any;
  user?: string;
  messages?: any[];
  timestamp?: string;
}

type MessageHandler = (message: WSMessage) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private messageHandlers: Map<MessageType, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor(baseUrl: string = 'ws://localhost:3001') {
    this.url = baseUrl;
  }

  connect(conversationId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = storageService.getAccessToken();
        const wsUrl = `${this.url}/api/ws/conversations/${conversationId}`;
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect(conversationId);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(conversationId: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.connect(conversationId).catch(e => console.error('Reconnect failed:', e));
      }, this.reconnectDelay);
    }
  }

  send(message: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not open');
    }
  }

  sendMessage(content: string): void {
    this.send({
      type: 'message',
      data: { message: content },
    });
  }

  sendTyping(user: string): void {
    this.send({
      type: 'typing',
      user,
    });
  }

  on(messageType: MessageType, handler: MessageHandler): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set());
    }
    this.messageHandlers.get(messageType)?.add(handler);
  }

  off(messageType: MessageType, handler: MessageHandler): void {
    this.messageHandlers.get(messageType)?.delete(handler);
  }

  private handleMessage(message: WSMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const websocketClient = new WebSocketClient();
