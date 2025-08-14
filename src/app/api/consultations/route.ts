import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { consultationNotes, telemedicineAppointments, healthcareProviders, users, prescriptions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// Validation schema for consultation notes
const consultationNotesSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  providerId: z.string().min(1, 'Provider ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  chiefComplaint: z.string().min(1, 'Chief complaint is required'),
  historyOfPresentIllness: z.string().optional(),
  physicalExamination: z.string().optional(),
  assessment: z.string().min(1, 'Assessment is required'),
  treatmentPlan: z.string().min(1, 'Treatment plan is required'),
  followUpInstructions: z.string().optional(),
  prescriptions: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    instructions: z.string().optional(),
  })).default([]),
  vitalSigns: z.object({
    bloodPressure: z.string().optional(),
    heartRate: z.string().optional(),
    temperature: z.string().optional(),
    respiratoryRate: z.string().optional(),
    oxygenSaturation: z.string().optional(),
    weight: z.string().optional(),
    height: z.string().optional(),
  }).optional(),
  diagnosis: z.array(z.string()).default([]),
  labOrders: z.array(z.string()).default([]),
  referrals: z.array(z.object({
    specialty: z.string(),
    reason: z.string(),
    urgency: z.enum(['routine', 'urgent', 'stat']),
  })).default([]),
});

const consultationUpdateSchema = consultationNotesSchema.partial().omit({ appointmentId: true, providerId: true, patientId: true });

// GET /api/consultations - Get consultation notes with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('appointmentId');
    const patientId = searchParams.get('patientId');
    const providerId = searchParams.get('providerId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Create alias for provider user table
    const providerUser = alias(users, 'providerUser');

    // Apply filters
    const conditions = [];
    if (appointmentId) {
      conditions.push(eq(consultationNotes.appointmentId, appointmentId));
    }
    if (patientId) {
      conditions.push(eq(consultationNotes.patientId, patientId));
    }
    if (providerId) {
      conditions.push(eq(consultationNotes.providerId, providerId));
    }

    const baseQuery = db
      .select({
        // Consultation notes
        id: consultationNotes.id,
        appointmentId: consultationNotes.appointmentId,
        providerId: consultationNotes.providerId,
        patientId: consultationNotes.patientId,
        chiefComplaint: consultationNotes.chiefComplaint,
        historyOfPresentIllness: consultationNotes.historyOfPresentIllness,
        physicalExamination: consultationNotes.physicalExamination,
        assessment: consultationNotes.assessment,
        treatmentPlan: consultationNotes.treatmentPlan,
        followUpInstructions: consultationNotes.followUpInstructions,
        prescriptions: consultationNotes.prescriptions,
        vitalSigns: consultationNotes.vitalSigns,
        diagnosis: consultationNotes.diagnosis,
        labOrders: consultationNotes.labOrders,
        referrals: consultationNotes.referrals,
        followUpDate: consultationNotes.followUpDate,
        createdAt: consultationNotes.createdAt,
        updatedAt: consultationNotes.updatedAt,
        // Appointment details
        scheduledAt: telemedicineAppointments.scheduledAt,
        appointmentType: telemedicineAppointments.appointmentType,
        // Provider details
        providerFirstName: providerUser.firstName,
        providerLastName: providerUser.lastName,
        providerSpecialty: healthcareProviders.specialty,
        // Patient details
        patientFirstName: users.firstName,
        patientLastName: users.lastName,
        patientEmail: users.email,
      })
      .from(consultationNotes)
      .leftJoin(telemedicineAppointments, eq(consultationNotes.appointmentId, telemedicineAppointments.id))
      .leftJoin(healthcareProviders, eq(consultationNotes.providerId, healthcareProviders.id))
      .leftJoin(users, eq(consultationNotes.patientId, users.id))
      .leftJoin(providerUser, eq(healthcareProviders.userId, providerUser.id));

    const query = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    const consultations = await query
      .orderBy(desc(consultationNotes.createdAt))
      .limit(limit)
      .offset(offset)
      .execute();

    return NextResponse.json({
      success: true,
      data: consultations,
      pagination: {
        limit,
        offset,
        total: consultations.length,
      },
    });
  } catch (error) {
    console.error('Error fetching consultation notes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch consultation notes' },
      { status: 500 }
    );
  }
}

// POST /api/consultations - Create consultation notes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = consultationNotesSchema.parse(body);

    // Verify appointment exists and is completed or in-progress
    const appointment = await db
      .select()
      .from(telemedicineAppointments)
      .where(
        and(
          eq(telemedicineAppointments.id, validatedData.appointmentId),
          eq(telemedicineAppointments.providerId, validatedData.providerId),
          eq(telemedicineAppointments.patientId, validatedData.patientId)
        )
      )
      .limit(1)
      .execute();

    if (appointment.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found or access denied' },
        { status: 404 }
      );
    }

    if (!appointment[0].status || !['in-progress', 'completed'].includes(appointment[0].status)) {
      return NextResponse.json(
        { success: false, error: 'Can only create notes for in-progress or completed appointments' },
        { status: 409 }
      );
    }

    // Check if consultation notes already exist for this appointment
    const existingNotes = await db
      .select()
      .from(consultationNotes)
      .where(eq(consultationNotes.appointmentId, validatedData.appointmentId))
      .limit(1)
      .execute();

    if (existingNotes.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Consultation notes already exist for this appointment' },
        { status: 409 }
      );
    }

    // Create consultation notes
    const newConsultationNotes = await db
      .insert(consultationNotes)
      .values(validatedData)
      .returning()
      .execute();

    // Create prescriptions if medications are provided
    if (validatedData.prescriptions && validatedData.prescriptions.length > 0) {
      const prescriptionData = validatedData.prescriptions.map(med => ({
        appointmentId: validatedData.appointmentId,
        providerId: validatedData.providerId,
        patientId: validatedData.patientId,
        medicationName: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions || '',
        status: 'active' as const,
      }));

      await db
        .insert(prescriptions)
        .values(prescriptionData)
        .execute();
    }

    // Update appointment status to completed if it was in-progress
    if (appointment[0].status === 'in-progress') {
      await db
        .update(telemedicineAppointments)
        .set({
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(telemedicineAppointments.id, validatedData.appointmentId))
        .execute();
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Consultation notes created successfully',
        data: newConsultationNotes[0],
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

    console.error('Error creating consultation notes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create consultation notes' },
      { status: 500 }
    );
  }
}

// PUT /api/consultations - Update consultation notes
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { consultationId, ...updateData } = body;

    if (!consultationId) {
      return NextResponse.json(
        { success: false, error: 'Consultation ID is required' },
        { status: 400 }
      );
    }

    // Validate update data
    const validatedData = consultationUpdateSchema.parse(updateData);

    // Check if consultation notes exist
    const existingNotes = await db
      .select()
      .from(consultationNotes)
      .where(eq(consultationNotes.id, consultationId))
      .limit(1)
      .execute();

    if (existingNotes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Consultation notes not found' },
        { status: 404 }
      );
    }

    // Update consultation notes
    const updatedNotes = await db
      .update(consultationNotes)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(consultationNotes.id, consultationId))
      .returning()
      .execute();

    // Update prescriptions if medications are provided
    if (validatedData.prescriptions) {
      // Delete existing prescriptions for this appointment
      await db
        .delete(prescriptions)
        .where(eq(prescriptions.appointmentId, existingNotes[0].appointmentId))
        .execute();

      // Create new prescriptions
      if (validatedData.prescriptions && validatedData.prescriptions.length > 0) {
        const prescriptionData = validatedData.prescriptions.map(med => ({
          appointmentId: existingNotes[0].appointmentId,
          providerId: existingNotes[0].providerId,
          patientId: existingNotes[0].patientId,
          medicationName: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions || '',
          status: 'active' as const,
        }));

        await db
          .insert(prescriptions)
          .values(prescriptionData)
          .execute();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Consultation notes updated successfully',
      data: updatedNotes[0],
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

    console.error('Error updating consultation notes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update consultation notes' },
      { status: 500 }
    );
  }
}