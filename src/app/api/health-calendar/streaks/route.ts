import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { streakRecords, dailyCheckins, healthNotifications } from '@/lib/db/schema';
import { eq, and, desc, gte, sql, max } from 'drizzle-orm';
import { z } from 'zod';

const streakUpdateSchema = z.object({
  streakType: z.enum(['daily_checkin', 'symptom_logging', 'medication_adherence', 'exercise', 'mood_tracking']),
  date: z.string().optional() // defaults to today
});

const streakQuerySchema = z.object({
  streakType: z.enum(['daily_checkin', 'symptom_logging', 'medication_adherence', 'exercise', 'mood_tracking']).optional(),
  includeHistory: z.boolean().default(false),
  limit: z.number().min(1).max(100).default(10)
});

// POST - Update streak (called when user completes an activity)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = streakUpdateSchema.parse(body);
    
    // Determine the activity date (now by default, or a specific date if provided)
    const activityDate = validatedData.date ? new Date(validatedData.date) : new Date();
    const todayStr = activityDate.toISOString().split('T')[0];
    const yesterdayStr = new Date(activityDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get current streak record
    const [currentStreak] = await db
      .select()
      .from(streakRecords)
      .where(
        and(
          eq(streakRecords.userId, userId),
          eq(streakRecords.streakType, validatedData.streakType)
        )
      )
      .limit(1);

    let newCurrentStreak = 1;
    let newLongestStreak = 1;

    if (currentStreak) {
      const lastActivityStr = currentStreak.lastActivityDate
        ? currentStreak.lastActivityDate.toISOString().split('T')[0]
        : null;
      // Check if activity was already recorded for the activityDate
      if (lastActivityStr === todayStr) {
        return NextResponse.json({
          success: true,
          streak: currentStreak,
          message: 'Activity already recorded for this date'
        });
      }

      // Check if this continues the streak (yesterday or today)
      if (lastActivityStr === yesterdayStr) {
        newCurrentStreak = (currentStreak.currentStreak || 0) + 1;
        newLongestStreak = Math.max(currentStreak.longestStreak || 0, newCurrentStreak);
      } else {
        // Streak broken, start new one
        newCurrentStreak = 1;
        newLongestStreak = Math.max(currentStreak.longestStreak || 0, 1);
      }
    }

    // Update or create streak record
    const streakData = {
      userId,
      streakType: validatedData.streakType,
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: activityDate,
      totalActivities: currentStreak ? (currentStreak.totalActivities || 0) + 1 : 1,
      updatedAt: new Date()
    };

    let updatedStreak;
    if (currentStreak) {
      [updatedStreak] = await db
        .update(streakRecords)
        .set(streakData)
        .where(eq(streakRecords.id, currentStreak.id))
        .returning();
    } else {
      [updatedStreak] = await db
        .insert(streakRecords)
        .values({
          ...streakData,
          createdAt: new Date()
        })
        .returning();
    }

    // Check for milestone achievements and create notifications
    await checkStreakMilestones(userId, validatedData.streakType, newCurrentStreak, newLongestStreak);

    return NextResponse.json({
      success: true,
      streak: updatedStreak,
      milestone: getMilestoneInfo(newCurrentStreak)
    });
  } catch (error) {
    console.error('Error updating streak:', error);
    return NextResponse.json(
      { error: 'Failed to update streak' },
      { status: 500 }
    );
  }
}

// GET - Retrieve streak information
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const streakType = searchParams.get('streakType');
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    let whereConditions = [eq(streakRecords.userId, userId)];
    if (streakType) {
      whereConditions.push(eq(streakRecords.streakType, streakType));
    }

    const streaks = await db
      .select()
      .from(streakRecords)
      .where(and(...whereConditions))
      .orderBy(desc(streakRecords.currentStreak))
      .limit(limit);

    // Calculate streak status (active, at risk, broken)
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const streaksWithStatus = streaks.map(streak => {
      let status = 'broken';
      const lastActivityStr = streak.lastActivityDate ? streak.lastActivityDate.toISOString().split('T')[0] : null;
      if (lastActivityStr === todayStr) {
        status = 'active';
      } else if (lastActivityStr === yesterdayStr) {
        status = 'at_risk';
      }

      return {
        ...streak,
        status,
        nextMilestone: getNextMilestone(streak.currentStreak || 0),
        progressToNext: getProgressToNextMilestone(streak.currentStreak || 0)
      };
    });

    // Get overall statistics
    const stats = await getStreakStatistics(userId);

    let response: {
      streaks: typeof streaksWithStatus;
      statistics: typeof stats;
      history?: {
        date: string;
        streakType: string;
        currentStreak: number | null;
        longestStreak: number | null;
      }[];
    } = {
      streaks: streaksWithStatus,
      statistics: stats
    };

    // Include history if requested
    if (includeHistory) {
      const history = await getStreakHistory(userId, streakType);
      response.history = history.map(h => ({ ...h, date: h.date.toISOString() }));
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching streaks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streaks' },
      { status: 500 }
    );
  }
}

// PUT - Reset streak (for testing or manual reset)
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { streakType, resetType } = body;

    if (!streakType || !resetType) {
      return NextResponse.json({ error: 'streakType and resetType required' }, { status: 400 });
    }

    const [existingStreak] = await db
      .select()
      .from(streakRecords)
      .where(
        and(
          eq(streakRecords.userId, userId),
          eq(streakRecords.streakType, streakType)
        )
      )
      .limit(1);

    if (!existingStreak) {
      return NextResponse.json({ error: 'Streak not found' }, { status: 404 });
    }

    let updateData: {
      updatedAt: Date;
      currentStreak?: number;
      longestStreak?: number;
      totalActivities?: number;
    } = {
      updatedAt: new Date()
    };

    switch (resetType) {
      case 'current':
        updateData.currentStreak = 0;
        break;
      case 'longest':
        updateData.longestStreak = existingStreak.currentStreak || 0;
        break;
      case 'all':
        updateData.currentStreak = 0;
        updateData.longestStreak = 0;
        updateData.totalActivities = 0;
        break;
      default:
        return NextResponse.json({ error: 'Invalid resetType' }, { status: 400 });
    }

    const [updatedStreak] = await db
      .update(streakRecords)
      .set(updateData)
      .where(eq(streakRecords.id, existingStreak.id))
      .returning();

    return NextResponse.json({ success: true, streak: updatedStreak });
  } catch (error) {
    console.error('Error resetting streak:', error);
    return NextResponse.json(
      { error: 'Failed to reset streak' },
      { status: 500 }
    );
  }
}

// Helper function to check for milestone achievements
async function checkStreakMilestones(userId: string, streakType: string, currentStreak: number, longestStreak: number) {
  const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
  
  // Check if current streak hit a milestone
  if (milestones.includes(currentStreak)) {
    await createMilestoneNotification(userId, streakType, currentStreak, 'current');
  }
  
  // Check if longest streak hit a new milestone
  if (milestones.includes(longestStreak) && longestStreak === currentStreak) {
    await createMilestoneNotification(userId, streakType, longestStreak, 'longest');
  }
}

// Helper function to create milestone notifications
async function createMilestoneNotification(userId: string, streakType: string, streakCount: number, milestoneType: string) {
  try {
    const streakTypeLabels = {
      daily_checkin: 'Daily Check-in',
      symptom_logging: 'Symptom Logging',
      medication_adherence: 'Medication Adherence',
      exercise: 'Exercise',
      mood_tracking: 'Mood Tracking'
    };

    const label = streakTypeLabels[streakType as keyof typeof streakTypeLabels] || streakType;
    const title = `🎉 ${streakCount}-Day ${label} Streak!`;
    const message = milestoneType === 'longest' 
      ? `Congratulations! You've achieved a new personal best with ${streakCount} consecutive days of ${label.toLowerCase()}. Keep up the amazing work!`
      : `Great job! You've maintained your ${label.toLowerCase()} streak for ${streakCount} days. You're building healthy habits!`;

    await db.insert(healthNotifications).values({
      id: crypto.randomUUID(),
      userId,
      notificationType: 'streak_milestone',
      title,
      message,
      triggerCondition: {
        streakType,
        streakCount,
        milestoneType,
        achievedAt: new Date().toISOString()
      },
      scheduledAt: new Date()
    });
  } catch (error) {
    console.error('Error creating milestone notification:', error);
  }
}

// Helper function to get milestone information
function getMilestoneInfo(currentStreak: number) {
  const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
  const achieved = milestones.filter(m => m <= currentStreak);
  const next = milestones.find(m => m > currentStreak);
  
  return {
    achieved: achieved.length > 0 ? achieved[achieved.length - 1] : null,
    next: next || null,
    progress: next ? ((currentStreak % next) / next) * 100 : 100
  };
}

// Helper function to get next milestone
function getNextMilestone(currentStreak: number): number | null {
  const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
  return milestones.find(m => m > currentStreak) || null;
}

// Helper function to get progress to next milestone
function getProgressToNextMilestone(currentStreak: number): number {
  const next = getNextMilestone(currentStreak);
  if (!next) return 100;
  
  const previous = [0, 3, 7, 14, 30, 60, 90, 180].find((m, i, arr) => {
    return arr[i + 1] === next;
  }) || 0;
  
  return ((currentStreak - previous) / (next - previous)) * 100;
}

// Helper function to get overall streak statistics
async function getStreakStatistics(userId: string) {
  try {
    const stats = await db
      .select({
        totalStreaks: sql<number>`count(*)`,
        totalActivities: sql<number>`sum(${streakRecords.totalActivities})`,
        longestOverall: sql<number>`max(${streakRecords.longestStreak})`,
        activeStreaks: sql<number>`count(case when ${streakRecords.lastActivityDate} >= ${new Date(Date.now() - 24 * 60 * 60 * 1000)} then 1 end)`
      })
      .from(streakRecords)
      .where(eq(streakRecords.userId, userId));

    return stats[0] || {
      totalStreaks: 0,
      totalActivities: 0,
      longestOverall: 0,
      activeStreaks: 0
    };
  } catch (error) {
    console.error('Error fetching streak statistics:', error);
    return {
      totalStreaks: 0,
      totalActivities: 0,
      longestOverall: 0,
      activeStreaks: 0
    };
  }
}

// Helper function to get streak history
async function getStreakHistory(userId: string, streakType?: string | null) {
  try {
    let whereConditions = [eq(streakRecords.userId, userId)];
    if (streakType) {
      whereConditions.push(eq(streakRecords.streakType, streakType));
    }

    const history = await db
      .select({
        date: streakRecords.updatedAt,
        streakType: streakRecords.streakType,
        currentStreak: streakRecords.currentStreak,
        longestStreak: streakRecords.longestStreak
      })
      .from(streakRecords)
      .where(and(...whereConditions))
      .orderBy(desc(streakRecords.updatedAt))
      .limit(50);

    return history;
  } catch (error) {
    console.error('Error fetching streak history:', error);
    return [];
  }
}