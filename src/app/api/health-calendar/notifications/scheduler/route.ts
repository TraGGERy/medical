import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { notificationScheduler } from '@/lib/notifications/notification-scheduler';
import { z } from 'zod';

// Schema for scheduler control requests
const schedulerActionSchema = z.object({
  action: z.enum(['start', 'stop', 'status', 'trigger', 'config']),
  triggerType: z.enum(['persistentHealth', 'medicationReminders', 'streakMilestones']).optional(),
  config: z.object({
    persistentHealthCheckInterval: z.number().min(60000).optional(), // min 1 minute
    medicationReminderInterval: z.number().min(60000).optional(),
    streakMilestoneInterval: z.number().min(60000).optional(),
    maxRetries: z.number().min(1).max(10).optional(),
    retryDelay: z.number().min(30000).optional() // min 30 seconds
  }).optional()
});

/**
 * POST /api/health-calendar/notifications/scheduler
 * Control the notification scheduler
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For now, only allow admin users to control the scheduler
    // In a real app, you'd check user roles/permissions
    const isAdmin = process.env.ADMIN_USER_IDS?.split(',').includes(userId) || false;
    if (!isAdmin && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = schedulerActionSchema.parse(body);

    switch (validatedData.action) {
      case 'start':
        notificationScheduler.start();
        return NextResponse.json({
          message: 'Notification scheduler started',
          status: notificationScheduler.getStatus()
        });

      case 'stop':
        notificationScheduler.stop();
        return NextResponse.json({
          message: 'Notification scheduler stopped',
          status: notificationScheduler.getStatus()
        });

      case 'status':
        return NextResponse.json({
          status: notificationScheduler.getStatus()
        });

      case 'trigger':
        if (!validatedData.triggerType) {
          return NextResponse.json(
            { error: 'triggerType is required for trigger action' },
            { status: 400 }
          );
        }
        
        await notificationScheduler.triggerCheck(validatedData.triggerType);
        return NextResponse.json({
          message: `Triggered ${validatedData.triggerType} check`,
          status: notificationScheduler.getStatus()
        });

      case 'config':
        if (!validatedData.config) {
          return NextResponse.json(
            { error: 'config is required for config action' },
            { status: 400 }
          );
        }
        
        notificationScheduler.updateConfig(validatedData.config);
        return NextResponse.json({
          message: 'Scheduler configuration updated',
          status: notificationScheduler.getStatus()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error controlling notification scheduler:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/health-calendar/notifications/scheduler
 * Get scheduler status
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Allow any authenticated user to view scheduler status
    const status = notificationScheduler.getStatus();
    
    return NextResponse.json({
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}