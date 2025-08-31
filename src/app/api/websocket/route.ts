import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  initializeWebSocketServer, 
  broadcastHealthEvent, 
  broadcastToAllUsers, 
  getUserConnectionCount, 
  getActiveUsersCount 
} from '@/lib/websocket';

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
    const { userId: authUserId } = await auth();
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