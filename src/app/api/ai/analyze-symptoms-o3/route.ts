import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { symptoms, duration, severity, additionalInfo } = await request.json();

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return NextResponse.json({ error: 'Symptoms are required' }, { status: 400 });
    }

    // Build the prompt for OpenAI O3
    const prompt = buildO3AnalysisPrompt(symptoms, duration, severity, additionalInfo);

    // Call OpenAI O3 model
    const completion = await openai.chat.completions.create({
      model: "o3-mini", // Using O3 mini for basic checks
      messages: [
        {
          role: "system",
          content: "You are a medical AI assistant specialized in basic symptom analysis. Provide structured, helpful analysis while emphasizing the importance of professional medical consultation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 1500,
    });

    const analysisText = completion.choices[0]?.message?.content;

    if (!analysisText) {
      throw new Error('No analysis generated');
    }

    // Parse the structured response
    const analysis = parseO3Response(analysisText);

    return NextResponse.json({
      analysis,
      model: 'OpenAI O3',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in O3 symptom analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze symptoms with OpenAI O3' },
      { status: 500 }
    );
  }
}

function buildO3AnalysisPrompt(symptoms: string[], duration?: string, severity?: string, additionalInfo?: string): string {
  return `
Please analyze the following symptoms for a basic health check:

SYMPTOMS: ${symptoms.join(', ')}
${duration ? `DURATION: ${duration}` : ''}
${severity ? `SEVERITY: ${severity}` : ''}
${additionalInfo ? `ADDITIONAL INFO: ${additionalInfo}` : ''}

Please provide a structured analysis in the following format:

URGENCY_LEVEL: [emergency/high/medium/low]

ANALYSIS:
[Your detailed analysis of the symptoms, potential causes, and general assessment]

POSSIBLE_CONDITIONS:
- [Condition 1]
- [Condition 2]
- [Condition 3]

RECOMMENDATIONS:
- [Recommendation 1]
- [Recommendation 2]
- [Recommendation 3]

DISCLAIMER:
[Important medical disclaimer about seeking professional care]

Focus on:
1. Basic symptom assessment
2. General wellness recommendations
3. When to seek medical attention
4. Lifestyle factors that might help

Remember this is a basic check, not a comprehensive diagnosis.
`;
}

function parseO3Response(response: string) {
  const lines = response.split('\n');
  let urgencyLevel = 'medium';
  let analysis = '';
  let possibleConditions: string[] = [];
  let recommendations: string[] = [];
  let disclaimer = '';

  let currentSection = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('URGENCY_LEVEL:')) {
      urgencyLevel = trimmedLine.replace('URGENCY_LEVEL:', '').trim().toLowerCase();
    } else if (trimmedLine === 'ANALYSIS:') {
      currentSection = 'analysis';
    } else if (trimmedLine === 'POSSIBLE_CONDITIONS:') {
      currentSection = 'conditions';
    } else if (trimmedLine === 'RECOMMENDATIONS:') {
      currentSection = 'recommendations';
    } else if (trimmedLine === 'DISCLAIMER:') {
      currentSection = 'disclaimer';
    } else if (trimmedLine) {
      switch (currentSection) {
        case 'analysis':
          analysis += trimmedLine + ' ';
          break;
        case 'conditions':
          if (trimmedLine.startsWith('-')) {
            possibleConditions.push(trimmedLine.substring(1).trim());
          }
          break;
        case 'recommendations':
          if (trimmedLine.startsWith('-')) {
            recommendations.push(trimmedLine.substring(1).trim());
          }
          break;
        case 'disclaimer':
          disclaimer += trimmedLine + ' ';
          break;
      }
    }
  }

  // Fallback values if parsing fails
  if (!analysis) {
    analysis = 'Basic symptom analysis completed. Please consult with a healthcare professional for proper evaluation.';
  }
  
  if (possibleConditions.length === 0) {
    possibleConditions = ['Various conditions could cause these symptoms', 'Professional evaluation needed for accurate diagnosis'];
  }
  
  if (recommendations.length === 0) {
    recommendations = ['Monitor symptoms closely', 'Stay hydrated and rest', 'Consult healthcare provider if symptoms persist'];
  }
  
  if (!disclaimer) {
    disclaimer = 'This is a basic AI analysis and should not replace professional medical advice. Please consult with a qualified healthcare provider for proper diagnosis and treatment.';
  }

  return {
    urgencyLevel: urgencyLevel || 'medium',
    analysis: analysis.trim(),
    possibleConditions,
    recommendations,
    disclaimer: disclaimer.trim()
  };
}