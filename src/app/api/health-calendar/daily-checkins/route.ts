import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { dailyCheckins, checkinSymptoms, checkinMedications, streakRecords } from '@/lib/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

const dailyCheckinSchema = z.object({
  checkinDate: z.string(),
  moodRating: z.number().min(1).max(10).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  sleepQuality: z.number().min(1).max(10).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  stressLevel: z.number().min(1).max(10).optional(),
  exerciseMinutes: z.number().min(0).optional(),
  waterIntake: z.number().min(0).optional(),
  notes: z.string().optional(),
  symptoms: z.array(z.object({
    symptomName: z.string(),
    severity: z.number().min(1).max(10),
    notes: z.string().optional()
  })).optional(),
  medications: z.array(z.object({
    medicationName: z.string(),
    dosage: z.string(),
    taken: z.boolean(),
    timesTaken: z.number().min(0).optional(),
    timesScheduled: z.number().min(1).optional(),
    notes: z.string().optional()
  })).optional()
});

// POST - Create or update daily check-in
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = dailyCheckinSchema.parse(body);

    // Check if check-in already exists for this date
    const existingCheckin = await db
      .select()
      .from(dailyCheckins)
      .where(
        and(
          eq(dailyCheckins.userId, userId),
          eq(dailyCheckins.checkinDate, new Date(validatedData.checkinDate))
        )
      )
      .limit(1);

    let checkinId: string;

    if (existingCheckin.length > 0) {
      // Update existing check-in
      const [updatedCheckin] = await db
        .update(dailyCheckins)
        .set({
          moodRating: validatedData.moodRating,
          energyLevel: validatedData.energyLevel,
          sleepQuality: validatedData.sleepQuality,
          sleepHours: validatedData.sleepHours !== undefined ? validatedData.sleepHours.toString() : undefined,
          stressLevel: validatedData.stressLevel,
          exerciseMinutes: validatedData.exerciseMinutes,
          waterIntake: validatedData.waterIntake !== undefined ? validatedData.waterIntake.toString() : undefined,
          notes: validatedData.notes,
          updatedAt: new Date()
        })
        .where(eq(dailyCheckins.id, existingCheckin[0].id))
        .returning();
      
      checkinId = updatedCheckin.id;

      // Delete existing symptoms and medications
      await db.delete(checkinSymptoms).where(eq(checkinSymptoms.checkinId, checkinId));
      await db.delete(checkinMedications).where(eq(checkinMedications.checkinId, checkinId));
    } else {
      // Create new check-in
      const [newCheckin] = await db
        .insert(dailyCheckins)
        .values({
          userId,
          checkinDate: new Date(validatedData.checkinDate),
          moodRating: validatedData.moodRating,
          energyLevel: validatedData.energyLevel,
          sleepQuality: validatedData.sleepQuality,
          sleepHours: validatedData.sleepHours?.toString(),
          stressLevel: validatedData.stressLevel,
          exerciseMinutes: validatedData.exerciseMinutes,
          waterIntake: validatedData.waterIntake?.toString(),
          notes: validatedData.notes
        })
        .returning();
      
      checkinId = newCheckin.id;

      // Update streak record
      await updateStreakRecord(userId, 'daily_checkin');
    }

    // Add symptoms if provided
    if (validatedData.symptoms && validatedData.symptoms.length > 0) {
      await db.insert(checkinSymptoms).values(
        validatedData.symptoms.map(symptom => ({
          checkinId,
          symptomName: symptom.symptomName,
          severity: symptom.severity,
          notes: symptom.notes
        }))
      );
    }

    // Add medications if provided
    if (validatedData.medications && validatedData.medications.length > 0) {
      await db.insert(checkinMedications).values(
        validatedData.medications.map(medication => ({
          checkinId,
          medicationName: medication.medicationName,
          dosage: medication.dosage,
          taken: medication.taken,
          timesTaken: medication.timesTaken || 0,
          timesScheduled: medication.timesScheduled || 1,
          notes: medication.notes
        }))
      );
    }

    return NextResponse.json({ success: true, checkinId });
  } catch (error) {
    console.error('Error creating/updating daily check-in:', error);
    return NextResponse.json(
      { error: 'Failed to save daily check-in' },
      { status: 500 }
    );
  }
}

// GET - Retrieve daily check-ins
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '30');

    const whereConditions = [eq(dailyCheckins.userId, userId)];

    if (startDate) {
      whereConditions.push(gte(dailyCheckins.checkinDate, new Date(startDate)));
    }
    if (endDate) {
      whereConditions.push(lte(dailyCheckins.checkinDate, new Date(endDate)));
    }

    const query = db
      .select({
        id: dailyCheckins.id,
        checkinDate: dailyCheckins.checkinDate,
        moodRating: dailyCheckins.moodRating,
        energyLevel: dailyCheckins.energyLevel,
        sleepQuality: dailyCheckins.sleepQuality,
        sleepHours: dailyCheckins.sleepHours,
        stressLevel: dailyCheckins.stressLevel,
        exerciseMinutes: dailyCheckins.exerciseMinutes,
        waterIntake: dailyCheckins.waterIntake,
        notes: dailyCheckins.notes,
        createdAt: dailyCheckins.createdAt,
        updatedAt: dailyCheckins.updatedAt
      })
      .from(dailyCheckins)
      .where(and(...whereConditions))
      .orderBy(desc(dailyCheckins.checkinDate))
      .limit(limit);

    const checkins = await query;

    // Get symptoms and medications for each check-in
    const checkinsWithDetails = await Promise.all(
      checkins.map(async (checkin) => {
        const symptoms = await db
          .select()
          .from(checkinSymptoms)
          .where(eq(checkinSymptoms.checkinId, checkin.id));

        const medications = await db
          .select()
          .from(checkinMedications)
          .where(eq(checkinMedications.checkinId, checkin.id));

        return {
          ...checkin,
          symptoms,
          medications
        };
      })
    );

    return NextResponse.json({ checkins: checkinsWithDetails });
  } catch (error) {
    console.error('Error fetching daily check-ins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily check-ins' },
      { status: 500 }
    );
  }
}

// Helper function to update streak records
async function updateStreakRecord(userId: string, streakType: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get existing streak record
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

    if (existingStreak) {
      const lastActivityDate = existingStreak.lastActivityDate?.toISOString().split('T')[0];
      let newCurrentStreak = existingStreak.currentStreak || 0;
      let newLongestStreak = existingStreak.longestStreak || 0;
      let streakStartDate = existingStreak.streakStartDate;

      if (lastActivityDate === yesterday) {
        // Continue streak
        newCurrentStreak += 1;
      } else if (lastActivityDate !== today) {
        // Reset streak
        newCurrentStreak = 1;
        streakStartDate = new Date(today);
      }

      // Update longest streak if current is longer
      if (newCurrentStreak > newLongestStreak) {
        newLongestStreak = newCurrentStreak;
      }

      await db
        .update(streakRecords)
        .set({
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastActivityDate: new Date(today),
          streakStartDate,
          totalActivities: (existingStreak.totalActivities || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(streakRecords.id, existingStreak.id));
    } else {
      // Create new streak record
      await db.insert(streakRecords).values({
        userId,
        streakType,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: new Date(today),
        streakStartDate: new Date(today),
        totalActivities: 1
      });
    }
  } catch (error) {
    console.error('Error updating streak record:', error);
  }
}