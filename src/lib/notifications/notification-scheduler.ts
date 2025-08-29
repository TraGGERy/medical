import { emailNotificationService } from './email-service';
import { db } from '@/lib/db';
import { healthNotifications } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { subHours } from 'date-fns';

interface SchedulerConfig {
  persistentHealthCheckInterval: number; // in milliseconds
  medicationReminderInterval: number;
  streakMilestoneInterval: number;
  maxRetries: number;
  retryDelay: number;
}

const DEFAULT_CONFIG: SchedulerConfig = {
  persistentHealthCheckInterval: 6 * 60 * 60 * 1000, // 6 hours
  medicationReminderInterval: 60 * 60 * 1000, // 1 hour
  streakMilestoneInterval: 24 * 60 * 60 * 1000, // 24 hours
  maxRetries: 3,
  retryDelay: 5 * 60 * 1000 // 5 minutes
};

export class NotificationScheduler {
  private static instance: NotificationScheduler;
  private config: SchedulerConfig;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;
  private retryQueues: Map<string, Array<{ fn: () => Promise<void>; retries: number }>> = new Map();

  private constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeRetryQueues();
  }

  public static getInstance(config?: Partial<SchedulerConfig>): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler(config);
    }
    return NotificationScheduler.instance;
  }

  private initializeRetryQueues(): void {
    this.retryQueues.set('persistentHealth', []);
    this.retryQueues.set('medicationReminders', []);
    this.retryQueues.set('streakMilestones', []);
  }

  /**
   * Start the notification scheduler
   */
  public start(): void {
    if (this.isRunning) {
      console.log('Notification scheduler is already running');
      return;
    }

    console.log('Starting notification scheduler...');
    this.isRunning = true;

    // Schedule persistent health event checks
    this.scheduleTask(
      'persistentHealth',
      () => this.runWithRetry('persistentHealth', () => emailNotificationService.checkPersistentHealthEvents()),
      this.config.persistentHealthCheckInterval
    );

    // Schedule medication reminder checks
    this.scheduleTask(
      'medicationReminders',
      () => this.runWithRetry('medicationReminders', () => emailNotificationService.sendMedicationReminders()),
      this.config.medicationReminderInterval
    );

    // Schedule streak milestone checks
    this.scheduleTask(
      'streakMilestones',
      () => this.runWithRetry('streakMilestones', () => emailNotificationService.sendStreakMilestoneNotifications()),
      this.config.streakMilestoneInterval
    );

    // Schedule retry queue processing
    this.scheduleTask(
      'retryProcessor',
      () => this.processRetryQueues(),
      this.config.retryDelay
    );

    // Run initial checks after a short delay
    setTimeout(() => {
      this.runInitialChecks();
    }, 30000); // 30 seconds delay

    console.log('Notification scheduler started successfully');
  }

  /**
   * Stop the notification scheduler
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('Notification scheduler is not running');
      return;
    }

    console.log('Stopping notification scheduler...');
    this.isRunning = false;

    // Clear all intervals
    for (const [taskName, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`Stopped ${taskName} task`);
    }
    this.intervals.clear();

    // Clear retry queues
    this.initializeRetryQueues();

    console.log('Notification scheduler stopped');
  }

  /**
   * Schedule a recurring task
   */
  private scheduleTask(taskName: string, task: () => void, interval: number): void {
    if (this.intervals.has(taskName)) {
      clearInterval(this.intervals.get(taskName)!);
    }

    const intervalId = setInterval(() => {
      if (this.isRunning) {
        try {
          task();
        } catch (error) {
          console.error(`Error in scheduled task ${taskName}:`, error);
        }
      }
    }, interval);

    this.intervals.set(taskName, intervalId);
    console.log(`Scheduled ${taskName} task to run every ${interval / 1000} seconds`);
  }

  /**
   * Run a task with retry logic
   */
  private async runWithRetry(queueName: string, task: () => Promise<void>): Promise<void> {
    try {
      await task();
      console.log(`Successfully completed ${queueName} task`);
    } catch (error) {
      console.error(`Error in ${queueName} task:`, error);
      
      // Add to retry queue
      const retryQueue = this.retryQueues.get(queueName);
      if (retryQueue) {
        retryQueue.push({ fn: task, retries: 0 });
        console.log(`Added ${queueName} task to retry queue`);
      }
    }
  }

  /**
   * Process retry queues
   */
  private async processRetryQueues(): Promise<void> {
    for (const [queueName, queue] of this.retryQueues) {
      if (queue.length === 0) continue;

      console.log(`Processing ${queue.length} items in ${queueName} retry queue`);
      
      const itemsToRetry = [...queue];
      queue.length = 0; // Clear the queue

      for (const item of itemsToRetry) {
        if (item.retries >= this.config.maxRetries) {
          console.error(`Max retries exceeded for ${queueName} task, dropping item`);
          continue;
        }

        try {
          await item.fn();
          console.log(`Successfully retried ${queueName} task`);
        } catch (error) {
          console.error(`Retry failed for ${queueName} task:`, error);
          item.retries++;
          queue.push(item); // Add back to queue for next retry
        }
      }
    }
  }

  /**
   * Run initial checks when scheduler starts
   */
  private async runInitialChecks(): Promise<void> {
    console.log('Running initial notification checks...');
    
    try {
      // Check for any pending notifications that might have been missed
      await this.processPendingNotifications();
      
      // Run a quick persistent health check
      await this.runWithRetry('persistentHealth', () => emailNotificationService.checkPersistentHealthEvents());
      
      console.log('Initial notification checks completed');
    } catch (error) {
      console.error('Error during initial notification checks:', error);
    }
  }

  /**
   * Process any pending notifications that might have been missed
   */
  private async processPendingNotifications(): Promise<void> {
    try {
      // Find notifications that were created but email wasn't sent
      const pendingNotifications = await db
        .select()
        .from(healthNotifications)
        .where(
          and(
            eq(healthNotifications.emailSent, false),
            lte(healthNotifications.createdAt, subHours(new Date(), 1))
          )
        );

      if (pendingNotifications.length > 0) {
        console.log(`Found ${pendingNotifications.length} pending notifications`);
        
        // Process pending notifications
        // This would typically involve re-sending emails or marking them as failed
        // Implementation depends on specific business logic
      }
    } catch (error) {
      console.error('Error processing pending notifications:', error);
    }
  }

  /**
   * Get scheduler status
   */
  public getStatus(): {
    isRunning: boolean;
    activeTasks: string[];
    retryQueueSizes: Record<string, number>;
    config: SchedulerConfig;
  } {
    return {
      isRunning: this.isRunning,
      activeTasks: Array.from(this.intervals.keys()),
      retryQueueSizes: Object.fromEntries(
        Array.from(this.retryQueues.entries()).map(([key, queue]) => [key, queue.length])
      ),
      config: this.config
    };
  }

  /**
   * Update scheduler configuration
   */
  public updateConfig(newConfig: Partial<SchedulerConfig>): void {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      this.stop();
    }
    
    this.config = { ...this.config, ...newConfig };
    
    if (wasRunning) {
      this.start();
    }
    
    console.log('Scheduler configuration updated:', this.config);
  }

  /**
   * Manually trigger a specific notification check
   */
  public async triggerCheck(type: 'persistentHealth' | 'medicationReminders' | 'streakMilestones'): Promise<void> {
    console.log(`Manually triggering ${type} check...`);
    
    switch (type) {
      case 'persistentHealth':
        await this.runWithRetry('persistentHealth', () => emailNotificationService.checkPersistentHealthEvents());
        break;
      case 'medicationReminders':
        await this.runWithRetry('medicationReminders', () => emailNotificationService.sendMedicationReminders());
        break;
      case 'streakMilestones':
        await this.runWithRetry('streakMilestones', () => emailNotificationService.sendStreakMilestoneNotifications());
        break;
    }
  }
}

// Export singleton instance
export const notificationScheduler = NotificationScheduler.getInstance();

// Auto-start in production environment
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_NOTIFICATION_SCHEDULER !== 'false') {
  // Start scheduler after a delay to ensure database connections are ready
  setTimeout(() => {
    notificationScheduler.start();
  }, 10000); // 10 seconds delay
}