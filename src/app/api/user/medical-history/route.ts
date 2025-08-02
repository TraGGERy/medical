import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userMedicalHistory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const medicalHistory = await db
      .select()
      .from(userMedicalHistory)
      .where(eq(userMedicalHistory.userId, userId))
      .limit(1);

    return NextResponse.json({
      medicalHistory: medicalHistory[0] || null
    });
  } catch (error) {
    console.error('Error fetching medical history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medical history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Check if medical history exists
    const existingHistory = await db
      .select()
      .from(userMedicalHistory)
      .where(eq(userMedicalHistory.userId, userId))
      .limit(1);

    const medicalData = {
      userId: userId,
      allergies: data.allergies || [],
      medications: data.medications || [],
      chronicConditions: data.chronicConditions || [],
      familyHistory: data.familyHistory || [],
      emergencyContact: data.emergencyContact || {},
      bloodType: data.bloodType || null,
      height: data.height || null,
      weight: data.weight || null,
      dateOfBirth: data.dateOfBirth || null,
      gender: data.gender || null,
      updatedAt: new Date()
    };

    if (existingHistory.length > 0) {
      // Update existing record
      await db
        .update(userMedicalHistory)
        .set(medicalData)
        .where(eq(userMedicalHistory.userId, userId));
    } else {
      // Create new record
      await db
        .insert(userMedicalHistory)
        .values({
          ...medicalData,
          createdAt: new Date()
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving medical history:', error);
    return NextResponse.json(
      { error: 'Failed to save medical history' },
      { status: 500 }
    );
  }
}