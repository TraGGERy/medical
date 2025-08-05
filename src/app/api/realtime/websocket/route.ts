import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { WebSocketServer } from 'ws';
import { registerConnection } from '@/lib/services/websocketService';
import { v4 as uuidv4 } from 'uuid';

/**
 * WebSocket API Route for Real-time Communication
 * Handles WebSocket connections for real-time health monitoring
 */

// Global WebSocket server instance
let wss: WebSocketServer | null = null;

// Initialize WebSocket server if not already created
function initializeWebSocketServer() {
  if (!wss) {
    wss = new WebSocketServer({ 
      port: 8080,
      path: '/api/realtime/websocket'
    });
    
    console.log('WebSocket server initialized on port 8080');
  }
  return wss;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check if this is a WebSocket upgrade request
    const upgrade = request.headers.get('upgrade');
    if (upgrade !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 400 });
    }

    // Initialize WebSocket server
    const server = initializeWebSocketServer();
    
    // Handle WebSocket connection
    server.on('connection', async (websocket, request) => {
      const connectionId = uuidv4();
      const userAgent = request.headers['user-agent'];
      const ip = request.socket.remoteAddress;
      
      const deviceInfo = {
        userAgent,
        ip,
        connectedAt: new Date().toISOString(),
      };

      // Register the connection
      const result = await registerConnection(userId, connectionId, websocket, deviceInfo);
      
      if (result.success) {
        // Send welcome message
        websocket.send(JSON.stringify({
          type: 'connection_established',
          connectionId,
          timestamp: new Date().toISOString(),
          message: 'Real-time health monitoring connected',
        }));
        
        console.log(`WebSocket connected: ${connectionId} for user ${userId}`);
      } else {
        console.error('Failed to register WebSocket connection:', result.error);
        websocket.close(1011, 'Failed to register connection');
      }
    });

    return new Response('WebSocket server running', { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('WebSocket route error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Handle WebSocket upgrade for Next.js
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case 'health_data':
        const { storeHealthData } = await import('@/lib/services/realtimeMonitoringService');
        const result = await storeHealthData({
          userId,
          dataType: data.dataType,
          value: data.value,
          unit: data.unit,
          source: data.source || 'manual',
          timestamp: new Date(data.timestamp || Date.now()),
        });
        
        return Response.json(result);
        
      case 'get_connection_info':
        const { getConnectionStats } = await import('@/lib/services/websocketService');
        const stats = await getConnectionStats();
        return Response.json(stats);
        
      default:
        return Response.json({ error: 'Unknown request type' }, { status: 400 });
    }
  } catch (error) {
    console.error('WebSocket POST error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Cleanup function for graceful shutdown
process.on('SIGTERM', () => {
  if (wss) {
    wss.close(() => {
      console.log('WebSocket server closed');
    });
  }
});

process.on('SIGINT', () => {
  if (wss) {
    wss.close(() => {
      console.log('WebSocket server closed');
    });
  }
});