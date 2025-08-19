import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { healthNotifications } from '@/drizzle/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const notificationSchema = z.object({
  notificationType: z.enum(['persistent_symptom', 'medication_reminder', 'streak_milestone', 'health_alert', 'appointment_reminder']),
  title: z.string().min(1),
  message: z.string().min(1),
  triggerCondition: z.record(z.any()).optional(),
  scheduledAt: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  metadata: z.record(z.any()).optional()
});

const updateNotificationSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'sent', 'failed', 'cancelled']).optional(),
  sentAt: z.string().optional(),
  errorMessage: z.string().optional()
});

// POST - Create new notification
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = notificationSchema.parse(body);

    const [newNotification] = await db
      .insert(healthNotifications)
      .values({
        userId,
        notificationType: validatedData.notificationType,
        title: validatedData.title,
        message: validatedData.message,
        triggerCondition: validatedData.triggerCondition ? JSON.stringify(validatedData.triggerCondition) : null,
        scheduledAt: validatedData.scheduledAt || new Date().toISOString(),
        priority: validatedData.priority,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null
      })
      .returning();

    return NextResponse.json({ success: true, notification: newNotification });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// GET - Retrieve notifications
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const notificationType = searchParams.get('notificationType');
    const priority = searchParams.get('priority');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereConditions = [eq(healthNotifications.userId, userId)];

    if (status) {
      whereConditions.push(eq(healthNotifications.status, status));
    }

    if (notificationType) {
      whereConditions.push(eq(healthNotifications.notificationType, notificationType));
    }

    if (priority) {
      whereConditions.push(eq(healthNotifications.priority, priority));
    }

    if (startDate) {
      whereConditions.push(gte(healthNotifications.scheduledAt, startDate));
    }

    if (endDate) {
      whereConditions.push(lte(healthNotifications.scheduledAt, endDate));
    }

    const notifications = await db
      .select()
      .from(healthNotifications)
      .where(and(...whereConditions))
      .orderBy(desc(healthNotifications.scheduledAt))
      .limit(limit)
      .offset(offset);

    // Parse JSON fields
    const notificationsWithParsedData = notifications.map(notification => ({
      ...notification,
      triggerCondition: notification.triggerCondition ? JSON.parse(notification.triggerCondition as string) : {},
      metadata: notification.metadata ? JSON.parse(notification.metadata as string) : {}
    }));

    return NextResponse.json({ notifications: notificationsWithParsedData });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PUT - Update notification status
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateNotificationSchema.parse(body);

    // Verify ownership
    const [existingNotification] = await db
      .select()
      .from(healthNotifications)
      .where(
        and(
          eq(healthNotifications.id, validatedData.id),
          eq(healthNotifications.userId, userId)
        )
      )
      .limit(1);

    if (!existingNotification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const updateData: Partial<{
      status: string;
      sentAt: string | null;
      errorMessage: string | null;
      updatedAt: string;
    }> = {
      updatedAt: new Date().toISOString()
    };

    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.sentAt) updateData.sentAt = validatedData.sentAt;
    if (validatedData.errorMessage !== undefined) updateData.errorMessage = validatedData.errorMessage;

    const [updatedNotification] = await db
      .update(healthNotifications)
      .set(updateData)
      .where(eq(healthNotifications.id, validatedData.id))
      .returning();

    return NextResponse.json({ success: true, notification: updatedNotification });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE - Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    // Verify ownership
    const [existingNotification] = await db
      .select()
      .from(healthNotifications)
      .where(
        and(
          eq(healthNotifications.id, notificationId),
          eq(healthNotifications.userId, userId)
        )
      )
      .limit(1);

    if (!existingNotification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    await db.delete(healthNotifications).where(eq(healthNotifications.id, notificationId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}

// POST - Send pending notifications (for cron job or manual trigger)
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pending notifications that are due
    const now = new Date().toISOString();
    const pendingNotifications = await db
      .select()
      .from(healthNotifications)
      .where(
        and(
          eq(healthNotifications.userId, userId),
          eq(healthNotifications.status, 'pending'),
          lte(healthNotifications.scheduledAt, now)
        )
      )
      .limit(10); // Process max 10 at a time

    const results = [];

    for (const notification of pendingNotifications) {
      try {
        // Get user email from Clerk
        const userEmail = await getUserEmail(userId);
        if (!userEmail) {
          throw new Error('User email not found');
        }

        // Send email notification
        const emailResult = await sendEmailNotification({
          to: userEmail,
          subject: notification.title,
          message: notification.message,
          notificationType: notification.notificationType,
          priority: notification.priority
        });

        // Update notification status
        await db
          .update(healthNotifications)
          .set({
            status: 'sent',
            sentAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .where(eq(healthNotifications.id, notification.id));

        results.push({
          id: notification.id,
          status: 'sent',
          emailId: emailResult.id
        });
      } catch (error) {
        console.error(`Error sending notification ${notification.id}:`, error);
        
        // Update notification with error
        await db
          .update(healthNotifications)
          .set({
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            updatedAt: new Date().toISOString()
          })
          .where(eq(healthNotifications.id, notification.id));

        results.push({
          id: notification.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    });
  } catch (error) {
    console.error('Error processing notifications:', error);
    return NextResponse.json(
      { error: 'Failed to process notifications' },
      { status: 500 }
    );
  }
}

// Helper function to get user email from Clerk
async function getUserEmail(userId: string): Promise<string | null> {
  try {
    // In a real implementation, you would fetch from Clerk API
    // For now, we'll use a placeholder
    // const clerkUser = await clerkClient.users.getUser(userId);
    // return clerkUser.emailAddresses[0]?.emailAddress || null;
    
    // Placeholder - in production, integrate with Clerk API
    return 'user@example.com';
  } catch (error) {
    console.error('Error fetching user email:', error);
    return null;
  }
}

// Helper function to send email notifications
async function sendEmailNotification({
  to,
  subject,
  message,
  notificationType,
  priority
}: {
  to: string;
  subject: string;
  message: string;
  notificationType: string;
  priority: string;
}) {
  const emailTemplate = getEmailTemplate(notificationType, message, priority);
  
  const result = await resend.emails.send({
    from: 'Health Calendar <noreply@healthcalendar.com>',
    to: [to],
    subject: subject,
    html: emailTemplate
  });

  return result;
}

// Helper function to generate email templates
function getEmailTemplate(notificationType: string, message: string, priority: string): string {
  const priorityColor = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444'
  }[priority] || '#6B7280';

  const iconMap = {
    persistent_symptom: '⚠️',
    medication_reminder: '💊',
    streak_milestone: '🎉',
    health_alert: '🚨',
    appointment_reminder: '📅'
  };

  const icon = iconMap[notificationType as keyof typeof iconMap] || '📋';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Health Calendar Notification</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${icon} Health Calendar</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your Health Companion</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid ${priorityColor}; margin-bottom: 25px;">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <span style="font-size: 24px; margin-right: 10px;">${icon}</span>
          <span style="background: ${priorityColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${priority} Priority</span>
        </div>
        <p style="font-size: 16px; margin: 0; line-height: 1.5;">${message}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">View in Health Calendar</a>
      </div>
      
      <div style="border-top: 1px solid #e9ecef; padding-top: 20px; text-align: center; color: #6c757d; font-size: 14px;">
        <p>This notification was sent from your Health Calendar system.</p>
        <p>If you no longer wish to receive these notifications, you can update your preferences in the app.</p>
      </div>
    </body>
    </html>
  `;
}