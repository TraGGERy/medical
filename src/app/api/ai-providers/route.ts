import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiProviders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const isActive = searchParams.get('isActive');
    const isAvailable = searchParams.get('isAvailable');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where conditions
    const conditions = [];
    
    if (specialty) {
      conditions.push(eq(aiProviders.specialty, specialty));
    }
    
    if (isActive === 'true') {
      conditions.push(eq(aiProviders.isActive, true));
    }
    
    if (isAvailable === 'true') {
      conditions.push(eq(aiProviders.isAvailable, true));
    }

    // Query AI providers
    const baseQuery = db
      .select({
        id: aiProviders.id,
        name: aiProviders.name,
        specialty: aiProviders.specialty,
        subSpecialty: aiProviders.subSpecialty,
        bio: aiProviders.bio,
        profileImageUrl: aiProviders.profileImageUrl,
        yearsOfExperience: aiProviders.yearsOfExperience,
        education: aiProviders.education,
        certifications: aiProviders.certifications,
        languages: aiProviders.languages,
        consultationFee: aiProviders.consultationFee,
        currency: aiProviders.currency,
        rating: aiProviders.rating,
        totalConsultations: aiProviders.totalConsultations,
        availability: aiProviders.availability,
        responseTimeSeconds: aiProviders.responseTimeSeconds,
        aiModel: aiProviders.aiModel,
        personalityTraits: aiProviders.personalityTraits,
        specializations: aiProviders.specializations,
        consultationStyle: aiProviders.consultationStyle,
        isActive: aiProviders.isActive,
        isAvailable: aiProviders.isAvailable,
        createdAt: aiProviders.createdAt,
        updatedAt: aiProviders.updatedAt
      })
      .from(aiProviders);

    const providers = await (conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery)
      .limit(limit)
      .offset(offset)
      .execute();

    return NextResponse.json({
      success: true,
      providers,
      pagination: {
        limit,
        offset,
        total: providers.length,
      },
    });
  } catch (error) {
    console.error('Error fetching AI providers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AI providers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create new AI provider
    const newProvider = await db
      .insert(aiProviders)
      .values(body)
      .returning()
      .execute();

    return NextResponse.json(
      {
        success: true,
        message: 'AI provider created successfully.',
        provider: newProvider[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating AI provider:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create AI provider' },
      { status: 500 }
    );
  }
}