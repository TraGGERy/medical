import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiConsultations, consultationMessages, aiProviders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
  id: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
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
    const { newProviderId, reason } = body;

    if (!newProviderId) {
      return NextResponse.json(
        { error: 'New provider ID is required' },
        { status: 400 }
      );
    }

    // Verify consultation belongs to user and is active
    const consultation = await db
      .select()
      .from(aiConsultations)
      .where(
        and(
          eq(aiConsultations.id, id),
          eq(aiConsultations.patientId, userId),
          eq(aiConsultations.status, 'active')
        )
      )
      .limit(1);

    if (consultation.length === 0) {
      return NextResponse.json(
        { error: 'Active consultation not found' },
        { status: 404 }
      );
    }

    // Verify new provider exists and is available
    const newProvider = await db
      .select()
      .from(aiProviders)
      .where(
        and(
          eq(aiProviders.id, newProviderId),
          eq(aiProviders.isActive, true),
          eq(aiProviders.isAvailable, true)
        )
      )
      .limit(1);

    if (newProvider.length === 0) {
      return NextResponse.json(
        { error: 'New provider not found or not available' },
        { status: 404 }
      );
    }

    const oldProviderId = consultation[0].aiProviderId;

    // Update consultation with new provider
    await db
      .update(aiConsultations)
      .set({
        aiProviderId: newProviderId,
        updatedAt: new Date()
      })
      .where(eq(aiConsultations.id, id));

    // Add a system message about the doctor switch
    const switchMessage = await db
      .insert(consultationMessages)
      .values({
        consultationId: id,
        senderId: 'system',
        senderType: 'system',
        message: `Doctor switched from ${consultation[0].aiProviderId} to ${newProvider[0].name} (${newProvider[0].specialty}). ${reason ? `Reason: ${reason}` : ''}`,
        messageType: 'system',
        metadata: {
          switchType: 'doctor_referral',
          oldProviderId,
          newProviderId,
          reason
        }
      })
      .returning();

    // Generate introduction message from new doctor
    const introMessage = `Hello! I'm Dr. ${newProvider[0].name}, a ${newProvider[0].specialty} specialist. I've been brought in to assist with your case. I've reviewed your conversation history and I'm here to provide specialized care in my area of expertise. How can I help you today?`;

    const aiIntroMessage = await db
      .insert(consultationMessages)
      .values({
        consultationId: id,
        senderId: 'ai',
        senderType: 'ai',
        message: introMessage,
        messageType: 'text',
        metadata: {
          isIntroduction: true,
          newProvider: true,
          providerId: newProviderId
        }
      })
      .returning();

    // Update message count
    await db
      .update(aiConsultations)
      .set({
        totalMessages: (consultation[0].totalMessages || 0) + 2, // +2 for system and intro messages
        updatedAt: new Date()
      })
      .where(eq(aiConsultations.id, id));

    return NextResponse.json({
      success: true,
      newProvider: newProvider[0],
      switchMessage: {
        ...switchMessage[0],
        content: switchMessage[0].message
      },
      introMessage: {
        ...aiIntroMessage[0],
        content: aiIntroMessage[0].message
      }
    });
  } catch (error: unknown) {
    console.error('Error switching doctor:', error);
    return NextResponse.json(
      { error: 'Failed to switch doctor' },
      { status: 500 }
    );
  }
}