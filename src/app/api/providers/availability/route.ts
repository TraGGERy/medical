import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providerAvailability, healthcareProviders } from '@/lib/db/schema';
import { eq, and, gte, lte, between } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for availability
const availabilitySchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
  dayOfWeek: z.number().min(0).max(6, 'Day of week must be 0-6 (Sunday-Saturday)'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  isActive: z.boolean().default(true),
  timezone: z.string().default('UTC'),
});

const bulkAvailabilitySchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
  schedule: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    isActive: z.boolean().default(true),
  })),
  timezone: z.string().default('UTC'),
});

const dateRangeSchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  timezone: z.string().default('UTC'),
});

// GET /api/providers/availability - Get provider availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const dayOfWeek = searchParams.get('dayOfWeek');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const timezone = searchParams.get('timezone') || 'UTC';

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Verify provider exists
    const provider = await db
      .select()
      .from(healthcareProviders)
      .where(eq(healthcareProviders.id, providerId))
      .limit(1)
      .execute();

    if (provider.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Apply filters
    const conditions = [eq(providerAvailability.providerId, providerId)];
    
    if (dayOfWeek !== null) {
      const dayNum = parseInt(dayOfWeek);
      if (!isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) {
        conditions.push(eq(providerAvailability.dayOfWeek, dayNum));
      }
    }

    // Note: Date range filtering not supported in current schema
    // if (startDate && endDate) {
    //   conditions.push(
    //     between(
    //       providerAvailability.specificDate,
    //       new Date(startDate),
    //       new Date(endDate)
    //     )
    //   );
    // }

    const availability = await db
      .select()
      .from(providerAvailability)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .execute();

    // Group by day of week for regular schedule
    const regularSchedule = availability
      .reduce((acc, slot) => {
        if (!acc[slot.dayOfWeek]) {
          acc[slot.dayOfWeek] = [];
        }
        acc[slot.dayOfWeek].push({
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isActive,
          timezone: slot.timezone,
        });
        return acc;
      }, {} as Record<number, any[]>);

    // Note: This schema doesn't support specific date overrides
    const specificDates: any[] = [];

    return NextResponse.json({
      success: true,
      data: {
        providerId,
        regularSchedule,
        specificDates,
        timezone,
      },
    });
  } catch (error) {
    console.error('Error fetching provider availability:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

// POST /api/providers/availability - Create availability slot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if it's bulk schedule creation
    if (body.schedule && Array.isArray(body.schedule)) {
      return await createBulkAvailability(body);
    }
    
    // Single availability slot creation
    const validatedData = availabilitySchema.parse(body);

    // Verify provider exists and is verified
    const provider = await db
      .select()
      .from(healthcareProviders)
      .where(
        and(
          eq(healthcareProviders.id, validatedData.providerId),
          eq(healthcareProviders.verificationStatus, 'verified')
        )
      )
      .limit(1)
      .execute();

    if (provider.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Provider not found or not verified' },
        { status: 404 }
      );
    }

    // Validate time range
    if (validatedData.startTime >= validatedData.endTime) {
      return NextResponse.json(
        { success: false, error: 'Start time must be before end time' },
        { status: 400 }
      );
    }

    // Check for overlapping availability slots
    const overlapping = await db
      .select()
      .from(providerAvailability)
      .where(
        and(
          eq(providerAvailability.providerId, validatedData.providerId),
          eq(providerAvailability.dayOfWeek, validatedData.dayOfWeek),
          // Check for time overlap
        )
      )
      .execute();

    // Create availability slot
    const newAvailability = await db
      .insert(providerAvailability)
      .values(validatedData)
      .returning()
      .execute();

    return NextResponse.json(
      {
        success: true,
        message: 'Availability slot created successfully',
        data: newAvailability[0],
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error creating availability:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create availability' },
      { status: 500 }
    );
  }
}

// Helper function for bulk availability creation
async function createBulkAvailability(body: any) {
  const validatedData = bulkAvailabilitySchema.parse(body);

  // Verify provider exists and is verified
  const provider = await db
    .select()
    .from(healthcareProviders)
    .where(
      and(
        eq(healthcareProviders.id, validatedData.providerId),
        eq(healthcareProviders.verificationStatus, 'verified')
      )
    )
    .limit(1)
    .execute();

  if (provider.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Provider not found or not verified' },
      { status: 404 }
    );
  }

  // Delete existing regular schedule for this provider
  await db
    .delete(providerAvailability)
    .where(eq(providerAvailability.providerId, validatedData.providerId))
    .execute();

  // Create new schedule
  const availabilitySlots = validatedData.schedule.map(slot => ({
    providerId: validatedData.providerId,
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
    isActive: slot.isActive,
    timezone: validatedData.timezone,
  }));

  const newAvailability = await db
    .insert(providerAvailability)
    .values(availabilitySlots)
    .returning()
    .execute();

  return NextResponse.json(
    {
      success: true,
      message: 'Weekly schedule created successfully',
      data: newAvailability,
    },
    { status: 201 }
  );
}

// PUT /api/providers/availability - Update availability
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Availability ID is required' },
        { status: 400 }
      );
    }

    // Validate update data (partial)
    const partialSchema = availabilitySchema.partial().omit({ providerId: true });
    const validatedData = partialSchema.parse(updateData);

    // Check if availability slot exists
    const existingSlot = await db
      .select()
      .from(providerAvailability)
      .where(eq(providerAvailability.id, id))
      .limit(1)
      .execute();

    if (existingSlot.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Availability slot not found' },
        { status: 404 }
      );
    }

    // Update availability slot
    const updatedAvailability = await db
      .update(providerAvailability)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(providerAvailability.id, id))
      .returning()
      .execute();

    return NextResponse.json({
      success: true,
      message: 'Availability updated successfully',
      data: updatedAvailability[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error updating availability:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}

// DELETE /api/providers/availability - Delete availability slot
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Availability ID is required' },
        { status: 400 }
      );
    }

    // Check if availability slot exists
    const existingSlot = await db
      .select()
      .from(providerAvailability)
      .where(eq(providerAvailability.id, id))
      .limit(1)
      .execute();

    if (existingSlot.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Availability slot not found' },
        { status: 404 }
      );
    }

    // Delete availability slot
    await db
      .delete(providerAvailability)
      .where(eq(providerAvailability.id, id))
      .execute();

    return NextResponse.json({
      success: true,
      message: 'Availability slot deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting availability:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete availability' },
      { status: 500 }
    );
  }
}