import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { conversations, doctors, chatMessages } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userConversations = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        status: conversations.status,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        doctor: {
          id: doctors.id,
          name: doctors.name,
          gender: doctors.gender,
          specialization: doctors.specialization,
          avatar: doctors.avatar,
        },
      })
      .from(conversations)
      .leftJoin(doctors, eq(conversations.doctorId, doctors.id))
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.lastMessageAt));

    return NextResponse.json({ conversations: userConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
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
    const { doctorId, title } = body;

    if (!doctorId || !title) {
      return NextResponse.json(
        { error: 'Doctor ID and title are required' },
        { status: 400 }
      );
    }

    // Check if doctor exists and is active
    const doctor = await db
      .select()
      .from(doctors)
      .where(and(eq(doctors.id, doctorId), eq(doctors.isActive, true)))
      .limit(1);

    if (doctor.length === 0) {
      return NextResponse.json(
        { error: 'Doctor not found or inactive' },
        { status: 404 }
      );
    }

    const newConversation = await db
      .insert(conversations)
      .values({
        userId,
        doctorId,
        title,
        status: 'active',
      })
      .returning();

    return NextResponse.json({ conversation: newConversation[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}