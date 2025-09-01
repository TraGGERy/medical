import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer } from 'http';

interface AuthenticatedSocket extends Socket {
  userId: string;
}

// WebSocket server instance
let io: SocketIOServer | null = null;

// Store active connections by user ID
export const userConnections = new Map<string, Set<string>>();

// Initialize WebSocket server
export function initializeWebSocketServer() {
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
  io.use(async (socket: Socket, next) => {
    try {
      const userId = socket.handshake.auth.userId;

      if (!userId) {
        return next(new Error('Authentication failed: No user ID'));
      }

      (socket as AuthenticatedSocket).userId = userId;
      next();
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Handle connections
  io.on('connection', (socket: Socket) => {
    const userId = (socket as AuthenticatedSocket).userId;
    console.log(`User ${userId} connected via WebSocket`);

    // Add to user connections
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId)!.add(socket.id);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Handle health data updates
    socket.on('health-data-update', (data) => {
      console.log(`Health data update from user ${userId}:`, data);
      
      // Broadcast to all connections for this user
      socket.to(`user:${userId}`).emit('health-data-updated', {
        userId,
        timestamp: new Date().toISOString(),
        ...data
      });
    });

    // Handle real-time monitoring events
    socket.on('start-monitoring', (data) => {
      console.log(`Starting monitoring for user ${userId}:`, data);
      socket.join(`monitoring:${userId}`);
      
      // Acknowledge monitoring start
      socket.emit('monitoring-started', {
        userId,
        sessionId: data.sessionId || socket.id,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('stop-monitoring', () => {
      console.log(`Stopping monitoring for user ${userId}`);
      socket.leave(`monitoring:${userId}`);
      
      socket.emit('monitoring-stopped', {
        userId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle vital signs data
    socket.on('vital-signs', (data) => {
      console.log(`Vital signs from user ${userId}:`, data);
      
      // Broadcast to monitoring room
      socket.to(`monitoring:${userId}`).emit('vital-signs-update', {
        userId,
        timestamp: new Date().toISOString(),
        ...data
      });
    });

    // Handle emergency alerts
    socket.on('emergency-alert', (data) => {
      console.log(`Emergency alert from user ${userId}:`, data);
      
      // Broadcast emergency to all admin connections and user connections
      io!.emit('emergency-alert', {
        userId,
        timestamp: new Date().toISOString(),
        severity: 'high',
        ...data
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected from WebSocket`);
      
      // Remove from user connections
      const connections = userConnections.get(userId);
      if (connections) {
        connections.delete(socket.id);
        if (connections.size === 0) {
          userConnections.delete(userId);
        }
      }
    });
  });

  // Start the server
  const port = process.env.WEBSOCKET_PORT || 3001;
  httpServer.listen(port, () => {
    console.log(`WebSocket server running on port ${port}`);
  });

  return io;
}

export function broadcastHealthEvent(userId: string, eventType: string, data: Record<string, unknown>) {
  if (!io) {
    console.warn('WebSocket server not initialized');
    return;
  }

  console.log(`Broadcasting health event to user ${userId}:`, { eventType, data });
  
  // Send to all connections for this user
  io.to(`user:${userId}`).emit(eventType, {
    userId,
    timestamp: new Date().toISOString(),
    ...data
  });
}

export function broadcastToAllUsers(eventType: string, data: Record<string, unknown>) {
  if (!io) {
    console.warn('WebSocket server not initialized');
    return;
  }

  io.emit(eventType, {
    timestamp: new Date().toISOString(),
    ...data
  });
}

export function getUserConnectionCount(userId: string): number {
  return userConnections.get(userId)?.size || 0;
}

export function getActiveUsersCount(): number {
  return userConnections.size;
}

export function getWebSocketServer(): SocketIOServer | null {
  return io;
}