import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { providerHandoffs, aiConsultations, healthcareProviders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/provider-handoffs/[id] - Get specific handoff
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const handoff = await db
      .select({
        handoff: providerHandoffs,
        consultation: aiConsultations,
        humanProvider: healthcareProviders
      })
      .from(providerHandoffs)
      .leftJoin(aiConsultations, eq(providerHandoffs.aiConsultationId, aiConsultations.id))
      .leftJoin(healthcareProviders, eq(providerHandoffs.toHumanProviderId, healthcareProviders.id))
      .where(eq(providerHandoffs.id, params.id))
      .limit(1);

    if (handoff.length === 0) {
      return NextResponse.json(
        { error: 'Handoff not found' },
        { status: 404 }
      );
    }

    const result = handoff[0];

    // Check if user has access to this handoff
    if (result.consultation?.patientId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      handoff: {
        ...result.handoff,
        consultation: result.consultation,
        humanProvider: result.humanProvider
      }
    });
  } catch (error: unknown) {
    console.error('Error fetching handoff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/provider-handoffs/[id] - Update handoff status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      status,
      humanProviderId,
      acceptedBy,
      rejectionReason,
      notes
    } = body;

    // Validate status
    const validStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get existing handoff
    const existingHandoff = await db
      .select({
        handoff: providerHandoffs,
        consultation: aiConsultations
      })
      .from(providerHandoffs)
      .leftJoin(aiConsultations, eq(providerHandoffs.aiConsultationId, aiConsultations.id))
      .where(eq(providerHandoffs.id, params.id))
      .limit(1);

    if (existingHandoff.length === 0) {
      return NextResponse.json(
        { error: 'Handoff not found' },
        { status: 404 }
      );
    }

    const handoff = existingHandoff[0].handoff;
    const consultation = existingHandoff[0].consultation;

    // Check permissions
    if (consultation?.patientId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: {
      updatedAt: Date;
      status?: string;
      acceptedAt?: Date;
      completedAt?: Date;
      toHumanProviderId?: string;
      handoffNotes?: string;
    } = {
      updatedAt: new Date()
    };

    if (status) {
      updateData.status = status;
      
      // Set timestamps based on status
      if (status === 'accepted') {
        updateData.acceptedAt = new Date();
      } else if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }

    if (humanProviderId !== undefined && humanProviderId !== null) {
      updateData.toHumanProviderId = humanProviderId;
    }

    if (notes !== undefined) {
      updateData.handoffNotes = notes;
    }

    // Update handoff
    await db
      .update(providerHandoffs)
      .set(updateData)
      .where(eq(providerHandoffs.id, params.id));

    // Update consultation status based on handoff status
    if (status === 'accepted' && consultation) {
      await db
        .update(aiConsultations)
        .set({ 
          status: 'transferred_to_human',
          updatedAt: new Date()
        })
        .where(eq(aiConsultations.id, consultation.id));
    } else if (status === 'rejected' && consultation) {
      await db
        .update(aiConsultations)
        .set({ 
          status: 'active', // Return to active AI consultation
          updatedAt: new Date()
        })
        .where(eq(aiConsultations.id, consultation.id));
    } else if (status === 'completed' && consultation) {
      await db
        .update(aiConsultations)
        .set({ 
          status: 'completed',
          updatedAt: new Date()
        })
        .where(eq(aiConsultations.id, consultation.id));
    }

    // Get updated handoff
    const updatedHandoff = await db
      .select({
        handoff: providerHandoffs,
        consultation: aiConsultations,
        humanProvider: healthcareProviders
      })
      .from(providerHandoffs)
      .leftJoin(aiConsultations, eq(providerHandoffs.aiConsultationId, aiConsultations.id))
      .leftJoin(healthcareProviders, eq(providerHandoffs.toHumanProviderId, healthcareProviders.id))
      .where(eq(providerHandoffs.id, params.id))
      .limit(1);

    const result = updatedHandoff[0];

    return NextResponse.json({
      handoff: {
        ...result.handoff,
        consultation: result.consultation,
        humanProvider: result.humanProvider
      },
      message: 'Handoff updated successfully'
    });
  } catch (error: unknown) {
    console.error('Error updating handoff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/provider-handoffs/[id] - Cancel handoff
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get existing handoff
    const existingHandoff = await db
      .select({
        handoff: providerHandoffs,
        consultation: aiConsultations
      })
      .from(providerHandoffs)
      .leftJoin(aiConsultations, eq(providerHandoffs.aiConsultationId, aiConsultations.id))
      .where(eq(providerHandoffs.id, params.id))
      .limit(1);

    if (existingHandoff.length === 0) {
      return NextResponse.json(
        { error: 'Handoff not found' },
        { status: 404 }
      );
    }

    const handoff = existingHandoff[0].handoff;
    const consultation = existingHandoff[0].consultation;

    // Check permissions - only the patient can cancel
    if (consultation?.patientId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Can only cancel pending handoffs
    if (handoff.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only cancel pending handoffs' },
        { status: 400 }
      );
    }

    // Update handoff status to cancelled
    await db
      .update(providerHandoffs)
      .set({ 
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(providerHandoffs.id, params.id));

    // Return consultation to active status
    if (consultation) {
      await db
        .update(aiConsultations)
        .set({ 
          status: 'active',
          updatedAt: new Date()
        })
        .where(eq(aiConsultations.id, consultation.id));
    }

    return NextResponse.json({
      message: 'Handoff cancelled successfully'
    });
  } catch (error: unknown) {
    console.error('Error cancelling handoff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}