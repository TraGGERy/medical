import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { healthEvents, healthNotifications } from '@/drizzle/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';

const healthEventSchema = z.object({
  eventType: z.enum(['symptom', 'medication', 'appointment', 'exercise', 'meal']),
  title: z.string().min(1),
  description: z.string().optional(),
  severity: z.number().min(1).max(10).optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  isOngoing: z.boolean().default(false),
  frequency: z.string().optional(),
  dosage: z.string().optional(),
  unit: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

const updateHealthEventSchema = healthEventSchema.partial().extend({
  id: z.string()
});

// POST - Create new health event
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = healthEventSchema.parse(body);

    const [newEvent] = await db
      .insert(healthEvents)
      .values({
        userId,
        eventType: validatedData.eventType,
        title: validatedData.title,
        description: validatedData.description,
        severity: validatedData.severity,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        isOngoing: validatedData.isOngoing,
        frequency: validatedData.frequency,
        dosage: validatedData.dosage,
        unit: validatedData.unit,
        tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null
      })
      .returning();

    // Check for persistent symptoms and create notifications if needed
    if (validatedData.eventType === 'symptom' && validatedData.isOngoing) {
      await checkPersistentSymptoms(userId, validatedData.title);
    }

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error) {
    console.error('Error creating health event:', error);
    return NextResponse.json(
      { error: 'Failed to create health event' },
      { status: 500 }
    );
  }
}

// GET - Retrieve health events
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('eventType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const isOngoing = searchParams.get('isOngoing');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereConditions = [eq(healthEvents.userId, userId)];

    if (eventType) {
      whereConditions.push(eq(healthEvents.eventType, eventType));
    }

    if (startDate) {
      whereConditions.push(gte(healthEvents.startDate, startDate));
    }

    if (endDate) {
      whereConditions.push(lte(healthEvents.startDate, endDate));
    }

    if (isOngoing !== null) {
      whereConditions.push(eq(healthEvents.isOngoing, isOngoing === 'true'));
    }

    const events = await db
      .select()
      .from(healthEvents)
      .where(and(...whereConditions))
      .orderBy(desc(healthEvents.startDate))
      .limit(limit)
      .offset(offset);

    // Parse JSON fields
    const eventsWithParsedData = events.map(event => ({
      ...event,
      tags: event.tags ? JSON.parse(event.tags as string) : [],
      metadata: event.metadata ? JSON.parse(event.metadata as string) : {}
    }));

    return NextResponse.json({ events: eventsWithParsedData });
  } catch (error) {
    console.error('Error fetching health events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health events' },
      { status: 500 }
    );
  }
}

// PUT - Update health event
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateHealthEventSchema.parse(body);

    // Verify ownership
    const [existingEvent] = await db
      .select()
      .from(healthEvents)
      .where(
        and(
          eq(healthEvents.id, validatedData.id),
          eq(healthEvents.userId, userId)
        )
      )
      .limit(1);

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const updateData: Partial<{
      eventType: string;
      title: string;
      description: string | null;
      severity: number | null;
      startDate: string;
      endDate: string | null;
      isOngoing: boolean;
      frequency: string | null;
      dosage: string | null;
      unit: string | null;
      tags: string;
      metadata: string;
      updatedAt: string;
    }> = {
      updatedAt: new Date().toISOString()
    };

    // Only update provided fields
    if (validatedData.eventType) updateData.eventType = validatedData.eventType;
    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.severity !== undefined) updateData.severity = validatedData.severity;
    if (validatedData.startDate) updateData.startDate = validatedData.startDate;
    if (validatedData.endDate !== undefined) updateData.endDate = validatedData.endDate;
    if (validatedData.isOngoing !== undefined) updateData.isOngoing = validatedData.isOngoing;
    if (validatedData.frequency !== undefined) updateData.frequency = validatedData.frequency;
    if (validatedData.dosage !== undefined) updateData.dosage = validatedData.dosage;
    if (validatedData.unit !== undefined) updateData.unit = validatedData.unit;
    if (validatedData.tags !== undefined) updateData.tags = JSON.stringify(validatedData.tags);
    if (validatedData.metadata !== undefined) updateData.metadata = JSON.stringify(validatedData.metadata);

    const [updatedEvent] = await db
      .update(healthEvents)
      .set(updateData)
      .where(eq(healthEvents.id, validatedData.id))
      .returning();

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error('Error updating health event:', error);
    return NextResponse.json(
      { error: 'Failed to update health event' },
      { status: 500 }
    );
  }
}

// DELETE - Delete health event
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    // Verify ownership
    const [existingEvent] = await db
      .select()
      .from(healthEvents)
      .where(
        and(
          eq(healthEvents.id, eventId),
          eq(healthEvents.userId, userId)
        )
      )
      .limit(1);

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await db.delete(healthEvents).where(eq(healthEvents.id, eventId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting health event:', error);
    return NextResponse.json(
      { error: 'Failed to delete health event' },
      { status: 500 }
    );
  }
}

// Helper function to check for persistent symptoms
async function checkPersistentSymptoms(userId: string, symptomTitle: string) {
  try {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    
    // Count ongoing symptoms with the same title in the last 5 days
    const persistentSymptoms = await db
      .select({ count: sql<number>`count(*)` })
      .from(healthEvents)
      .where(
        and(
          eq(healthEvents.userId, userId),
          eq(healthEvents.eventType, 'symptom'),
          eq(healthEvents.title, symptomTitle),
          eq(healthEvents.isOngoing, true),
          gte(healthEvents.startDate, fiveDaysAgo)
        )
      );

    const count = persistentSymptoms[0]?.count || 0;

    if (count >= 5) {
      // Check if notification already exists for this symptom
      const existingNotification = await db
        .select()
        .from(healthNotifications)
        .where(
          and(
            eq(healthNotifications.userId, userId),
            eq(healthNotifications.notificationType, 'persistent_symptom'),
            sql`${healthNotifications.triggerCondition}->>'symptomTitle' = ${symptomTitle}`,
            eq(healthNotifications.status, 'pending')
          )
        )
        .limit(1);

      if (existingNotification.length === 0) {
        // Create notification for persistent symptom
        await db.insert(healthNotifications).values({
          userId,
          notificationType: 'persistent_symptom',
          title: 'Persistent Symptom Alert',
          message: `You've been experiencing "${symptomTitle}" for 5 or more consecutive days. Consider consulting with a healthcare provider.`,
          triggerCondition: JSON.stringify({
            symptomTitle,
            consecutiveDays: count,
            detectedAt: new Date().toISOString()
          }),
          scheduledAt: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Error checking persistent symptoms:', error);
  }
}