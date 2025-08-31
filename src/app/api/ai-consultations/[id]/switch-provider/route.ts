import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiConsultations, consultationMessages, aiProviders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const consultationId = id;
    const { newProviderId, reason, transferContext } = await request.json();

    if (!newProviderId) {
      return NextResponse.json(
        { error: 'New provider ID is required' },
        { status: 400 }
      );
    }

    // Get current consultation
    const consultation = await db
      .select()
      .from(aiConsultations)
      .where(eq(aiConsultations.id, consultationId))
      .limit(1);

    if (consultation.length === 0) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    // Get new provider details
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

    // Get current provider details for context
    const currentProvider = await db
      .select()
      .from(aiProviders)
      .where(eq(aiProviders.id, consultation[0].aiProviderId))
      .limit(1);

    // Update consultation with new provider
    await db
      .update(aiConsultations)
      .set({
        aiProviderId: newProviderId,
        updatedAt: new Date()
      })
      .where(eq(aiConsultations.id, consultationId));

    // Create a handoff message to document the provider switch
    const handoffMessage = `**Provider Handoff**

This consultation has been transferred from ${currentProvider[0]?.name || 'Previous Provider'} (${currentProvider[0]?.specialty || 'Unknown Specialty'}) to ${newProvider[0].name} (${newProvider[0].specialty}).

**Reason for transfer:** ${reason || 'Specialist expertise required'}

**Context for new provider:** ${transferContext || 'Please review the conversation history above for patient context.'}

---

Hello! I'm ${newProvider[0].name}, a ${newProvider[0].specialty} specialist. I've reviewed your conversation and I'm here to help with your ${newProvider[0].specialty.toLowerCase()} concerns. How can I assist you today?`;

    // Save handoff message
    await db
      .insert(consultationMessages)
      .values({
        consultationId: consultationId,
        senderId: 'system',
        senderType: 'system',
        message: handoffMessage,
        messageType: 'handoff',
        metadata: {
          handoffType: 'provider_switch',
          previousProvider: consultation[0].aiProviderId,
          newProvider: newProviderId,
          reason,
          transferContext,
          timestamp: new Date().toISOString()
        }
      });

    // Update consultation message count
    await db
      .update(aiConsultations)
      .set({
        totalMessages: (consultation[0].totalMessages || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(aiConsultations.id, consultationId));

    return NextResponse.json({
      success: true,
      message: 'Provider switched successfully',
      newProvider: {
        id: newProvider[0].id,
        name: newProvider[0].name,
        specialty: newProvider[0].specialty,
        personalityTraits: newProvider[0].personalityTraits,
        consultationStyle: newProvider[0].consultationStyle
      },
      handoffMessageId: consultationId
    });

  } catch (error: unknown) {
    console.error('Error switching provider:', error);
    return NextResponse.json(
      { error: 'Failed to switch provider' },
      { status: 500 }
    );
  }
}

// GET endpoint to get available providers for switching
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const consultationId = id;
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');

    // Get current consultation to exclude current provider
    const consultation = await db
      .select()
      .from(aiConsultations)
      .where(eq(aiConsultations.id, consultationId))
      .limit(1);

    if (consultation.length === 0) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    // Build query conditions
    const whereConditions = [
      eq(aiProviders.isActive, true),
      eq(aiProviders.isAvailable, true)
    ];

    // Exclude current provider
    if (consultation[0].aiProviderId) {
      whereConditions.push(eq(aiProviders.id, consultation[0].aiProviderId));
    }

    // Filter by specialty if provided
    if (specialty) {
      whereConditions.push(eq(aiProviders.specialty, specialty));
    }

    // Get available providers
    const availableProviders = await db
      .select({
        id: aiProviders.id,
        name: aiProviders.name,
        specialty: aiProviders.specialty,
        yearsOfExperience: aiProviders.yearsOfExperience,
        personalityTraits: aiProviders.personalityTraits,
        consultationStyle: aiProviders.consultationStyle,
        specializations: aiProviders.specializations
      })
      .from(aiProviders)
      .where(and(...whereConditions))
      .orderBy(aiProviders.specialty, aiProviders.name);

    // Filter out current provider from results
    const filteredProviders = availableProviders.filter(
      provider => provider.id !== consultation[0].aiProviderId
    );

    return NextResponse.json({
      success: true,
      providers: filteredProviders,
      currentProviderId: consultation[0].aiProviderId
    });

  } catch (error: unknown) {
    console.error('Error getting available providers:', error);
    return NextResponse.json(
      { error: 'Failed to get available providers' },
      { status: 500 }
    );
  }
}