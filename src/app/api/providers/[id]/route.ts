import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { healthcareProviders, telemedicineAppointments, users } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { z } from 'zod';

interface RouteParams {
  id: string;
}

// Validation schema for provider updates
const providerUpdateSchema = z.object({
  specialty: z.string().min(1).optional(),
  subSpecialty: z.string().optional(),
  yearsOfExperience: z.number().min(0).optional(),
  education: z.string().min(1).optional(),
  bio: z.string().optional(),
  consultationFee: z.string().optional(), // Store as string in database
  languages: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/providers/[id] - Get specific provider details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id: providerId } = await params;

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Get provider details with user information
    const provider = await db
      .select({
        // Healthcare provider details
        id: healthcareProviders.id,
        userId: healthcareProviders.userId,
        licenseNumber: healthcareProviders.licenseNumber,
        specialty: healthcareProviders.specialty,
        subSpecialty: healthcareProviders.subSpecialty,
        yearsOfExperience: healthcareProviders.yearsOfExperience,
        education: healthcareProviders.education,
        bio: healthcareProviders.bio,
        consultationFee: healthcareProviders.consultationFee,
        languages: healthcareProviders.languages,
        certifications: healthcareProviders.certifications,
        verificationStatus: healthcareProviders.verificationStatus,
        verifiedAt: healthcareProviders.verifiedAt,
        isActive: healthcareProviders.isActive,
        rating: healthcareProviders.rating,
        totalReviews: healthcareProviders.totalReviews,
        createdAt: healthcareProviders.createdAt,
        updatedAt: healthcareProviders.updatedAt,
        // User details
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(healthcareProviders)
      .leftJoin(users, eq(healthcareProviders.userId, users.id))
      .where(eq(healthcareProviders.id, providerId))
      .limit(1)
      .execute();

    if (provider.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Note: providerSpecialties is a reference table, not linked to specific providers
    const specialties: {
      name: string;
      category: string;
    }[] = [];

    // Get appointment statistics
    const appointmentStats = await db
      .select({ count: count() })
      .from(telemedicineAppointments)
      .where(
        and(
          eq(telemedicineAppointments.providerId, providerId),
          eq(telemedicineAppointments.status, 'completed')
        )
      )
      .execute();

    // Return sanitized provider data with additional details
    const sanitizedProvider = {
      id: provider[0].id,
      firstName: provider[0].firstName,
      lastName: provider[0].lastName,
      email: provider[0].email,
      specialty: provider[0].specialty,
      subSpecialty: provider[0].subSpecialty,
      yearsOfExperience: provider[0].yearsOfExperience,
      education: provider[0].education,
      bio: provider[0].bio,
      consultationFee: provider[0].consultationFee,
      languages: provider[0].languages,
      certifications: provider[0].certifications,
      verificationStatus: provider[0].verificationStatus,
      isVerified: provider[0].verificationStatus === 'verified',
      isActive: provider[0].isActive,
      rating: provider[0].rating,
      totalReviews: provider[0].totalReviews,
      totalConsultations: appointmentStats[0]?.count || 0,
      specialties: specialties.map(s => ({
        name: s.name,
        category: s.category,
      })),
      createdAt: provider[0].createdAt,
      updatedAt: provider[0].updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: sanitizedProvider,
    });
  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch provider' },
      { status: 500 }
    );
  }
}

// PUT /api/providers/[id] - Update specific provider
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id: providerId } = await params;
    const body = await request.json();

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Validate update data
    const validatedData = providerUpdateSchema.parse(body);

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

    // Note: providerSpecialties is a reference table, specialty is stored in healthcareProviders.specialty

    // Return sanitized provider data
    const sanitizedProvider = {
      id: updatedProvider[0].id,
      specialty: updatedProvider[0].specialty,
      subSpecialty: updatedProvider[0].subSpecialty,
      yearsOfExperience: updatedProvider[0].yearsOfExperience,
      education: updatedProvider[0].education,
      bio: updatedProvider[0].bio,
      consultationFee: updatedProvider[0].consultationFee,
      languages: updatedProvider[0].languages,
      certifications: updatedProvider[0].certifications,
      verificationStatus: updatedProvider[0].verificationStatus,
      isActive: updatedProvider[0].isActive,
      rating: updatedProvider[0].rating,
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

// DELETE /api/providers/[id] - Delete provider (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id: providerId } = await params;

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

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

    // Check for active appointments
    const activeAppointments = await db
      .select({ count: count() })
      .from(telemedicineAppointments)
      .where(
        and(
          eq(telemedicineAppointments.providerId, providerId),
          eq(telemedicineAppointments.status, 'scheduled')
        )
      )
      .execute();

    if (activeAppointments[0]?.count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete provider with active appointments. Please cancel or complete all appointments first.',
        },
        { status: 409 }
      );
    }

    // Note: providerSpecialties is a reference table, no provider-specific records to delete

    // Delete provider
    await db
      .delete(healthcareProviders)
      .where(eq(healthcareProviders.id, providerId))
      .execute();

    return NextResponse.json({
      success: true,
      message: 'Provider deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete provider' },
      { status: 500 }
    );
  }
}