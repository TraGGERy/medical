import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { aiConsultations, aiProviders } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔍 Fetching last active consultation for user:', userId);

    // Fetch the most recent active consultation for this user
    const lastActiveConsultation = await db
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
        createdAt: aiConsultations.createdAt,
        updatedAt: aiConsultations.updatedAt,
        aiProvider: {
          id: aiProviders.id,
          name: aiProviders.name,
          specialty: aiProviders.specialty,
          subSpecialty: aiProviders.subSpecialty,
          profileImageUrl: aiProviders.profileImageUrl,
          yearsOfExperience: aiProviders.yearsOfExperience,
          rating: aiProviders.rating,
          consultationFee: aiProviders.consultationFee,
          currency: aiProviders.currency
        }
      })
      .from(aiConsultations)
      .leftJoin(aiProviders, eq(aiConsultations.aiProviderId, aiProviders.id))
      .where(
        and(
          eq(aiConsultations.patientId, userId),
          eq(aiConsultations.status, 'active')
        )
      )
      .orderBy(desc(aiConsultations.updatedAt))
      .limit(1);

    console.log('📊 Last active consultation query result:', {
      found: lastActiveConsultation.length > 0,
      consultationId: lastActiveConsultation[0]?.id || 'none',
      status: lastActiveConsultation[0]?.status || 'none'
    });

    if (lastActiveConsultation.length === 0) {
      return NextResponse.json(
        { 
          consultation: null,
          message: 'No active consultation found'
        },
        { status: 200 }
      );
    }

    const consultation = lastActiveConsultation[0];
    
    console.log('✅ Found last active consultation:', {
      id: consultation.id,
      aiProvider: consultation.aiProvider?.name,
      reasonForVisit: consultation.reasonForVisit,
      createdAt: consultation.createdAt
    });

    return NextResponse.json({
      consultation: {
        id: consultation.id,
        patientId: consultation.patientId,
        aiProviderId: consultation.aiProviderId,
        sessionId: consultation.sessionId,
        status: consultation.status,
        reasonForVisit: consultation.reasonForVisit,
        symptoms: consultation.symptoms,
        urgencyLevel: consultation.urgencyLevel,
        patientAge: consultation.patientAge,
        patientGender: consultation.patientGender,
        medicalHistory: consultation.medicalHistory,
        currentMedications: consultation.currentMedications,
        allergies: consultation.allergies,
        createdAt: consultation.createdAt,
        updatedAt: consultation.updatedAt,
        aiProvider: consultation.aiProvider
      }
    });

  } catch (error: unknown) {
    console.error('❌ Error fetching last active consultation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch last active consultation' },
      { status: 500 }
    );
  }
}