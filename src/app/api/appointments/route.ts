import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { telemedicineAppointments, healthcareProviders, users, providerAvailability } from '@/lib/db/schema';
import { eq, and, gte, lte, between, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// Validation schema for appointment booking
const appointmentBookingSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  providerId: z.string().min(1, 'Provider ID is required'),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  appointmentTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  duration: z.number().min(15).max(180).default(30), // Duration in minutes
  appointmentType: z.enum(['consultation', 'follow-up', 'emergency']).default('consultation'),
  reasonForVisit: z.string().optional(),
  symptoms: z.string().optional(),
  urgencyLevel: z.number().min(1).max(5).default(1),
  notes: z.string().optional(),
  timezone: z.string().default('UTC'),
});

const appointmentUpdateSchema = z.object({
  status: z.enum(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).optional(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  appointmentTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  duration: z.number().min(15).max(180).optional(),
  symptoms: z.string().optional(),
  notes: z.string().optional(),
  meetingUrl: z.string().url().optional(),
  cancellationReason: z.string().optional(),
});

// GET /api/appointments - Get appointments with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const providerId = searchParams.get('providerId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const appointmentType = searchParams.get('appointmentType');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Create alias for provider user table
    const providerUser = alias(users, 'providerUser');

    let query = db
      .select({
        id: telemedicineAppointments.id,
        patientId: telemedicineAppointments.patientId,
        providerId: telemedicineAppointments.providerId,
        appointmentDate: telemedicineAppointments.scheduledAt,
        appointmentTime: telemedicineAppointments.scheduledAt,
        duration: telemedicineAppointments.durationMinutes,
        status: telemedicineAppointments.status,
        appointmentType: telemedicineAppointments.appointmentType,
        symptoms: telemedicineAppointments.symptoms,
        notes: telemedicineAppointments.patientNotes,
        meetingUrl: telemedicineAppointments.meetingUrl,
        totalCost: telemedicineAppointments.fee,
        createdAt: telemedicineAppointments.createdAt,
        updatedAt: telemedicineAppointments.updatedAt,
        // Provider details
        providerFirstName: providerUser.firstName,
        providerLastName: providerUser.lastName,
        providerSpecialization: healthcareProviders.specialty,
        // Patient details
        patientFirstName: users.firstName,
        patientLastName: users.lastName,
        patientEmail: users.email,
      })
      .from(telemedicineAppointments)
      .leftJoin(healthcareProviders, eq(telemedicineAppointments.providerId, healthcareProviders.id))
      .leftJoin(users, eq(telemedicineAppointments.patientId, users.id))
      .leftJoin(providerUser, eq(healthcareProviders.userId, providerUser.id));

    // Apply filters
    const conditions = [];
    if (patientId) {
      conditions.push(eq(telemedicineAppointments.patientId, patientId));
    }
    if (providerId) {
      conditions.push(eq(telemedicineAppointments.providerId, providerId));
    }
    if (status) {
      conditions.push(eq(telemedicineAppointments.status, status));
    }
    if (appointmentType) {
      conditions.push(eq(telemedicineAppointments.appointmentType, appointmentType));
    }
    if (startDate && endDate) {
      conditions.push(
        between(
          telemedicineAppointments.scheduledAt,
          new Date(startDate),
          new Date(endDate)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const appointments = await query
      .limit(limit)
      .offset(offset)
      .execute();

    return NextResponse.json({
      success: true,
      data: appointments,
      pagination: {
        limit,
        offset,
        total: appointments.length,
      },
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Book a new appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = appointmentBookingSchema.parse(body);

    // Verify patient exists
    const patient = await db
      .select()
      .from(users)
      .where(eq(users.id, validatedData.patientId))
      .limit(1)
      .execute();

    if (patient.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Verify provider exists and is available
    const provider = await db
      .select()
      .from(healthcareProviders)
      .where(
        and(
          eq(healthcareProviders.id, validatedData.providerId),
          eq(healthcareProviders.verificationStatus, 'verified'),
          eq(healthcareProviders.isActive, true)
        )
      )
      .limit(1)
      .execute();

    if (provider.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Provider not found or not available' },
        { status: 404 }
      );
    }

    // Check provider availability for the requested time slot
    const appointmentDateTime = new Date(`${validatedData.appointmentDate}T${validatedData.appointmentTime}:00`);
    const dayOfWeek = appointmentDateTime.getDay();
    
    const availability = await db
      .select()
      .from(providerAvailability)
      .where(
        and(
          eq(providerAvailability.providerId, validatedData.providerId),
          eq(providerAvailability.dayOfWeek, dayOfWeek),
          eq(providerAvailability.isActive, true),
          lte(providerAvailability.startTime, validatedData.appointmentTime),
          gte(providerAvailability.endTime, validatedData.appointmentTime)
        )
      )
      .limit(1)
      .execute();

    if (availability.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Provider is not available at the requested time' },
        { status: 409 }
      );
    }

    // Check for conflicting appointments
    const endTime = new Date(appointmentDateTime.getTime() + validatedData.duration * 60000);
    const conflictingAppointments = await db
      .select()
      .from(telemedicineAppointments)
      .where(
        and(
          eq(telemedicineAppointments.providerId, validatedData.providerId),
          or(
            and(
              gte(telemedicineAppointments.scheduledAt, appointmentDateTime),
              lte(telemedicineAppointments.scheduledAt, endTime)
            ),
            and(
              lte(telemedicineAppointments.scheduledAt, appointmentDateTime),
              gte(telemedicineAppointments.scheduledAt, new Date(appointmentDateTime.getTime() - 180 * 60000)) // Check 3 hours before
            )
          ),
          or(
            eq(telemedicineAppointments.status, 'scheduled'),
            eq(telemedicineAppointments.status, 'confirmed'),
            eq(telemedicineAppointments.status, 'in-progress')
          )
        )
      )
      .execute();

    if (conflictingAppointments.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Time slot is already booked' },
        { status: 409 }
      );
    }

    // Calculate total cost
    const totalCost = provider[0].consultationFee;

    // Generate meeting URL (placeholder - integrate with video service)
    const meetingUrl = `https://meet.mediscope.ai/room/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create appointment
    const newAppointment = await db
      .insert(telemedicineAppointments)
      .values({
        patientId: validatedData.patientId,
        providerId: validatedData.providerId,
        scheduledAt: appointmentDateTime,
        durationMinutes: validatedData.duration,
        appointmentType: validatedData.appointmentType,
        reasonForVisit: validatedData.reasonForVisit,
        symptoms: validatedData.symptoms,
        urgencyLevel: validatedData.urgencyLevel,
        patientNotes: validatedData.notes,
        status: 'scheduled',
        fee: totalCost,
        meetingUrl,
      })
      .returning()
      .execute();

    // Get provider user details
    const providerUserDetails = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, provider[0].userId))
      .limit(1)
      .execute();

    // Return appointment details with provider and patient info
    const appointmentWithDetails = {
      ...newAppointment[0],
      provider: {
        id: provider[0].id,
        firstName: providerUserDetails[0]?.firstName,
        lastName: providerUserDetails[0]?.lastName,
        specialty: provider[0].specialty,
        consultationFee: provider[0].consultationFee,
      },
      patient: {
        id: patient[0].id,
        firstName: patient[0].firstName,
        lastName: patient[0].lastName,
        email: patient[0].email,
      },
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Appointment booked successfully',
        data: appointmentWithDetails,
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

    console.error('Error booking appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to book appointment' },
      { status: 500 }
    );
  }
}

// PUT /api/appointments - Update appointment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, ...updateData } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    // Validate update data
    const validatedData = appointmentUpdateSchema.parse(updateData);

    // Check if appointment exists
    const existingAppointment = await db
      .select()
      .from(telemedicineAppointments)
      .where(eq(telemedicineAppointments.id, appointmentId))
      .limit(1)
      .execute();

    if (existingAppointment.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Prevent updates to completed or cancelled appointments
    if (existingAppointment[0].status && ['completed', 'cancelled'].includes(existingAppointment[0].status)) {
      return NextResponse.json(
        { success: false, error: 'Cannot update completed or cancelled appointments' },
        { status: 409 }
      );
    }

    // Update appointment
    const updatedAppointment = await db
      .update(telemedicineAppointments)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(telemedicineAppointments.id, appointmentId))
      .returning()
      .execute();

    return NextResponse.json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment[0],
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

    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}