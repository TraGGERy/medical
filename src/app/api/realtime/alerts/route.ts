import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  getActiveAlerts,
  resolveAlert,
  createHealthAlert,
  setupDefaultThresholds
} from '@/lib/services/realtimeMonitoringService';
import { markAlertAsRead } from '@/lib/services/websocketService';
import { z } from 'zod';

/**
 * Alerts API Route for Real-time Health Monitoring
 * Handles health alerts, thresholds, and notifications
 */

// Validation schemas
const alertQuerySchema = z.object({
  status: z.enum(['active', 'resolved', 'all']).optional().default('active'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

const createAlertSchema = z.object({
  alertType: z.enum(['threshold_exceeded', 'anomaly_detected', 'missing_data', 'device_disconnected']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string(),
  message: z.string(),
  dataType: z.string().optional(),
  triggerValue: z.number().optional(),
  thresholdValue: z.number().optional(),
  dataSnapshot: z.record(z.any()).optional(),
});

const resolveAlertSchema = z.object({
  alertId: z.string(),
  resolution: z.string(),
  resolvedBy: z.string().optional(),
});

const thresholdSchema = z.object({
  dataType: z.enum(['heart_rate', 'blood_pressure', 'temperature', 'oxygen_saturation', 'steps', 'sleep', 'weight', 'glucose']),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  enabled: z.boolean().default(true),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = alertQuerySchema.parse(queryParams);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'active':
      case null:
      case undefined:
        // Get active alerts (default)
        const alerts = await getActiveAlerts(userId, {
          severity: validatedQuery.severity,
          limit: validatedQuery.limit ? parseInt(validatedQuery.limit) : 50,
          offset: validatedQuery.offset ? parseInt(validatedQuery.offset) : 0,
        });

        return Response.json({
          success: true,
          alerts,
          count: alerts.length,
          timestamp: new Date().toISOString(),
        });

      case 'stats':
        // Get alert statistics
        const allAlerts = await getActiveAlerts(userId);
        const stats = {
          total: allAlerts.length,
          critical: allAlerts.filter((a: any) => a.severity === 'critical').length,
          high: allAlerts.filter((a: any) => a.severity === 'high').length,
          medium: allAlerts.filter((a: any) => a.severity === 'medium').length,
          low: allAlerts.filter((a: any) => a.severity === 'low').length,
          unread: allAlerts.filter((a: any) => !a.isRead).length,
        };

        return Response.json({
          success: true,
          stats,
          timestamp: new Date().toISOString(),
        });

      default:
        return Response.json({ error: 'Invalid action parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('Alerts GET error:', error);
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'create':
        // Create a new health alert
        const validatedAlert = createAlertSchema.parse(body);
        
        const alertResult = await createHealthAlert({
          userId,
          alertType: validatedAlert.alertType,
          severity: validatedAlert.severity,
          title: validatedAlert.title,
          message: validatedAlert.message,
          dataSnapshot: validatedAlert.dataSnapshot,
        });

        return Response.json(alertResult);

      case 'resolve':
        // Resolve an existing alert
        const validatedResolve = resolveAlertSchema.parse(body);
        
        const resolveResult = await resolveAlert(
          validatedResolve.alertId,
          validatedResolve.resolution
        );

        return Response.json(resolveResult);

      case 'mark_read':
        // Mark alert as read
        const { alertId } = body;
        if (!alertId) {
          return Response.json({ error: 'Alert ID is required' }, { status: 400 });
        }

        const readResult = await markAlertAsRead(alertId, userId);
        return Response.json(readResult);

      case 'setup_thresholds':
        // Setup default thresholds for user
        const setupResult = await setupDefaultThresholds(userId);
        return Response.json(setupResult);

      case 'update_threshold':
        // Update specific threshold
        const validatedThreshold = thresholdSchema.parse(body);
        
        // Note: This would require implementing updateThreshold function
        return Response.json({ 
          success: true, 
          message: 'Threshold update not yet implemented',
          threshold: validatedThreshold 
        });

      default:
        return Response.json({ error: 'Invalid action parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('Alerts POST error:', error);
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const url = new URL(request.url);
    const alertId = url.searchParams.get('id');
    
    if (!alertId) {
      return Response.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    const { status, notes } = body;
    
    if (status === 'resolved') {
      const resolveResult = await resolveAlert(alertId, notes || 'Resolved via API');
      return Response.json(resolveResult);
    }
    
    // For other status updates, implement as needed
    return Response.json({ 
      success: true, 
      message: 'Alert status update not fully implemented',
      alertId,
      status 
    });
  } catch (error) {
    console.error('Alerts PUT error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const alertId = url.searchParams.get('id');
    
    if (!alertId) {
      return Response.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    // Note: Implementation would require adding a delete function to the service
    // For now, return a placeholder response
    return Response.json({ 
      success: true, 
      message: 'Alert deletion not yet implemented',
      alertId 
    });
  } catch (error) {
    console.error('Alerts DELETE error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}