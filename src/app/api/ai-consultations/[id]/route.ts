import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiConsultations, consultationMessages, aiProviders } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    
    console.log('🔍 AI Consultation GET Request:', {
      consultationId: id,
      userId: userId,
      timestamp: new Date().toISOString()
    });
    
    if (!userId) {
      console.log('❌ Unauthorized access attempt for consultation:', id);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First, check if consultation exists at all
    const consultationExists = await db
      .select({ id: aiConsultations.id, patientId: aiConsultations.patientId })
      .from(aiConsultations)
      .where(eq(aiConsultations.id, id))
      .limit(1);
    
    console.log('📋 Consultation existence check:', {
      consultationId: id,
      exists: consultationExists.length > 0,
      foundConsultation: consultationExists[0] || null
    });

    // Get consultation with AI provider details
    const consultation = await db
      .select({
        consultation: aiConsultations,
        aiProvider: aiProviders
      })
      .from(aiConsultations)
      .leftJoin(aiProviders, eq(aiConsultations.aiProviderId, aiProviders.id))
      .where(
        and(
          eq(aiConsultations.id, id),
          eq(aiConsultations.patientId, userId)
        )
      )
      .limit(1);

    console.log('🔗 Consultation with AI provider query result:', {
      consultationId: id,
      userId: userId,
      resultCount: consultation.length,
      hasAiProvider: consultation[0]?.aiProvider ? true : false,
      consultationData: consultation[0]?.consultation || null
    });

    if (consultation.length === 0) {
      console.log('❌ Consultation not found or access denied:', {
        consultationId: id,
        userId: userId,
        consultationExists: consultationExists.length > 0,
        patientIdMismatch: consultationExists[0]?.patientId !== userId
      });
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    // Get consultation messages
    const messages = await db
      .select()
      .from(consultationMessages)
      .where(eq(consultationMessages.consultationId, id))
      .orderBy(consultationMessages.createdAt);

    // Structure the response properly for frontend
    const consultationData = {
      ...consultation[0].consultation,
      aiProvider: consultation[0].aiProvider,
      messages
    };

    return NextResponse.json({
      consultation: consultationData
    });
  } catch (error: unknown) {
    console.error('Error fetching AI consultation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI consultation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Verify consultation belongs to user
    const existingConsultation = await db
      .select()
      .from(aiConsultations)
      .where(
        and(
          eq(aiConsultations.id, id),
          eq(aiConsultations.patientId, userId)
        )
      )
      .limit(1);

    if (existingConsultation.length === 0) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    const updatedConsultation = await db
      .update(aiConsultations)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(aiConsultations.id, id))
      .returning();

    return NextResponse.json(updatedConsultation[0]);
  } catch (error: unknown) {
    console.error('Error updating AI consultation:', error);
    return NextResponse.json(
      { error: 'Failed to update AI consultation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify consultation belongs to user
    const existingConsultation = await db
      .select()
      .from(aiConsultations)
      .where(
        and(
          eq(aiConsultations.id, id),
          eq(aiConsultations.patientId, userId)
        )
      )
      .limit(1);

    if (existingConsultation.length === 0) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    // Delete consultation (messages will be cascade deleted)
    await db
      .delete(aiConsultations)
      .where(eq(aiConsultations.id, id));

    return NextResponse.json({ message: 'Consultation deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting AI consultation:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI consultation' },
      { status: 500 }
    );
  }
}