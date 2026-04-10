import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { doctors } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allDoctors = await db
      .select()
      .from(doctors)
      .where(eq(doctors.isActive, true))
      .orderBy(doctors.name);

    return NextResponse.json({ doctors: allDoctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, gender, specialization, avatar, bio } = body;

    if (!name || !gender || !specialization) {
      return NextResponse.json(
        { error: 'Name, gender, and specialization are required' },
        { status: 400 }
      );
    }

    const newDoctor = await db
      .insert(doctors)
      .values({
        name,
        gender,
        specialization,
        avatar,
        bio,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ doctor: newDoctor[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating doctor:', error);
    return NextResponse.json(
      { error: 'Failed to create doctor' },
      { status: 500 }
    );
  }
}