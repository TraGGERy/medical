import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { doctors } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    // Check if doctors already exist
    const existingDoctors = await db.select().from(doctors).limit(1);
    
    if (existingDoctors.length > 0) {
      return NextResponse.json(
        { message: 'Doctors already seeded' },
        { status: 200 }
      );
    }

    // Seed initial doctors
    const initialDoctors = [
      {
        name: 'Dr. Michael Thompson',
        gender: 'male' as const,
        specialization: 'Metabolic Health (Weight Loss)',
        avatar: '/avatars/doctor-male.svg',
        bio: 'Dr. Thompson specializes in GLP-1 therapy and metabolic transformation. He has helped thousands of patients achieve sustainable weight loss through evidence-based protocols.',
        isActive: true,
      },
      {
        name: 'Dr. Sarah Williams',
        gender: 'female' as const,
        specialization: 'Women\'s Wellness & Hormonal Health',
        avatar: '/avatars/doctor-female.svg',
        bio: 'Dr. Williams is dedicated to women\'s comprehensive wellness, focusing on hormonal balance, nutrition, and longevity.',
        isActive: true,
      },
      {
        name: 'Dr. James Rodriguez',
        gender: 'male' as const,
        specialization: 'Men\'s Sexual Health & Performance',
        avatar: '/avatars/doctor-male-2.svg',
        bio: 'Dr. Rodriguez provides expert guidance on testosterone optimization and sexual wellness for men.',
        isActive: true,
      },
      {
        name: 'Dr. Elena Vance',
        gender: 'female' as const,
        specialization: 'Preventive Nutrition & Obesity Medicine',
        avatar: '/avatars/doctor-female-2.svg',
        bio: 'Dr. Vance focuses on the intersection of nutrition and chronic disease prevention.',
        isActive: true,
      },
    ];

    const seededDoctors = await db
      .insert(doctors)
      .values(initialDoctors)
      .returning();

    return NextResponse.json(
      { 
        message: 'Doctors seeded successfully',
        doctors: seededDoctors
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error seeding doctors:', error);
    return NextResponse.json(
      { error: 'Failed to seed doctors' },
      { status: 500 }
    );
  }
}