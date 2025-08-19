import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { parse } from 'url';
import { auth } from '@clerk/nextjs';
import jwt from 'jsonwebtoken';

// WebSocket server instance
let io: SocketIOServer | null = null;

// Store active connections by user ID
const userConnections = new Map<string, Set<string>>();

// Initialize WebSocket server
function initializeWebSocketServer() {
  if (io) return io;

  const httpServer = createServer();
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const userId = socket.handshake.auth.userId;

      if (!token || !userId) {
        return next(new Error('Authentication required'));
      }

      // Verify the token (you might want to use Clerk's verification here)
      // For now, we'll trust the token from the client
      socket.data.userId = userId;
      socket.data.authenticated = true;
      
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`User ${userId} connected with socket ${socket.id}`);

    // Add to user connections
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId)?.add(socket.id);

    // Join user-specific room
    socket.on('join_user_room', (data) => {
      const roomName = `user_${data || userId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room ${roomName}`);
    });

    // Subscribe to health events
    socket.on('subscribe_health_events', (data) => {
      const roomName = `health_events_${data.userId || userId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} subscribed to health events for user ${data.userId || userId}`);
    });

    // Subscribe to notifications
    socket.on('subscribe_notifications', (data) => {
      const roomName = `notifications_${data.userId || userId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} subscribed to notifications for user ${data.userId || userId}`);
    });

    // Subscribe to streaks
    socket.on('subscribe_streaks', (data) => {
      const roomName = `streaks_${data.userId || userId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} subscribed to streaks for user ${data.userId || userId}`);
    });

    // Handle health calendar updates from client
    socket.on('health_calendar_update', (data) => {
      console.log(`Received health calendar update from ${userId}:`, data);
      
      // Broadcast to other clients in the same user room
      socket.to(`user_${userId}`).emit('health_calendar_event', {
        ...data,
        userId,
        socketId: socket.id
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User ${userId} disconnected: ${reason}`);
      
      // Remove from user connections
      const userSockets = userConnections.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          userConnections.delete(userId);
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });
  });

  // Start the server
  const port = process.env.WEBSOCKET_PORT || 3001;
  httpServer.listen(port, () => {
    console.log(`WebSocket server running on port ${port}`);
  });

  return io;
}

// Utility functions for broadcasting events
export function broadcastHealthEvent(userId: string, eventType: string, data: Record<string, unknown>) {
  if (!io) return;
  
  const event = {
    type: eventType,
    data,
    userId,
    timestamp: new Date().toISOString()
  };

  // Broadcast to user's room
  io.to(`user_${userId}`).emit('health_calendar_event', event);
  
  // Also broadcast to specific subscription rooms
  if (eventType.includes('health_event')) {
    io.to(`health_events_${userId}`).emit('health_calendar_event', event);
  } else if (eventType.includes('notification')) {
    io.to(`notifications_${userId}`).emit('health_calendar_event', event);
  } else if (eventType.includes('streak')) {
    io.to(`streaks_${userId}`).emit('health_calendar_event', event);
  }
}

export function broadcastToAllUsers(eventType: string, data: Record<string, unknown>) {
  if (!io) return;
  
  io.emit('health_calendar_event', {
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  });
}

export function getUserConnectionCount(userId: string): number {
  return userConnections.get(userId)?.size || 0;
}

export function getActiveUsersCount(): number {
  return userConnections.size;
}

// API route handlers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        return Response.json({
          success: true,
          data: {
            serverRunning: !!io,
            activeUsers: getActiveUsersCount(),
            totalConnections: Array.from(userConnections.values())
              .reduce((total, sockets) => total + sockets.size, 0)
          }
        });

      case 'users':
        return Response.json({
          success: true,
          data: {
            activeUsers: Array.from(userConnections.keys()),
            connectionCounts: Object.fromEntries(
              Array.from(userConnections.entries()).map(([userId, sockets]) => [
                userId,
                sockets.size
              ])
            )
          }
        });

      default:
        return Response.json({
          success: true,
          data: {
            message: 'WebSocket API is running',
            endpoints: {
              status: '/api/websocket?action=status',
              users: '/api/websocket?action=users'
            }
          }
        });
    }
  } catch (error) {
    console.error('WebSocket API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, eventType, data } = body;

    // Verify authentication
    const { userId: authUserId } = auth();
    if (!authUserId) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'broadcast':
        if (!userId || !eventType || !data) {
          return Response.json(
            { success: false, error: 'Missing required fields: userId, eventType, data' },
            { status: 400 }
          );
        }
        
        broadcastHealthEvent(userId, eventType, data);
        return Response.json({
          success: true,
          message: 'Event broadcasted successfully'
        });

      case 'broadcast_all':
        if (!eventType || !data) {
          return Response.json(
            { success: false, error: 'Missing required fields: eventType, data' },
            { status: 400 }
          );
        }
        
        broadcastToAllUsers(eventType, data);
        return Response.json({
          success: true,
          message: 'Event broadcasted to all users successfully'
        });

      case 'initialize':
        const server = initializeWebSocketServer();
        return Response.json({
          success: true,
          message: 'WebSocket server initialized',
          running: !!server
        });

      default:
        return Response.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('WebSocket API POST error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Initialize WebSocket server when this module is loaded
if (process.env.NODE_ENV !== 'test') {
  initializeWebSocketServer();
}