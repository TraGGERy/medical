import { Resend } from 'resend';
import { db } from '@/lib/db';
import { healthEvents, healthNotifications, users } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const resend = new Resend(process.env.RESEND_API_KEY);

interface NotificationData {
  userId: string;
  userEmail: string;
  userName: string;
  symptom: string;
  dayCount: number;
  severity: number;
  firstOccurrence: string;
  lastOccurrence: string;
  occurrences: Array<{
    date: string;
    severity: number;
    description?: string;
  }>;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailNotificationService {
  private static instance: EmailNotificationService;
  
  public static getInstance(): EmailNotificationService {
    if (!EmailNotificationService.instance) {
      EmailNotificationService.instance = new EmailNotificationService();
    }
    return EmailNotificationService.instance;
  }

  /**
   * Check for persistent health events and send notifications
   */
  async checkPersistentHealthEvents(): Promise<void> {
    try {
      console.log('Starting persistent health events check...');
      
      const persistentEvents = await this.findPersistentSymptoms();
      
      for (const event of persistentEvents) {
        await this.sendPersistentSymptomNotification(event);
      }
      
      console.log(`Processed ${persistentEvents.length} persistent health events`);
    } catch (error) {
      console.error('Error checking persistent health events:', error);
      throw error;
    }
  }

  /**
   * Find symptoms that have persisted for 5+ consecutive days
   */
  private async findPersistentSymptoms(): Promise<NotificationData[]> {
    const fiveDaysAgo = subDays(new Date(), 5);
    const today = new Date();
    
    // Get all health events from the last 7 days (to account for gaps)
    const recentEvents = await db
      .select({
        userId: healthEvents.userId,
        eventType: healthEvents.eventType,
        title: healthEvents.title,
        description: healthEvents.description,
        severity: healthEvents.severity,
        startDate: healthEvents.startDate,
        createdAt: healthEvents.createdAt
      })
      .from(healthEvents)
      .where(
        and(
          eq(healthEvents.eventType, 'symptom'),
          gte(healthEvents.startDate, subDays(today, 7))
        )
      )
      .orderBy(desc(healthEvents.startDate));

    // Group events by user and symptom
    const groupedEvents = new Map<string, Map<string, typeof recentEvents>>();
    
    for (const event of recentEvents) {
      const userKey = event.userId;
      const symptomKey = event.title.toLowerCase().trim();
      
      if (!groupedEvents.has(userKey)) {
        groupedEvents.set(userKey, new Map());
      }
      
      const userEvents = groupedEvents.get(userKey)!;
      if (!userEvents.has(symptomKey)) {
        userEvents.set(symptomKey, []);
      }
      
      userEvents.get(symptomKey)!.push(event);
    }

    const persistentEvents: NotificationData[] = [];
    
    // Check each user's symptoms for persistence
    for (const [userId, userSymptoms] of groupedEvents) {
      // Get user details
      const user = await db
        .select({
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (user.length === 0) continue;
      
      const userData = user[0];
      const userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User';
      
      for (const [symptom, events] of userSymptoms) {
        const consecutiveDays = this.checkConsecutiveDays(events.map(e => ({
          ...e,
          startDate: e.startDate.toISOString()
        })).map(e => ({
          ...e,
          startDate: e.startDate
        })), 5);
        
        if (consecutiveDays.length >= 5) {
          // Check if we've already sent a notification for this symptom recently
          const recentNotification = await this.hasRecentNotification(
            userId,
            symptom,
            'persistent_symptom'
          );
          
          if (!recentNotification) {
            const avgSeverity = consecutiveDays.reduce((sum, e) => sum + (e.severity || 0), 0) / consecutiveDays.length;
            
            persistentEvents.push({
              userId,
              userEmail: userData.email,
              userName,
              symptom,
              dayCount: consecutiveDays.length,
              severity: avgSeverity,
              firstOccurrence: consecutiveDays[consecutiveDays.length - 1].startDate,
              lastOccurrence: consecutiveDays[0].startDate,
              occurrences: consecutiveDays.map(e => ({

                date: e.startDate,
                severity: e.severity || 0,
                description: typeof e.description === 'string' ? e.description : undefined
              }))
            });
          }
        }
      }
    }
    
    return persistentEvents;
  }

  /**
   * Check if events represent consecutive days
   */
  private checkConsecutiveDays(events: { startDate: string; severity: number | null; [key: string]: unknown }[], minDays: number): { startDate: string; severity: number | null; [key: string]: unknown }[] {
    if (events.length < minDays) return [];
    
    // Sort events by date (most recent first)
    const sortedEvents = events.sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    
    const consecutiveEvents = [sortedEvents[0]];
    let currentDate = new Date(sortedEvents[0].startDate);
    
    for (let i = 1; i < sortedEvents.length; i++) {
      const eventDate = new Date(sortedEvents[i].startDate);
      const expectedDate = subDays(currentDate, 1);
      
      // Check if this event is from the previous day
      if (format(eventDate, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
        consecutiveEvents.push(sortedEvents[i]);
        currentDate = eventDate;
      } else {
        // Break in consecutive days
        break;
      }
    }
    
    return consecutiveEvents.length >= minDays ? consecutiveEvents : [];
  }

  /**
   * Check if a notification was sent recently for this symptom
   */
  private async hasRecentNotification(
    userId: string,
    symptom: string,
    notificationType: string
  ): Promise<boolean> {
    const threeDaysAgo = subDays(new Date(), 3);
    
    const recentNotifications = await db
      .select()
      .from(healthNotifications)
      .where(
        and(
          eq(healthNotifications.userId, userId),
          eq(healthNotifications.notificationType, notificationType),
          sql`(trigger_condition->>'symptom') = ${symptom}`,
          gte(healthNotifications.createdAt, threeDaysAgo)
        )
      )
      .limit(1);
    
    return recentNotifications.length > 0;
  }

  /**
   * Send persistent symptom notification
   */
  private async sendPersistentSymptomNotification(data: NotificationData): Promise<void> {
    try {
      const template = this.generatePersistentSymptomTemplate(data);
      
      // Send email
      const emailResult = await resend.emails.send({
        from: 'Health Assistant <health@yourdomain.com>',
        to: [data.userEmail],
        subject: template.subject,
        html: template.html,
        text: template.text
      });
      
      if (emailResult.error) {
        throw new Error(`Failed to send email: ${emailResult.error.message}`);
      }
      
      // Log notification in database
      await db.insert(healthNotifications).values([{
        userId: data.userId,
        notificationType: 'persistent_symptom',
        title: `Persistent ${data.symptom} Alert`,
        message: `You've reported ${data.symptom} for ${data.dayCount} consecutive days.`,
        triggerCondition: {
          symptom: data.symptom,
          dayCount: data.dayCount,
          severity: data.severity,
          occurrences: data.occurrences,
          emailId: emailResult.data?.id
        },
        emailSent: true,
        sentAt: new Date()
      }]);
      
      console.log(`Sent persistent symptom notification to ${data.userEmail} for ${data.symptom}`);
    } catch (error) {
      console.error('Error sending persistent symptom notification:', error);
      throw error;
    }
  }

  /**
   * Generate email template for persistent symptoms
   */
  private generatePersistentSymptomTemplate(data: NotificationData): EmailTemplate {
    const severityText = data.severity >= 7 ? 'high' : data.severity >= 4 ? 'moderate' : 'mild';
    const urgencyText = data.severity >= 7 ? 'We strongly recommend consulting with a healthcare provider.' : 
                       data.severity >= 4 ? 'Consider discussing this with your healthcare provider.' : 
                       'Continue monitoring and consider consulting a healthcare provider if symptoms worsen.';
    
    const subject = `Health Alert: ${data.symptom} persisting for ${data.dayCount} days`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Health Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert-box { background: ${data.severity >= 7 ? '#fee2e2' : data.severity >= 4 ? '#fef3c7' : '#dbeafe'}; 
                      border-left: 4px solid ${data.severity >= 7 ? '#dc2626' : data.severity >= 4 ? '#d97706' : '#2563eb'}; 
                      padding: 20px; margin: 20px 0; border-radius: 5px; }
          .symptom-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .timeline { margin: 15px 0; }
          .timeline-item { padding: 10px; border-left: 3px solid #e5e7eb; margin-left: 10px; }
          .cta-button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏥 Health Alert</h1>
          <p>Important update about your health tracking</p>
        </div>
        
        <div class="content">
          <p>Hello ${data.userName},</p>
          
          <div class="alert-box">
            <h2>⚠️ Persistent Symptom Detected</h2>
            <p><strong>You've reported "${data.symptom}" for ${data.dayCount} consecutive days.</strong></p>
            <p>Average severity: ${data.severity.toFixed(1)}/10 (${severityText})</p>
          </div>
          
          <div class="symptom-details">
            <h3>📊 Symptom Timeline</h3>
            <p><strong>First occurrence:</strong> ${format(new Date(data.firstOccurrence), 'MMMM d, yyyy')}</p>
            <p><strong>Most recent:</strong> ${format(new Date(data.lastOccurrence), 'MMMM d, yyyy')}</p>
            
            <div class="timeline">
              <h4>Recent occurrences:</h4>
              ${data.occurrences.slice(0, 5).map(occ => `
                <div class="timeline-item">
                  <strong>${format(new Date(occ.date), 'MMM d')}</strong> - Severity: ${occ.severity}/10
                  ${occ.description ? `<br><em>${occ.description}</em>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="alert-box">
            <h3>💡 Recommendation</h3>
            <p>${urgencyText}</p>
            <p>Persistent symptoms may indicate an underlying condition that requires medical attention.</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/health-calendar" class="cta-button">
              View Full Health Calendar
            </a>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px;">
            <h4>🔍 What you can do:</h4>
            <ul>
              <li>Schedule an appointment with your healthcare provider</li>
              <li>Continue tracking symptoms in your health calendar</li>
              <li>Note any patterns or triggers you've observed</li>
              <li>Prepare a summary of your symptoms for your doctor</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated health alert from your personal health tracking system.</p>
          <p>If you have any concerns, please consult with a healthcare professional.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications">Manage notification preferences</a></p>
        </div>
      </body>
      </html>
    `;
    
    const text = `
      Health Alert: ${data.symptom} persisting for ${data.dayCount} days
      
      Hello ${data.userName},
      
      You've reported "${data.symptom}" for ${data.dayCount} consecutive days with an average severity of ${data.severity.toFixed(1)}/10 (${severityText}).
      
      Timeline:
      - First occurrence: ${format(new Date(data.firstOccurrence), 'MMMM d, yyyy')}
      - Most recent: ${format(new Date(data.lastOccurrence), 'MMMM d, yyyy')}
      
      Recommendation: ${urgencyText}
      
      Persistent symptoms may indicate an underlying condition that requires medical attention.
      
      What you can do:
      - Schedule an appointment with your healthcare provider
      - Continue tracking symptoms in your health calendar
      - Note any patterns or triggers you've observed
      - Prepare a summary of your symptoms for your doctor
      
      View your full health calendar: ${process.env.NEXT_PUBLIC_APP_URL}/health-calendar
      
      This is an automated health alert. If you have concerns, please consult with a healthcare professional.
    `;
    
    return { subject, html, text };
  }

  /**
   * Send medication reminder notifications
   */
  async sendMedicationReminders(): Promise<void> {
    try {
      console.log('Checking medication reminders...');
      
      // This would typically check for scheduled medications
      // and send reminders based on user preferences
      // Implementation depends on medication scheduling system
      
      console.log('Medication reminders check completed');
    } catch (error) {
      console.error('Error sending medication reminders:', error);
      throw error;
    }
  }

  /**
   * Send streak milestone notifications
   */
  async sendStreakMilestoneNotifications(): Promise<void> {
    try {
      console.log('Checking streak milestones...');
      
      // This would check for users who have reached streak milestones
      // and send congratulatory emails
      // Implementation depends on streak tracking system
      
      console.log('Streak milestone notifications check completed');
    } catch (error) {
      console.error('Error sending streak milestone notifications:', error);
      throw error;
    }
  }
}

export const emailNotificationService = EmailNotificationService.getInstance();