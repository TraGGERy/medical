import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiConsultations, consultationMessages, aiProviders } from '@/lib/db/schema';
import { eq, and, desc, count, like, or, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';

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
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(aiConsultations.patientId, userId)];
    
    if (status && status !== 'all') {
      conditions.push(eq(aiConsultations.status, status));
    }

    if (search) {
      const searchCondition = or(
        like(aiConsultations.reasonForVisit, `%${search}%`),
        like(aiProviders.name, `%${search}%`),
        like(aiProviders.specialty, `%${search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(aiConsultations)
      .leftJoin(aiProviders, eq(aiConsultations.aiProviderId, aiProviders.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Query consultations with AI provider details and message counts
    const consultationsQuery = db
      .select({
        id: aiConsultations.id,
        patientId: aiConsultations.patientId,
        aiProviderId: aiConsultations.aiProviderId,
        sessionId: aiConsultations.sessionId,
        status: aiConsultations.status,
        reasonForVisit: aiConsultations.reasonForVisit,
        symptoms: aiConsultations.symptoms,
        urgencyLevel: aiConsultations.urgencyLevel,
        patientAge: aiConsultations.patientAge,
        patientGender: aiConsultations.patientGender,
        medicalHistory: aiConsultations.medicalHistory,
        currentMedications: aiConsultations.currentMedications,
        allergies: aiConsultations.allergies,
        aiAssessment: aiConsultations.aiAssessment,
        durationMinutes: aiConsultations.durationMinutes,
        startedAt: aiConsultations.startedAt,
        endedAt: aiConsultations.endedAt,
        createdAt: aiConsultations.createdAt,
        updatedAt: aiConsultations.updatedAt,
        // Flatten AI provider fields
        aiProviderName: aiProviders.name,
        aiProviderSpecialty: aiProviders.specialty,
        aiProviderProfileImageUrl: aiProviders.profileImageUrl,
        aiProviderRating: aiProviders.rating,
        messageCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${consultationMessages} 
          WHERE ${consultationMessages.consultationId} = ${aiConsultations.id}
        )`
      })
      .from(aiConsultations)
      .leftJoin(aiProviders, eq(aiConsultations.aiProviderId, aiProviders.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(aiConsultations.startedAt))
      .limit(limit)
      .offset(offset);

    const consultations = await consultationsQuery;

    // Process consultations to handle null jsonb fields and restructure aiProvider
    const processedConsultations = consultations.map(consultation => ({
      ...consultation,
      symptoms: consultation.symptoms || [],
      medicalHistory: consultation.medicalHistory || [],
      currentMedications: consultation.currentMedications || [],
      allergies: consultation.allergies || [],
      aiAssessment: consultation.aiAssessment || null,
      aiProvider: {
        id: consultation.aiProviderId,
        name: consultation.aiProviderName,
        specialty: consultation.aiProviderSpecialty,
        profileImageUrl: consultation.aiProviderProfileImageUrl,
        rating: consultation.aiProviderRating
      }
    }));

    return NextResponse.json({
      consultations: processedConsultations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      }
    });
  } catch (error: unknown) {
    console.error('Error fetching AI consultations:', error);
    console.error('Error stack:', (error as Error).stack);
    console.error('Error details:', {
      message: (error as Error).message,
      name: (error as Error).name,
      stack: (error as Error).stack
    });
    return NextResponse.json(
      { error: 'Failed to fetch AI consultations', details: (error as Error).message },
      { status: 500 }
    );
  }
}

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
      aiProviderId,
      reasonForVisit,
      symptoms,
      urgencyLevel = 1,
      patientAge,
      patientGender,
      medicalHistory,
      currentMedications,
      allergies
    } = body;

    // Validate required fields
    if (!aiProviderId || !reasonForVisit) {
      return NextResponse.json(
        { error: 'AI provider ID and reason for visit are required' },
        { status: 400 }
      );
    }

    // Check if AI provider exists and is available
    const provider = await db
      .select()
      .from(aiProviders)
      .where(
        and(
          eq(aiProviders.id, aiProviderId),
          eq(aiProviders.isActive, true),
          eq(aiProviders.isAvailable, true)
        )
      )
      .limit(1);

    if (provider.length === 0) {
      return NextResponse.json(
        { error: 'AI provider not found or unavailable' },
        { status: 404 }
      );
    }

    // Generate unique session ID
    const sessionId = `consultation_${uuidv4()}`;

    // Create new consultation
    const newConsultation = await db
      .insert(aiConsultations)
      .values({
        patientId: userId,
        aiProviderId,
        sessionId,
        reasonForVisit,
        symptoms,
        urgencyLevel,
        patientAge,
        patientGender,
        medicalHistory,
        currentMedications,
        allergies,
        status: 'active'
      })
      .returning();

    // Create initial welcome message from AI provider
    const welcomeMessage = `Hello! I'm ${provider[0].name}, your ${provider[0].specialty} specialist. I understand you're here because of ${reasonForVisit}. I'm here to help you understand your symptoms and provide guidance. Let's start by discussing what you're experiencing in more detail.`;

    await db
      .insert(consultationMessages)
      .values({
        consultationId: newConsultation[0].id,
        senderId: 'ai',
        senderType: 'ai',
        message: welcomeMessage,
        messageType: 'text'
      });

    // Update provider consultation count
    await db
      .update(aiProviders)
      .set({
        totalConsultations: (provider[0].totalConsultations || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(aiProviders.id, aiProviderId));

    return NextResponse.json({
      consultation: newConsultation[0],
      provider: provider[0],
      welcomeMessage
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating AI consultation:', error);
    return NextResponse.json(
      { error: 'Failed to create AI consultation' },
      { status: 500 }
    );
  }
}