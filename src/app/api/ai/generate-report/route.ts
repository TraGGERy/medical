import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { geminiHealthService } from '@/lib/services/geminiService';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { symptoms } = await request.json();

    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length === 0) {
      return NextResponse.json(
        { error: 'Symptoms are required for report generation' },
        { status: 400 }
      );
    }

    // Generate health report using Gemini AI
    const report = await geminiHealthService.generateHealthReport(symptoms);

    return NextResponse.json(report);

  } catch (error) {
    console.error('Error generating health report:', error);
    return NextResponse.json(
      { error: 'Failed to generate health report. Please try again.' },
      { status: 500 }
    );
  }
}