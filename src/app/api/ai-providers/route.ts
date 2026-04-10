import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiProviders } from '@/lib/db/schema';

export async function GET() {
  try {
    const providers = await db.select().from(aiProviders);
    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Error fetching AI providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI providers' },
      { status: 500 }
    );
  }
}
