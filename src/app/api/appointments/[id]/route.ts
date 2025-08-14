import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { telemedicineAppointments, healthcareProviders, users, consultationNotes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { z } from 'zod';

interface RouteParams {
  id: string;
}

// Validation schema for appointment updates
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

const appointmentCancellationSchema = z.object({
  cancellationReason: z.string().min(1, 'Cancellation reason is required'),
  cancelledBy: z.enum(['patient', 'provider', 'admin']),
  refundAmount: z.number().min(0).optional(),
});

// GET /api/appointments/[id] - Get specific appointment details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id: appointmentId } = await params;

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    // Create alias for provider user table
    const providerUser = alias(users, 'providerUser');

    // Get appointment with provider and patient details
    const appointment = await db
      .select({
        // Appointment details
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
        cancellationReason: telemedicineAppointments.cancellationReason,
        cancelledBy: telemedicineAppointments.cancelledBy,
        createdAt: telemedicineAppointments.createdAt,
        updatedAt: telemedicineAppointments.updatedAt,
        // Provider details from joined users table
        providerFirstName: providerUser.firstName,
        providerLastName: providerUser.lastName,
        providerEmail: providerUser.email,
        providerSpecialization: healthcareProviders.specialty,
        providerYearsOfExperience: healthcareProviders.yearsOfExperience,
        providerBio: healthcareProviders.bio,
        providerConsultationFee: healthcareProviders.consultationFee,
        providerLanguages: healthcareProviders.languages,
        providerRating: healthcareProviders.rating,
        // Patient details
        patientFirstName: users.firstName,
        patientLastName: users.lastName,
        patientEmail: users.email,
      })
      .from(telemedicineAppointments)
      .leftJoin(healthcareProviders, eq(telemedicineAppointments.providerId, healthcareProviders.id))
      .leftJoin(users, eq(telemedicineAppointments.patientId, users.id))
      .leftJoin(providerUser, eq(healthcareProviders.userId, providerUser.id))
      .where(eq(telemedicineAppointments.id, appointmentId))
      .limit(1)
      .execute();

    if (appointment.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Get consultation notes if appointment is completed
    let consultationNotesData = null;
    if (appointment[0].status === 'completed') {
      const notes = await db
        .select()
        .from(consultationNotes)
        .where(eq(consultationNotes.appointmentId, appointmentId))
        .execute();
      
      consultationNotesData = notes.length > 0 ? notes[0] : null;
    }

    // Structure the response
    const appointmentDetails = {
      id: appointment[0].id,
      appointmentDate: appointment[0].appointmentDate,
      appointmentTime: appointment[0].appointmentTime,
      duration: appointment[0].duration,
      status: appointment[0].status,
      appointmentType: appointment[0].appointmentType,
      symptoms: appointment[0].symptoms,
      notes: appointment[0].notes,
      meetingUrl: appointment[0].meetingUrl,
      totalCost: appointment[0].totalCost,
      cancellationReason: appointment[0].cancellationReason,
      cancelledBy: appointment[0].cancelledBy,
      createdAt: appointment[0].createdAt,
      updatedAt: appointment[0].updatedAt,
      provider: {
        id: appointment[0].providerId,
        firstName: appointment[0].providerFirstName,
        lastName: appointment[0].providerLastName,
        email: appointment[0].providerEmail,
        specialty: appointment[0].providerSpecialization,
        yearsOfExperience: appointment[0].providerYearsOfExperience,
        bio: appointment[0].providerBio,
        consultationFee: appointment[0].providerConsultationFee,
        languages: appointment[0].providerLanguages,
        rating: appointment[0].providerRating,
      },
      patient: {
        id: appointment[0].patientId,
        firstName: appointment[0].patientFirstName,
        lastName: appointment[0].patientLastName,
        email: appointment[0].patientEmail,
      },
      consultationNotes: consultationNotesData,
    };

    return NextResponse.json({
      success: true,
      data: appointmentDetails,
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id] - Update specific appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id: appointmentId } = await params;
    const body = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    // Validate update data
    const validatedData = appointmentUpdateSchema.parse(body);

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

    // Prevent updates to completed or cancelled appointments (except for adding notes)
    const currentStatus = existingAppointment[0].status;
    if (currentStatus && ['completed', 'cancelled'].includes(currentStatus)) {
      // Only allow updating notes for completed/cancelled appointments
      const allowedFields = ['notes'];
      const updateFields = Object.keys(validatedData);
      const hasDisallowedFields = updateFields.some(field => !allowedFields.includes(field));
      
      if (hasDisallowedFields) {
        return NextResponse.json(
          { success: false, error: 'Can only update notes for completed or cancelled appointments' },
          { status: 409 }
        );
      }
    }

    // Special handling for status changes
    if (validatedData.status) {
      const statusTransitions: Record<string, string[]> = {
        'scheduled': ['confirmed', 'cancelled', 'no-show'],
        'confirmed': ['in-progress', 'cancelled', 'no-show'],
        'in-progress': ['completed', 'cancelled'],
        'completed': [], // No transitions allowed from completed
        'cancelled': [], // No transitions allowed from cancelled
        'no-show': [], // No transitions allowed from no-show
      };

      const allowedTransitions = statusTransitions[currentStatus || ''] || [];
      if (validatedData.status && !allowedTransitions.includes(validatedData.status)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid status transition from ${currentStatus} to ${validatedData.status}` 
          },
          { status: 409 }
        );
      }
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

// DELETE /api/appointments/[id] - Cancel appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id: appointmentId } = await params;
    const body = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    // Validate cancellation data
    const validatedData = appointmentCancellationSchema.parse(body);

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

    // Check if appointment can be cancelled
    const currentStatus = existingAppointment[0].status;
    if (currentStatus && ['completed', 'cancelled', 'no-show'].includes(currentStatus)) {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel appointment with current status' },
        { status: 409 }
      );
    }

    // Calculate refund amount based on cancellation policy
    const appointmentDate = new Date(existingAppointment[0].scheduledAt);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let refundAmount = 0;
    if (hoursUntilAppointment > 24) {
      refundAmount = parseFloat(existingAppointment[0].fee || '0'); // Full refund
    } else if (hoursUntilAppointment > 2) {
      refundAmount = parseFloat(existingAppointment[0].fee || '0') * 0.5; // 50% refund
    }
    // No refund for cancellations within 2 hours

    // Update appointment status to cancelled
    const cancelledAppointment = await db
      .update(telemedicineAppointments)
      .set({
        status: 'cancelled',
        cancellationReason: validatedData.cancellationReason,
        cancelledBy: validatedData.cancelledBy,
        // refundAmount: validatedData.refundAmount || refundAmount, // Remove this as it doesn't exist in schema
        updatedAt: new Date(),
      })
      .where(eq(telemedicineAppointments.id, appointmentId))
      .returning()
      .execute();

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: {
        ...cancelledAppointment[0],
        refundAmount: validatedData.refundAmount || refundAmount,
        cancellationPolicy: {
          hoursUntilAppointment: Math.round(hoursUntilAppointment * 100) / 100,
          refundPercentage: hoursUntilAppointment > 24 ? 100 : hoursUntilAppointment > 2 ? 50 : 0,
        },
      },
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

    console.error('Error cancelling appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}