import { io, Socket } from 'socket.io-client';
import { useAuth } from '@clerk/nextjs';

export interface HealthCalendarEvent {
  type: 'health_event_created' | 'health_event_updated' | 'health_event_deleted' | 
        'daily_checkin_created' | 'daily_checkin_updated' | 
        'notification_created' | 'streak_updated' | 'pattern_analyzed';
  data: Record<string, unknown>;
  userId: string;
  timestamp: string;
}

interface WebSocketCallbacks {
  onHealthEventUpdate?: (event: HealthCalendarEvent) => void;
  onDailyCheckinUpdate?: (event: HealthCalendarEvent) => void;
  onNotificationUpdate?: (event: HealthCalendarEvent) => void;
  onStreakUpdate?: (event: HealthCalendarEvent) => void;
  onPatternUpdate?: (event: HealthCalendarEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor() {
    this.handleConnect = this.handleConnect.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleHealthCalendarEvent = this.handleHealthCalendarEvent.bind(this);
  }

  connect(userId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;

      try {
        this.socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001', {
          auth: {
            token,
            userId
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay
        });

        this.socket.on('connect', () => {
          this.handleConnect();
          this.isConnecting = false;
          resolve();
        });

        this.socket.on('disconnect', this.handleDisconnect);
        this.socket.on('connect_error', (error) => {
          this.isConnecting = false;
          this.handleError(error);
          reject(error);
        });

        // Health calendar specific events
        this.socket.on('health_calendar_event', this.handleHealthCalendarEvent);
        
        // Join user-specific room for personalized updates
        this.socket.emit('join_user_room', userId);

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
  }

  setCallbacks(callbacks: WebSocketCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Emit events to server
  emitHealthEvent(eventType: string, data: Record<string, unknown>): void {
    if (this.socket?.connected) {
      this.socket.emit('health_calendar_update', {
        type: eventType,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Subscribe to specific event types
  subscribeToHealthEvents(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe_health_events', { userId });
    }
  }

  subscribeToNotifications(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe_notifications', { userId });
    }
  }

  subscribeToStreaks(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe_streaks', { userId });
    }
  }

  // Event handlers
  private handleConnect(): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    this.callbacks.onConnect?.();
  }

  private handleDisconnect(): void {
    console.log('WebSocket disconnected');
    this.callbacks.onDisconnect?.();
    this.attemptReconnect();
  }

  private handleError(error: unknown): void {
    console.error('WebSocket error:', error);
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.callbacks.onError?.(errorObj);
  }

  private handleHealthCalendarEvent(event: HealthCalendarEvent): void {
    console.log('Received health calendar event:', event);
    
    switch (event.type) {
      case 'health_event_created':
      case 'health_event_updated':
      case 'health_event_deleted':
        this.callbacks.onHealthEventUpdate?.(event);
        break;
      
      case 'daily_checkin_created':
      case 'daily_checkin_updated':
        this.callbacks.onDailyCheckinUpdate?.(event);
        break;
      
      case 'notification_created':
        this.callbacks.onNotificationUpdate?.(event);
        break;
      
      case 'streak_updated':
        this.callbacks.onStreakUpdate?.(event);
        break;
      
      case 'pattern_analyzed':
        this.callbacks.onPatternUpdate?.(event);
        break;
      
      default:
        console.warn('Unknown health calendar event type:', event.type);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionState(): string {
    if (!this.socket) return 'disconnected';
    if (this.isConnecting) return 'connecting';
    return this.socket.connected ? 'connected' : 'disconnected';
  }
}

// Singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;

// React hook for using WebSocket in components
export function useWebSocket(callbacks?: WebSocketCallbacks) {
  const { userId, getToken } = useAuth();
  const [connectionState, setConnectionState] = React.useState<string>('disconnected');
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!userId) return;

    const connectWebSocket = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('No authentication token available');

        await webSocketService.connect(userId, token);
        setConnectionState('connected');
        setError(null);

        // Subscribe to relevant events
        webSocketService.subscribeToHealthEvents(userId);
        webSocketService.subscribeToNotifications(userId);
        webSocketService.subscribeToStreaks(userId);

      } catch (err) {
        setError(err as Error);
        setConnectionState('error');
      }
    };

    connectWebSocket();

    // Set up callbacks
    if (callbacks) {
      webSocketService.setCallbacks({
        ...callbacks,
        onConnect: () => {
          setConnectionState('connected');
          setError(null);
          callbacks.onConnect?.();
        },
        onDisconnect: () => {
          setConnectionState('disconnected');
          callbacks.onDisconnect?.();
        },
        onError: (err) => {
          setError(err);
          setConnectionState('error');
          callbacks.onError?.(err);
        }
      });
    }

    return () => {
      webSocketService.disconnect();
    };
  }, [userId, getToken]);

  return {
    connectionState,
    error,
    isConnected: connectionState === 'connected',
    emitHealthEvent: webSocketService.emitHealthEvent.bind(webSocketService),
    service: webSocketService
  };
}

// Import React for the hook
import React from 'react';