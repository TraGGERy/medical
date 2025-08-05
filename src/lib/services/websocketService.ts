'use server';

import { db } from '@/lib/db';
import {
  websocketConnections,
  notificationQueue,
  type NewWebsocketConnection,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { WebSocket } from 'ws';

/**
 * WebSocket Service for Real-time Communication
 * Handles WebSocket connections, message broadcasting, and real-time updates
 */

// In-memory store for active WebSocket connections
// In production, this should be replaced with Redis or similar
const activeConnections = new Map<string, WebSocket>();
const userConnections = new Map<string, Set<string>>(); // userId -> Set of connectionIds

/**
 * Register a new WebSocket connection
 */
interface DeviceInfo {
  userAgent?: string;
  platform?: string;
  deviceType?: string;
  [key: string]: unknown;
}

export async function registerConnection(
  userId: string,
  connectionId: string,
  websocket: WebSocket,
  deviceInfo?: DeviceInfo
) {
  try {
    // Store connection in database
    const connectionData: NewWebsocketConnection = {
      userId,
      connectionId,
      deviceInfo,
      isActive: true,
      lastPing: new Date(),
    };

    await db.insert(websocketConnections).values(connectionData);

    // Store in memory for real-time access
    activeConnections.set(connectionId, websocket);
    
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId)!.add(connectionId);

    // Set up WebSocket event handlers
    setupWebSocketHandlers(websocket, userId, connectionId);

    console.log(`WebSocket connection registered: ${connectionId} for user ${userId}`);
    
    return { success: true, connectionId };
  } catch (error) {
    console.error('Error registering WebSocket connection:', error);
    return { success: false, error: 'Failed to register connection' };
  }
}

/**
 * Set up WebSocket event handlers
 */
function setupWebSocketHandlers(websocket: WebSocket, userId: string, connectionId: string) {
  websocket.on('message', async (data: Buffer | string) => {
    try {
      const message = JSON.parse(data.toString());
      await handleWebSocketMessage(userId, connectionId, message);
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });

  websocket.on('ping', async () => {
    await updateLastPing(connectionId);
    websocket.pong();
  });

  websocket.on('close', async () => {
    await unregisterConnection(connectionId);
  });

  websocket.on('error', async (error: Error) => {
    console.error('WebSocket error:', error);
    await unregisterConnection(connectionId);
  });
}

/**
 * Handle incoming WebSocket messages
 */
interface WebSocketMessage {
  type: string;
  dataType?: string;
  value?: number;
  unit?: string;
  timestamp?: string;
  alertId?: string;
  [key: string]: unknown;
}

export async function handleWebSocketMessage(
  userId: string,
  connectionId: string,
  message: WebSocketMessage
) {
  try {
    switch (message.type) {
      case 'ping':
        await sendToConnection(connectionId, { type: 'pong', timestamp: new Date() });
        break;
        
      case 'subscribe_alerts':
        // Client wants to subscribe to real-time alerts
        await sendToConnection(connectionId, {
          type: 'subscription_confirmed',
          subscription: 'alerts',
        });
        break;
        
      case 'health_data':
        // Client is sending real-time health data
        const { storeHealthData } = await import('./realtimeMonitoringService');
        await storeHealthData({
          userId,
          dataType: message.dataType,
          value: message.value,
          unit: message.unit,
          source: 'manual',
          timestamp: new Date(message.timestamp || Date.now()),
        });
        break;
        
      case 'mark_alert_read':
        // Client is marking an alert as read
        await markAlertAsRead(message.alertId, userId);
        break;
        
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  } catch (error) {
    console.error('Error handling WebSocket message:', error);
  }
}

/**
 * Unregister a WebSocket connection
 */
export async function unregisterConnection(connectionId: string) {
  try {
    // Remove from memory
    const websocket = activeConnections.get(connectionId);
    if (websocket) {
      activeConnections.delete(connectionId);
    }

    // Find and remove from user connections
    for (const [userId, connections] of userConnections.entries()) {
      if (connections.has(connectionId)) {
        connections.delete(connectionId);
        if (connections.size === 0) {
          userConnections.delete(userId);
        }
        break;
      }
    }

    // Update database
    await db
      .update(websocketConnections)
      .set({
        isActive: false,
        disconnectedAt: new Date(),
      })
      .where(eq(websocketConnections.connectionId, connectionId));

    console.log(`WebSocket connection unregistered: ${connectionId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error unregistering WebSocket connection:', error);
    return { success: false, error: 'Failed to unregister connection' };
  }
}

/**
 * Send message to a specific connection
 */
export async function sendToConnection(connectionId: string, message: Record<string, unknown>) {
  try {
    const websocket = activeConnections.get(connectionId);
    if (websocket && websocket.readyState === 1) { // 1 = OPEN
      websocket.send(JSON.stringify(message));
      return { success: true };
    }
    return { success: false, error: 'Connection not found or not open' };
  } catch (error) {
    console.error('Error sending message to connection:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

/**
 * Send message to all connections of a user
 */
export async function sendToUser(userId: string, message: Record<string, unknown>) {
  try {
    const connections = userConnections.get(userId);
    if (!connections || connections.size === 0) {
      return { success: false, error: 'No active connections for user' };
    }

    let sentCount = 0;
    for (const connectionId of connections) {
      const result = await sendToConnection(connectionId, message);
      if (result.success) {
        sentCount++;
      }
    }

    return { success: true, sentCount, totalConnections: connections.size };
  } catch (error) {
    console.error('Error sending message to user:', error);
    return { success: false, error: 'Failed to send message to user' };
  }
}

/**
 * Broadcast message to all active connections
 */
export async function broadcastMessage(message: Record<string, unknown>, excludeUser?: string) {
  try {
    let sentCount = 0;
    
    for (const [connectionId, websocket] of activeConnections.entries()) {
      // Skip connections for excluded user
      if (excludeUser) {
        const userConnections = getUserConnectionIds(excludeUser);
        if (userConnections.has(connectionId)) {
          continue;
        }
      }
      
      if (websocket.readyState === 1) { // 1 = OPEN
        try {
          websocket.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error('Error sending to connection:', connectionId, error);
        }
      }
    }

    return { success: true, sentCount };
  } catch (error) {
    console.error('Error broadcasting message:', error);
    return { success: false, error: 'Failed to broadcast message' };
  }
}

/**
 * Get connection IDs for a user
 */
function getUserConnectionIds(userId: string): Set<string> {
  return userConnections.get(userId) || new Set();
}

/**
 * Update last ping timestamp for a connection
 */
export async function updateLastPing(connectionId: string) {
  try {
    await db
      .update(websocketConnections)
      .set({ lastPing: new Date() })
      .where(eq(websocketConnections.connectionId, connectionId));
    
    return { success: true };
  } catch (error) {
    console.error('Error updating last ping:', error);
    return { success: false, error: 'Failed to update ping' };
  }
}

/**
 * Process WebSocket notifications from the queue
 */
export async function processWebSocketNotifications() {
  try {
    // Get pending WebSocket notifications
    const notifications = await db
      .select()
      .from(notificationQueue)
      .where(
        and(
          eq(notificationQueue.notificationType, 'websocket'),
          eq(notificationQueue.status, 'pending')
        )
      )
      .limit(100);

    let processedCount = 0;
    
    for (const notification of notifications) {
      try {
        const message = {
          type: 'notification',
          id: notification.id,
          title: notification.title,
          message: notification.message,
          payload: notification.payload,
          timestamp: new Date(),
        };

        const result = await sendToUser(notification.userId, message);
        
        // Update notification status
        await db
          .update(notificationQueue)
          .set({
            status: result.success ? 'sent' : 'failed',
            sentAt: new Date(),
            attempts: (notification.attempts || 0) + 1,
            errorMessage: result.success ? null : result.error,
          })
          .where(eq(notificationQueue.id, notification.id));

        if (result.success) {
          processedCount++;
        }
      } catch (error) {
        console.error('Error processing notification:', notification.id, error);
        
        // Mark as failed
        await db
          .update(notificationQueue)
          .set({
            status: 'failed',
            attempts: (notification.attempts || 0) + 1,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          })
          .where(eq(notificationQueue.id, notification.id));
      }
    }

    return { success: true, processedCount, totalNotifications: notifications.length };
  } catch (error) {
    console.error('Error processing WebSocket notifications:', error);
    return { success: false, error: 'Failed to process notifications' };
  }
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId: string, userId: string) {
  try {
    const { healthAlerts } = await import('@/lib/db/schema');
    
    await db
      .update(healthAlerts)
      .set({ isRead: true })
      .where(
        and(
          eq(healthAlerts.id, alertId),
          eq(healthAlerts.userId, userId)
        )
      );

    return { success: true };
  } catch (error) {
    console.error('Error marking alert as read:', error);
    return { success: false, error: 'Failed to mark alert as read' };
  }
}

/**
 * Get connection statistics
 */
export async function getConnectionStats() {
  try {
    const totalActiveConnections = activeConnections.size;
    const totalActiveUsers = userConnections.size;
    
    // Get database stats
    const dbConnections = await db
      .select()
      .from(websocketConnections)
      .where(eq(websocketConnections.isActive, true));

    return {
      success: true,
      stats: {
        activeConnections: totalActiveConnections,
        activeUsers: totalActiveUsers,
        dbActiveConnections: dbConnections.length,
        averageConnectionsPerUser: totalActiveUsers > 0 ? totalActiveConnections / totalActiveUsers : 0,
      },
    };
  } catch (error) {
    console.error('Error getting connection stats:', error);
    return { success: false, error: 'Failed to get connection stats' };
  }
}

/**
 * Clean up stale connections
 */
export async function cleanupStaleConnections() {
  try {
    const staleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    
    // Mark stale connections as inactive in database
    await db
      .update(websocketConnections)
      .set({
        isActive: false,
        disconnectedAt: new Date(),
      })
      .where(
        and(
          eq(websocketConnections.isActive, true),
          // lastPing is older than threshold
        )
      );

    // Clean up memory connections that are no longer open
    const toRemove: string[] = [];
    for (const [connectionId, websocket] of activeConnections.entries()) {
      if (websocket.readyState !== 1) { // 1 = OPEN
        toRemove.push(connectionId);
      }
    }

    for (const connectionId of toRemove) {
      await unregisterConnection(connectionId);
    }

    return { success: true, cleanedUp: toRemove.length };
  } catch (error) {
    console.error('Error cleaning up stale connections:', error);
    return { success: false, error: 'Failed to cleanup connections' };
  }
}