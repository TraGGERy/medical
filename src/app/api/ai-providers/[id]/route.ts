import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiProviders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await params;
    const provider = await db
      .select()
      .from(aiProviders)
      .where(eq(aiProviders.id, id))
      .limit(1);

    if (provider.length === 0) {
      return NextResponse.json(
        { error: 'AI provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(provider[0]);
  } catch (error) {
    console.error('Error fetching AI provider:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI provider' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updatedProvider = await db
      .update(aiProviders)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(aiProviders.id, id))
      .returning();

    if (updatedProvider.length === 0) {
      return NextResponse.json(
        { error: 'AI provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedProvider[0]);
  } catch (error) {
    console.error('Error updating AI provider:', error);
    return NextResponse.json(
      { error: 'Failed to update AI provider' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await params;
    const deletedProvider = await db
      .delete(aiProviders)
      .where(eq(aiProviders.id, id))
      .returning();

    if (deletedProvider.length === 0) {
      return NextResponse.json(
        { error: 'AI provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'AI provider deleted successfully' });
  } catch (error) {
    console.error('Error deleting AI provider:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI provider' },
      { status: 500 }
    );
  }
}