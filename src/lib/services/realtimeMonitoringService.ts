'use server';

import { db } from '@/lib/db';
import {
  realtimeHealthData,
  alertThresholds,
  healthAlerts,
  analysisJobs,
  notificationQueue,
  type NewRealtimeHealthData,
  type NewHealthAlert,
  type NewAnalysisJob,
  type NewNotificationQueue,
} from '@/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

/**
 * Real-time Health Monitoring Service
 * Handles continuous health data processing, threshold monitoring, and alert generation
 */



/**
 * Store real-time health data and trigger analysis
 */
export async function storeHealthData(data: NewRealtimeHealthData) {
  try {
    // Store the health data
    const [storedData] = await db
      .insert(realtimeHealthData)
      .values({
        ...data,
        timestamp: data.timestamp || new Date(),
        isProcessed: false,
      })
      .returning();

    // Trigger real-time analysis
    await triggerRealtimeAnalysis(storedData.userId, storedData.id);

    return { success: true, data: storedData };
  } catch (error) {
    console.error('Error storing health data:', error);
    return { success: false, error: 'Failed to store health data' };
  }
}

/**
 * Trigger real-time analysis for new health data
 */
export async function triggerRealtimeAnalysis(userId: string, dataId: string) {
  try {
    // Create analysis job
    const analysisJob: NewAnalysisJob = {
      userId,
      jobType: 'continuous_monitoring',
      status: 'pending',
      inputData: { dataId, analysisType: 'threshold_check' },
      priority: 3, // High priority for real-time analysis
      scheduledAt: new Date(),
    };

    await db.insert(analysisJobs).values(analysisJob);

    // Process immediately for real-time response
    await processAnalysisJob(userId, dataId);

    return { success: true };
  } catch (error) {
    console.error('Error triggering analysis:', error);
    return { success: false, error: 'Failed to trigger analysis' };
  }
}

/**
 * Process analysis job and check for threshold breaches
 */
export async function processAnalysisJob(userId: string, dataId: string) {
  try {
    // Get the health data
    const healthData = await db
      .select()
      .from(realtimeHealthData)
      .where(eq(realtimeHealthData.id, dataId))
      .limit(1);

    if (!healthData.length) {
      throw new Error('Health data not found');
    }

    const data = healthData[0];

    // Get user's alert thresholds
    const thresholds = await db
      .select()
      .from(alertThresholds)
      .where(
        and(
          eq(alertThresholds.userId, userId),
          eq(alertThresholds.dataType, data.dataType),
          eq(alertThresholds.isActive, true)
        )
      );

    // Check for threshold breaches
    for (const threshold of thresholds) {
      const value = parseFloat(data.value as string);
      let breached = false;
      let breachType = '';

      if (threshold.minValue && value < parseFloat(threshold.minValue)) {
        breached = true;
        breachType = 'below_minimum';
      } else if (threshold.maxValue && value > parseFloat(threshold.maxValue)) {
        breached = true;
        breachType = 'above_maximum';
      }

      if (breached) {
        await createHealthAlert({
          userId,
          alertType: 'threshold_breach',
          severity: threshold.severity,
          title: `${data.dataType.replace('_', ' ').toUpperCase()} Alert`,
          message: `Your ${data.dataType.replace('_', ' ')} reading of ${value} ${data.unit} is ${breachType.replace('_', ' ')}.`,
          dataSnapshot: {
            dataId: data.id,
            value: data.value,
            unit: data.unit,
            timestamp: data.timestamp,
            breachType,
          },
          thresholdId: threshold.id,
        });
      }
    }

    // Mark data as processed
    await db
      .update(realtimeHealthData)
      .set({ isProcessed: true })
      .where(eq(realtimeHealthData.id, dataId));

    return { success: true };
  } catch (error) {
    console.error('Error processing analysis job:', error);
    return { success: false, error: 'Failed to process analysis' };
  }
}

/**
 * Create a health alert and queue notifications
 */
export async function createHealthAlert(alertData: Omit<NewHealthAlert, 'id' | 'createdAt'>) {
  try {
    // Create the alert
    const [alert] = await db
      .insert(healthAlerts)
      .values(alertData)
      .returning();

    // Queue notifications based on severity
    await queueNotifications(alert.userId, alert.id, alert.severity);

    return { success: true, alert };
  } catch (error) {
    console.error('Error creating health alert:', error);
    return { success: false, error: 'Failed to create alert' };
  }
}

/**
 * Queue notifications for an alert
 */
export async function queueNotifications(userId: string, alertId: string, severity: string) {
  try {
    const notifications: NewNotificationQueue[] = [];

    // Always send WebSocket notification for real-time updates
    notifications.push({
      userId,
      alertId,
      notificationType: 'websocket',
      recipient: userId, // Will be resolved to connection IDs
      title: 'Health Alert',
      message: 'New health alert generated',
      payload: { alertId, severity },
    });

    // Send email for medium and high severity
    if (['medium', 'high', 'critical'].includes(severity)) {
      notifications.push({
        userId,
        alertId,
        notificationType: 'email',
        recipient: userId, // Will be resolved to user email
        title: 'Health Alert - Immediate Attention Required',
        message: 'A health alert has been generated that requires your attention.',
        payload: { alertId, severity },
      });
    }

    // Send SMS for critical alerts
    if (severity === 'critical') {
      notifications.push({
        userId,
        alertId,
        notificationType: 'sms',
        recipient: userId, // Will be resolved to user phone
        title: 'CRITICAL Health Alert',
        message: 'URGENT: Critical health alert detected. Please check your app immediately.',
        payload: { alertId, severity },
      });
    }

    // Insert all notifications
    if (notifications.length > 0) {
      await db.insert(notificationQueue).values(notifications);
    }

    return { success: true, notificationsQueued: notifications.length };
  } catch (error) {
    console.error('Error queueing notifications:', error);
    return { success: false, error: 'Failed to queue notifications' };
  }
}

/**
 * Get real-time health data for a user
 */
export async function getUserRealtimeData(userId: string, options?: {
  dataType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
} | number) {
  try {
    // Handle legacy number parameter
    const limit = typeof options === 'number' ? options : options?.limit || 50;
    const dataType = typeof options === 'object' ? options?.dataType : undefined;
    const startDate = typeof options === 'object' ? options?.startDate : undefined;
    const endDate = typeof options === 'object' ? options?.endDate : undefined;

    const whereConditions = [eq(realtimeHealthData.userId, userId)];

    // Add filters if provided
    if (dataType) {
      whereConditions.push(eq(realtimeHealthData.dataType, dataType));
    }

    if (startDate) {
      whereConditions.push(gte(realtimeHealthData.timestamp, startDate));
    }

    if (endDate) {
      whereConditions.push(lte(realtimeHealthData.timestamp, endDate));
    }

    const query = db
      .select()
      .from(realtimeHealthData)
      .where(and(...whereConditions))
      .orderBy(desc(realtimeHealthData.timestamp))
      .limit(limit);

    const data = await query;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching realtime data:', error);
    return { success: false, error: 'Failed to fetch data' };
  }
}

/**
 * Get active alerts for a user
 */
export async function getUserActiveAlerts(userId: string) {
  try {
    const alerts = await db
      .select()
      .from(healthAlerts)
      .where(
        and(
          eq(healthAlerts.userId, userId),
          eq(healthAlerts.isResolved, false)
        )
      )
      .orderBy(desc(healthAlerts.createdAt));

    return { success: true, alerts };
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    return { success: false, error: 'Failed to fetch alerts' };
  }
}

/**
 * Get active alerts for a user (alias for compatibility)
 */
export async function getActiveAlerts(userId: string, options?: {
  severity?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const whereConditions = [
      eq(healthAlerts.userId, userId),
      eq(healthAlerts.isResolved, false)
    ];

    if (options?.severity) {
      whereConditions.push(eq(healthAlerts.severity, options.severity));
    }

    let alerts;
    
    if (options?.limit && options?.offset) {
      alerts = await db
        .select()
        .from(healthAlerts)
        .where(and(...whereConditions))
        .orderBy(desc(healthAlerts.createdAt))
        .limit(options.limit)
        .offset(options.offset);
    } else if (options?.limit) {
      alerts = await db
        .select()
        .from(healthAlerts)
        .where(and(...whereConditions))
        .orderBy(desc(healthAlerts.createdAt))
        .limit(options.limit);
    } else {
      alerts = await db
        .select()
        .from(healthAlerts)
        .where(and(...whereConditions))
        .orderBy(desc(healthAlerts.createdAt));
    }
    return alerts;
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    return [];
  }
}

/**
 * Set up default alert thresholds for a user
 */
export async function setupDefaultThresholds(userId: string) {
  try {
    const defaultThresholds = [
      {
        userId,
        dataType: 'heart_rate',
        minValue: '50',
        maxValue: '120',
        severity: 'medium',
      },
      {
        userId,
        dataType: 'blood_pressure_systolic',
        minValue: '80',
        maxValue: '160',
        severity: 'high',
      },
      {
        userId,
        dataType: 'temperature',
        minValue: '35.5',
        maxValue: '38.0',
        severity: 'medium',
      },
    ];

    await db.insert(alertThresholds).values(defaultThresholds);

    return { success: true, thresholdsCreated: defaultThresholds.length };
  } catch (error) {
    console.error('Error setting up default thresholds:', error);
    return { success: false, error: 'Failed to setup thresholds' };
  }
}

/**
 * Mark alert as resolved
 */
interface AlertUpdateData {
  isResolved: boolean;
  resolvedAt: Date;
  resolution?: string;
  resolvedBy?: string;
}

export async function resolveAlert(alertId: string, resolution?: string, userId?: string) {
  try {
    const updateData: AlertUpdateData = {
      isResolved: true,
      resolvedAt: new Date(),
    };

    if (resolution) {
      updateData.resolution = resolution;
    }

    if (userId) {
      updateData.resolvedBy = userId;
    }

    await db
      .update(healthAlerts)
      .set(updateData)
      .where(eq(healthAlerts.id, alertId));

    return { success: true };
  } catch (error) {
    console.error('Error resolving alert:', error);
    return { success: false, error: 'Failed to resolve alert' };
  }
}

/**
 * Detect health anomalies using simple statistical analysis
 */
export async function detectAnomalies(userId: string, dataType: string) {
  try {
    // Get recent data for analysis (last 30 readings)
    const recentData = await db
      .select()
      .from(realtimeHealthData)
      .where(
        and(
          eq(realtimeHealthData.userId, userId),
          eq(realtimeHealthData.dataType, dataType)
        )
      )
      .orderBy(desc(realtimeHealthData.timestamp))
      .limit(30);

    if (recentData.length < 10) {
      return { success: true, anomalies: [] }; // Not enough data
    }

    const values = recentData.map(d => parseFloat(d.value as string));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Detect outliers (values more than 2 standard deviations from mean)
    const anomalies = recentData.filter(d => {
      const value = parseFloat(d.value as string);
      return Math.abs(value - mean) > 2 * stdDev;
    });

    // Create alerts for significant anomalies
    for (const anomaly of anomalies) {
      await createHealthAlert({
        userId,
        alertType: 'anomaly_detected',
        severity: 'medium',
        title: `Unusual ${dataType.replace('_', ' ')} Reading`,
        message: `An unusual ${dataType.replace('_', ' ')} reading was detected that differs significantly from your normal pattern.`,
        dataSnapshot: {
          dataId: anomaly.id,
          value: anomaly.value,
          unit: anomaly.unit,
          timestamp: anomaly.timestamp,
          mean,
          stdDev,
        },
      });
    }

    return { success: true, anomalies, stats: { mean, stdDev } };
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    return { success: false, error: 'Failed to detect anomalies' };
  }
}

/**
 * Trigger analysis job
 */
interface AnalysisParameters {
  dataType?: string;
  dataCount?: number;
  [key: string]: unknown;
}

export async function triggerAnalysisJob(userId: string, analysisType: string, parameters?: AnalysisParameters) {
  try {
    const analysisJob: NewAnalysisJob = {
      userId,
      jobType: analysisType,
      status: 'pending',
      inputData: parameters || {},
      priority: 3,
      scheduledAt: new Date(),
    };

    const [job] = await db.insert(analysisJobs).values(analysisJob).returning();

    // Process specific analysis types
    switch (analysisType) {
      case 'anomaly_detection':
        if (parameters?.dataType) {
          await detectAnomalies(userId, parameters.dataType);
        }
        break;
      case 'bulk_analysis':
        // Process bulk analysis
        console.log('Processing bulk analysis for', parameters?.dataCount, 'data points');
        break;
      default:
        console.log('Unknown analysis type:', analysisType);
    }

    return { success: true, job };
  } catch (error) {
    console.error('Error triggering analysis job:', error);
    return { success: false, error: 'Failed to trigger analysis job' };
  }
}