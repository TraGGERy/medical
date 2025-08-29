import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { healthcareProviders, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for provider registration
const providerRegistrationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  specialty: z.string().min(1, 'Specialty is required'),
  subSpecialty: z.string().optional(),
  yearsOfExperience: z.number().min(0, 'Years of experience must be non-negative'),
  education: z.string().min(1, 'Education is required'),
  bio: z.string().optional(),
  consultationFee: z.string().min(1, 'Consultation fee is required'),
  languages: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
});

const providerUpdateSchema = providerRegistrationSchema.partial();

// GET /api/providers - Get all providers or search providers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const verified = searchParams.get('verified');
    const available = searchParams.get('available');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Apply filters
    const conditions = [];
    if (specialty) {
      conditions.push(eq(healthcareProviders.specialty, specialty));
    }
    if (verified === 'true') {
      conditions.push(eq(healthcareProviders.verificationStatus, 'verified'));
    }
    if (available === 'true') {
      conditions.push(eq(healthcareProviders.isActive, true));
    }

    const baseQuery = db
      .select({
        id: healthcareProviders.id,
        userId: healthcareProviders.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        licenseNumber: healthcareProviders.licenseNumber,
        specialty: healthcareProviders.specialty,
        subSpecialty: healthcareProviders.subSpecialty,
        yearsOfExperience: healthcareProviders.yearsOfExperience,
        bio: healthcareProviders.bio,
        consultationFee: healthcareProviders.consultationFee,
        languages: healthcareProviders.languages,
        certifications: healthcareProviders.certifications,
        verificationStatus: healthcareProviders.verificationStatus,
        isActive: healthcareProviders.isActive,
        rating: healthcareProviders.rating,
        totalReviews: healthcareProviders.totalReviews,
        createdAt: healthcareProviders.createdAt,
      })
      .from(healthcareProviders)
      .leftJoin(users, eq(healthcareProviders.userId, users.id));

    const providers = await (conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery)
      .limit(limit)
      .offset(offset)
      .execute();

    // Remove sensitive information
    const sanitizedProviders = providers.map(provider => ({
      id: provider.id,
      firstName: provider.firstName,
      lastName: provider.lastName,
      specialty: provider.specialty,
      subSpecialty: provider.subSpecialty,
      yearsOfExperience: provider.yearsOfExperience,
      bio: provider.bio,
      consultationFee: provider.consultationFee,
      languages: provider.languages,
      certifications: provider.certifications,
      verificationStatus: provider.verificationStatus,
      isActive: provider.isActive,
      rating: provider.rating,
      totalReviews: provider.totalReviews,
      createdAt: provider.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: sanitizedProviders,
      pagination: {
        limit,
        offset,
        total: providers.length,
      },
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

// POST /api/providers - Register a new healthcare provider
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = providerRegistrationSchema.parse(body);

    // Check if provider with userId already exists
    const existingProvider = await db
      .select()
      .from(healthcareProviders)
      .where(eq(healthcareProviders.userId, validatedData.userId))
      .limit(1)
      .execute();

    if (existingProvider.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Provider with this user ID already exists' },
        { status: 409 }
      );
    }

    // Check if license number already exists
    const existingLicense = await db
      .select()
      .from(healthcareProviders)
      .where(eq(healthcareProviders.licenseNumber, validatedData.licenseNumber))
      .limit(1)
      .execute();

    if (existingLicense.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Provider with this license number already exists' },
        { status: 409 }
      );
    }

    // Create new provider
    const newProvider = await db
      .insert(healthcareProviders)
      .values({
        ...validatedData,
        verificationStatus: 'pending', // Requires manual verification
        isActive: false, // Initially unavailable until verified
        rating: '0.00',
        totalReviews: 0,
      })
      .returning()
      .execute();

    // Note: providerSpecialties is a reference table for specialty names,
    // not a junction table. The specialty is already stored in healthcareProviders.specialty

    // Return sanitized provider data
    const sanitizedProvider = {
      id: newProvider[0].id,
      userId: newProvider[0].userId,
      licenseNumber: newProvider[0].licenseNumber,
      specialty: newProvider[0].specialty,
      subSpecialty: newProvider[0].subSpecialty,
      verificationStatus: newProvider[0].verificationStatus,
      isActive: newProvider[0].isActive,
      createdAt: newProvider[0].createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Provider registered successfully. Verification pending.',
        data: sanitizedProvider,
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

    console.error('Error registering provider:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register provider' },
      { status: 500 }
    );
  }
}

// PUT /api/providers - Update provider information (requires provider authentication)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, ...updateData } = body;

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Validate update data
    const validatedData = providerUpdateSchema.parse(updateData);

    // Check if provider exists
    const existingProvider = await db
      .select()
      .from(healthcareProviders)
      .where(eq(healthcareProviders.id, providerId))
      .limit(1)
      .execute();

    if (existingProvider.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Update provider
    const updatedProvider = await db
      .update(healthcareProviders)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(healthcareProviders.id, providerId))
      .returning()
      .execute();

    // Return sanitized provider data
    const sanitizedProvider = {
      id: updatedProvider[0].id,
      userId: updatedProvider[0].userId,
      licenseNumber: updatedProvider[0].licenseNumber,
      specialty: updatedProvider[0].specialty,
      subSpecialty: updatedProvider[0].subSpecialty,
      yearsOfExperience: updatedProvider[0].yearsOfExperience,
      bio: updatedProvider[0].bio,
      consultationFee: updatedProvider[0].consultationFee,
      languages: updatedProvider[0].languages,
      certifications: updatedProvider[0].certifications,
      verificationStatus: updatedProvider[0].verificationStatus,
      isActive: updatedProvider[0].isActive,
      updatedAt: updatedProvider[0].updatedAt,
    };

    return NextResponse.json({
      success: true,
      message: 'Provider updated successfully',
      data: sanitizedProvider,
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

    console.error('Error updating provider:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update provider' },
      { status: 500 }
    );
  }
}