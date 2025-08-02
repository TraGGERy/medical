import { db } from '@/lib/db';
import { userAnalytics } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Updates the user analytics when a new report is created
 * Increments the report count and updates the last report date
 */
export async function updateUserReportAnalytics(userId: string) {
  try {
    // Check if user analytics record exists
    const existingAnalytics = await db
      .select()
      .from(userAnalytics)
      .where(eq(userAnalytics.userId, userId))
      .limit(1);

    const now = new Date();

    if (existingAnalytics.length === 0) {
      // Create new analytics record
      await db.insert(userAnalytics).values({
        userId,
        reportCount: 1,
        lastReportDate: now,
        createdAt: now,
        updatedAt: now,
      });

      console.log('✅ New user analytics created:', userId);
    } else {
      // Update existing analytics
      const currentAnalytics = existingAnalytics[0];
      await db
        .update(userAnalytics)
        .set({
          reportCount: (currentAnalytics.reportCount || 0) + 1,
          lastReportDate: now,
          updatedAt: now,
        })
        .where(eq(userAnalytics.userId, userId));

      console.log('✅ User analytics updated:', userId);
    }

    return true;
  } catch (error) {
    console.error('❌ Error updating user analytics:', error);
    // Don't throw the error to prevent blocking the main flow
    return false;
  }
}

/**
 * Gets the current month's report count for a user
 */
export async function getUserMonthlyReportCount(userId: string): Promise<number> {
  try {
    const userAnalyticsRecord = await db
      .select()
      .from(userAnalytics)
      .where(eq(userAnalytics.userId, userId))
      .limit(1);

    if (userAnalyticsRecord.length === 0) {
      return 0;
    }

    // If the last report date is not in the current month, return 0
    const lastReportDate = userAnalyticsRecord[0].lastReportDate;
    if (!lastReportDate) {
      return 0;
    }

    const now = new Date();
    const lastReportMonth = lastReportDate.getMonth();
    const lastReportYear = lastReportDate.getFullYear();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (lastReportMonth !== currentMonth || lastReportYear !== currentYear) {
      return 0;
    }

    return userAnalyticsRecord[0].reportCount || 0;
  } catch (error) {
    console.error('❌ Error getting user monthly report count:', error);
    return 0;
  }
}