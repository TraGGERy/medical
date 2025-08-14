import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { providerHandoffs, aiConsultations, healthcareProviders } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// GET /api/provider-handoffs - Get handoff requests
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const baseQuery = db
      .select({
        handoff: providerHandoffs,
        consultation: aiConsultations,
        humanProvider: healthcareProviders
      })
      .from(providerHandoffs)
      .leftJoin(aiConsultations, eq(providerHandoffs.aiConsultationId, aiConsultations.id))
      .leftJoin(healthcareProviders, eq(providerHandoffs.toHumanProviderId, healthcareProviders.id));

    const handoffs = await (status && status !== 'all' 
      ? baseQuery.where(eq(providerHandoffs.status, status))
      : baseQuery
    )
      .orderBy(desc(providerHandoffs.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      handoffs: handoffs.map(row => ({
        ...row.handoff,
        consultation: row.consultation,
        humanProvider: row.humanProvider
      }))
    });
  } catch (error: unknown) {
    console.error('Error fetching handoffs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/provider-handoffs - Create handoff request
export async function POST(request: NextRequest) {
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
      consultationId,
      humanProviderId,
      reason,
      urgencyLevel = 1,
      patientSummary,
      aiRecommendations
    } = body;

    // Validate required fields
    if (!consultationId || !reason || !humanProviderId) {
      return NextResponse.json(
        { error: 'Missing required fields: consultationId, reason, and humanProviderId are required' },
        { status: 400 }
      );
    }

    // Verify consultation exists and belongs to user
    const consultation = await db
      .select()
      .from(aiConsultations)
      .where(
        and(
          eq(aiConsultations.id, consultationId),
          eq(aiConsultations.patientId, userId)
        )
      )
      .limit(1);

    if (consultation.length === 0) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    // Verify the provider exists
    const provider = await db
      .select()
      .from(healthcareProviders)
      .where(eq(healthcareProviders.id, humanProviderId))
      .limit(1);

    if (provider.length === 0) {
      return NextResponse.json(
        { error: 'Healthcare provider not found' },
        { status: 404 }
      );
    }

    // Create handoff request
    const handoffId = nanoid();
    const handoffData = {
      id: handoffId,
      aiConsultationId: consultationId,
      fromAiProviderId: consultation[0].aiProviderId,
      toHumanProviderId: humanProviderId,
      reason: reason,
      aiSummary: patientSummary || 'AI consultation summary',
      urgencyLevel,
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.insert(providerHandoffs).values(handoffData);

    // Update consultation status to indicate handoff requested
    await db
      .update(aiConsultations)
      .set({ 
        status: 'handoff_requested',
        updatedAt: new Date()
      })
      .where(eq(aiConsultations.id, consultationId));

    return NextResponse.json({
      handoff: handoffData,
      message: 'Handoff request created successfully'
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating handoff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}