import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { healthcareProviders, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

interface RouteParams {
  id: string;
}

// Validation schema for verification
const verificationSchema = z.object({
  verificationStatus: z.enum(['pending', 'verified', 'rejected']),
  adminId: z.string().min(1, 'Admin ID is required'),
});

// POST /api/providers/[id]/verify - Verify or unverify a healthcare provider (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const providerId = (await params).id;
    const body = await request.json();

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Validate verification data
    const validatedData = verificationSchema.parse(body);

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

    // Update provider verification status
    const updatedProvider = await db
      .update(healthcareProviders)
      .set({
        verificationStatus: validatedData.verificationStatus,
        isActive: validatedData.verificationStatus === 'verified', // Auto-enable availability when verified
        verifiedAt: validatedData.verificationStatus === 'verified' ? new Date() : null,
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
      verificationStatus: updatedProvider[0].verificationStatus,
      isActive: updatedProvider[0].isActive,
      verifiedAt: updatedProvider[0].verifiedAt,
      updatedAt: updatedProvider[0].updatedAt,
    };

    const action = validatedData.verificationStatus;
    
    return NextResponse.json({
      success: true,
      message: `Provider ${action} successfully`,
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

    console.error('Error verifying provider:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify provider' },
      { status: 500 }
    );
  }
}

// GET /api/providers/[id]/verify - Get verification status and history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const providerId = (await params).id;

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Get provider verification details
    const provider = await db
      .select({
        id: healthcareProviders.id,
        userId: healthcareProviders.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        licenseNumber: healthcareProviders.licenseNumber,
        specialty: healthcareProviders.specialty,
        subSpecialty: healthcareProviders.subSpecialty,
        verificationStatus: healthcareProviders.verificationStatus,
        verifiedAt: healthcareProviders.verifiedAt,
        createdAt: healthcareProviders.createdAt,
        updatedAt: healthcareProviders.updatedAt,
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

    return NextResponse.json({
      success: true,
      data: provider[0],
    });
  } catch (error) {
    console.error('Error fetching provider verification status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch verification status' },
      { status: 500 }
    );
  }
}