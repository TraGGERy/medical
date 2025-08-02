import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { geminiHealthService, HealthAnalysisRequest } from '@/lib/services/geminiService';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: HealthAnalysisRequest = await request.json();

    // Validate required fields
    if (!body.symptoms || body.symptoms.length === 0) {
      return NextResponse.json(
        { error: 'Symptoms are required for analysis' },
        { status: 400 }
      );
    }

    // Analyze symptoms using Gemini AI
    const analysis = await geminiHealthService.analyzeSymptoms(body);

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error in symptom analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze symptoms. Please try again.' },
      { status: 500 }
    );
  }
}