import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiConsultations, consultationMessages, aiProviders } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { automaticDiagnosticReportService } from '@/lib/services/automaticDiagnosticReportService';
import { agenticDiagnosticService } from '@/lib/services/agenticDiagnosticService';

interface RouteParams {
  id: string;
}

interface ReferralMetadata {
  referralNeeded?: boolean;
  recommendedSpecialty?: string;
  originalProvider?: string;
  suggestedProvider?: string;
  suggestedProviderName?: string;
  suggestedProviderSpecialty?: string;
  referralReason?: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify consultation belongs to user
    const consultation = await db
      .select()
      .from(aiConsultations)
      .where(
        and(
          eq(aiConsultations.id, id),
          eq(aiConsultations.patientId, userId)
        )
      )
      .limit(1);

    if (consultation.length === 0) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    // Get messages
    const messages = await db
      .select()
      .from(consultationMessages)
      .where(eq(consultationMessages.consultationId, id))
      .orderBy(desc(consultationMessages.createdAt))
      .limit(limit)
      .offset(offset);

    // Map database fields to frontend expected fields
    const mappedMessages = messages.map(msg => ({
      ...msg,
      content: msg.message, // Map message to content
      senderType: msg.senderType === 'ai' ? 'ai_provider' : 
                  msg.senderType === 'patient' ? 'user' : 
                  msg.senderType // Map ai to ai_provider and patient to user
    }));

    return NextResponse.json({
      messages: mappedMessages.reverse(), // Reverse to get chronological order
      pagination: {
        limit,
        offset,
        total: messages.length
      }
    });
  } catch (error: unknown) {
    console.error('Error fetching consultation messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consultation messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, messageType = 'text' } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Verify consultation belongs to user and is active
    const consultation = await db
      .select({
        consultation: aiConsultations,
        aiProvider: aiProviders
      })
      .from(aiConsultations)
      .leftJoin(aiProviders, eq(aiConsultations.aiProviderId, aiProviders.id))
      .where(
        and(
          eq(aiConsultations.id, id),
          eq(aiConsultations.patientId, userId),
          eq(aiConsultations.status, 'active')
        )
      )
      .limit(1);

    if (consultation.length === 0) {
      return NextResponse.json(
        { error: 'Active consultation not found' },
        { status: 404 }
      );
    }

    const { consultation: consultationData, aiProvider } = consultation[0];

    // Save user message
    const userMessage = await db
      .insert(consultationMessages)
      .values({
        consultationId: id,
        senderId: userId,
        senderType: 'patient',
        message: content,
        messageType
      })
      .returning();

    // Update consultation message count for user message
    await db
      .update(aiConsultations)
      .set({
        totalMessages: (consultationData.totalMessages || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(aiConsultations.id, id));

    // Generate AI response asynchronously (don't await)
    generateAIResponseAsync(
      id,
      {
        id: aiProvider!.id,
        name: aiProvider!.name,
        specialty: aiProvider!.specialty,
        yearsOfExperience: aiProvider!.yearsOfExperience,
        personalityTraits: Array.isArray(aiProvider!.personalityTraits) ? aiProvider!.personalityTraits : [],
        consultationStyle: aiProvider!.consultationStyle,
        specializations: Array.isArray(aiProvider!.specializations) ? aiProvider!.specializations : []
      },
      {        aiProviderId: consultationData.aiProviderId,        patientId: consultationData.patientId,        reasonForVisit: consultationData.reasonForVisit,        patientAge: consultationData.patientAge ?? undefined,        patientGender: consultationData.patientGender ?? undefined,        symptoms: Array.isArray(consultationData.symptoms) ? consultationData.symptoms : [],        medicalHistory: Array.isArray(consultationData.medicalHistory) ? consultationData.medicalHistory : [],        currentMedications: Array.isArray(consultationData.currentMedications) ? consultationData.currentMedications : [],        allergies: Array.isArray(consultationData.allergies) ? consultationData.allergies : []      },
      content
    ).catch((error: unknown) => {
      console.error('Error generating AI response:', error);
    });

    // Map database fields to frontend expected fields
    const mappedUserMessage = {
      ...userMessage[0],
      content: userMessage[0].message,
      senderType: userMessage[0].senderType === 'patient' ? 'user' : userMessage[0].senderType
    };

    // Return immediately with just the user message
    return NextResponse.json({
      message: mappedUserMessage,
      aiResponsePending: true
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error sending consultation message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// Async function to generate AI response in background
async function generateAIResponseAsync(
  consultationId: string,
  aiProvider: {
    id: string;
    name: string;
    specialty: string;
    yearsOfExperience?: number;
    personalityTraits?: string[];
    consultationStyle?: string;
    specializations?: string[];
    aiModel?: string;
  },
  consultation: {
    aiProviderId: string;
    patientId: string;
    reasonForVisit: string;
    patientAge?: number;
    patientGender?: string;
    symptoms?: string[];
    medicalHistory?: string[];
    currentMedications?: string[];
    allergies?: string[];
  },
  userMessage: string
) {
  try {
    // Get conversation history for AI context
    const previousMessages = await db
      .select()
      .from(consultationMessages)
      .where(eq(consultationMessages.consultationId, consultationId))
      .orderBy(consultationMessages.createdAt)
      .limit(20); // Last 20 messages for context

    // Generate AI response with enhanced agentic capabilities
    const aiResponse = await generateAIResponse(
      aiProvider,
      consultation,
      previousMessages,
      userMessage,
      consultationId
    );

    // Check if AI response contains a referral trigger
    const referralMatch = aiResponse.message.match(/\[REFERRAL_NEEDED: ([^\]]+)\]/);
    let referralMetadata: ReferralMetadata = {};
    
    // Also check for mental health keywords that should trigger psychiatry referral
    const mentalHealthKeywords = [
      'depression', 'anxiety', 'suicidal', 'mental health', 'emotional distress',
      'panic attack', 'bipolar', 'ptsd', 'trauma', 'self-harm', 'suicide',
      'feeling hopeless', 'want to die', 'end it all', 'psychological'
    ];
    
    const containsMentalHealthContent = mentalHealthKeywords.some(keyword => 
      userMessage.toLowerCase().includes(keyword) || 
      aiResponse.message.toLowerCase().includes(keyword)
    );
    
    if (referralMatch) {
      const recommendedSpecialty = referralMatch[1];
      referralMetadata = {
        referralNeeded: true,
        recommendedSpecialty,
        originalProvider: consultation.aiProviderId,
        referralReason: 'Specialist expertise required'
      };
      
      // Try to find an available specialist
      const availableSpecialist = await findAvailableSpecialist(recommendedSpecialty);
      if (availableSpecialist) {
        referralMetadata.suggestedProvider = availableSpecialist.id;
        referralMetadata.suggestedProviderName = availableSpecialist.name;
        referralMetadata.suggestedProviderSpecialty = availableSpecialist.specialty;
      }
    } else if (containsMentalHealthContent && aiProvider?.specialty !== 'Psychiatry') {
      // Auto-trigger psychiatry referral for mental health content if not already with a psychiatrist
      const availableSpecialist = await findAvailableSpecialist('Psychiatry');
      if (availableSpecialist) {
        referralMetadata = {
          referralNeeded: true,
          recommendedSpecialty: 'Psychiatry',
          originalProvider: consultation.aiProviderId,
          suggestedProvider: availableSpecialist.id,
          suggestedProviderName: availableSpecialist.name,
          suggestedProviderSpecialty: availableSpecialist.specialty,
          referralReason: 'Mental health concerns detected'
        };
      }
    }

    // Save AI response
    const aiMessage = await db
      .insert(consultationMessages)
      .values({
        consultationId: consultationId,
        senderId: 'ai',
        senderType: 'ai',
        message: aiResponse.message,
        messageType: 'text',
        metadata: referralMetadata
      })
      .returning();

    // Update consultation message count for AI message
    const currentConsultation = await db
      .select()
      .from(aiConsultations)
      .where(eq(aiConsultations.id, consultationId))
      .limit(1);
    
    if (currentConsultation.length > 0) {
      await db
        .update(aiConsultations)
        .set({
          totalMessages: (currentConsultation[0].totalMessages || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(aiConsultations.id, consultationId));
    }

    // Check for conversation completion and trigger automatic diagnostic report
    try {
      // Get all messages for analysis
      const allMessages = await db
        .select({
          senderType: consultationMessages.senderType,
          content: consultationMessages.message,
          timestamp: consultationMessages.createdAt
        })
        .from(consultationMessages)
        .where(eq(consultationMessages.consultationId, consultationId))
        .orderBy(consultationMessages.createdAt);

      const shouldTriggerResult = await agenticDiagnosticService.shouldTriggerAutomaticDiagnostic(
        allMessages.map(msg => ({
          senderType: msg.senderType,
          content: msg.content,
          timestamp: msg.timestamp?.toISOString() || new Date().toISOString()
        })),
        {
          reasonForVisit: consultation.reasonForVisit,
          aiProviderSpecialty: aiProvider.specialty,
          patientAge: consultation.patientAge,
          patientGender: consultation.patientGender
        }
      );

      if (shouldTriggerResult.shouldTrigger) {
        console.log(`[Agentic Diagnostic] Triggering automatic report for consultation ${consultationId}`);
        
        // Notify user that report generation is starting
        await db.insert(consultationMessages).values({
          consultationId,
          senderId: aiProvider.id,
          senderType: 'ai',
          message: "🔄 **Generating Comprehensive Diagnostic Report**\n\nBased on our conversation, I have gathered sufficient information to provide you with a detailed diagnostic analysis. Please wait while I prepare your comprehensive report with recommendations and next steps.",
          messageType: 'text',
          metadata: { processingTime: 0 },
        });

        // Trigger automatic diagnostic report generation
        await automaticDiagnosticReportService.checkAndTriggerAutomaticReport({
          consultationId,
          userId: consultation.patientId,
          aiProviderId: aiProvider.id,
          aiProviderName: aiProvider.name,
          aiProviderSpecialty: aiProvider.specialty,
          reasonForVisit: consultation.reasonForVisit,
          patientAge: consultation.patientAge,
          patientGender: consultation.patientGender,
          messages: allMessages.map(msg => ({
            senderType: msg.senderType,
            content: msg.content,
            timestamp: msg.timestamp?.toISOString() || new Date().toISOString()
          }))
        });
      }
    } catch (error) {
      console.error('[Agentic Diagnostic] Error in automatic report generation:', error);
      // Don't throw error to avoid breaking the main conversation flow
    }

    console.log(`AI response generated for consultation ${consultationId}`);
  } catch (error: unknown) {
    console.error('Error in generateAIResponseAsync:', error);
  }
}

async function generateAIResponse(
  aiProvider: {
    id: string;
    name: string;
    specialty: string;
    yearsOfExperience?: number;
    personalityTraits?: string[];
    consultationStyle?: string;
    specializations?: string[];
    aiModel?: string;
  },
  consultation: {
    patientId: string;
    reasonForVisit: string;
    patientAge?: number;
    patientGender?: string;
    symptoms?: string[];
    medicalHistory?: string[];
    currentMedications?: string[];
    allergies?: string[];
  },
  messageHistory: Array<{
    senderType: string;
    message: string;
  }>,
  userMessage: string,
  consultationId: string
) {
  const startTime = Date.now();

  try {
    // Build conversation context
    const conversationHistory: Array<{
      role: 'assistant' | 'user';
      content: string;
    }> = messageHistory.map(msg => ({
      role: msg.senderType === 'ai' ? 'assistant' as const : 'user' as const,
      content: msg.message
    }));

    // Create system prompt based on AI provider persona
    const systemPrompt = `You are ${aiProvider.name}, a licensed ${aiProvider.specialty} specialist with ${aiProvider.yearsOfExperience} years of experience providing professional medical consultations.

Your personality traits: ${aiProvider.personalityTraits?.join(', ') || 'Professional, empathetic'}
Your consultation style: ${aiProvider.consultationStyle || 'Thorough and patient-centered'}
Your specializations: ${aiProvider.specializations?.join(', ') || 'General practice'}

Patient Information:
- Reason for visit: ${consultation.reasonForVisit}
- Age: ${consultation.patientAge || 'Not specified'}
- Gender: ${consultation.patientGender || 'Not specified'}
- Symptoms: ${consultation.symptoms ? JSON.stringify(consultation.symptoms) : 'Not specified'}
- Medical history: ${consultation.medicalHistory ? JSON.stringify(consultation.medicalHistory) : 'Not specified'}
- Current medications: ${consultation.currentMedications ? JSON.stringify(consultation.currentMedications) : 'None specified'}
- Allergies: ${consultation.allergies ? JSON.stringify(consultation.allergies) : 'None specified'}

PROFESSIONAL MEDICAL CONSULTATION FRAMEWORK:
You are operating within a licensed medical platform with proper specialist referral capabilities. Your role is to provide professional medical guidance and facilitate appropriate specialist referrals when needed.

IMPORTANT CONSULTATION METHODOLOGY:
You must follow a structured questioning approach to thoroughly understand the patient's situation before providing comprehensive feedback:

1. **Initial Assessment Phase**: Start by asking specific questions about their main symptoms:
   - When did the symptoms start?
   - How severe are they on a scale of 1-10?
   - What makes them better or worse?
   - Any associated symptoms?

2. **Detailed History Phase**: Based on their responses, ask follow-up questions:
   - Previous similar episodes?
   - Recent changes in lifestyle, diet, or stress?
   - Family history of similar conditions?
   - Recent travel or exposure to illness?

3. **Contextual Information Phase**: Gather relevant background:
   - Current stress levels or life changes?
   - Sleep patterns and quality?
   - Exercise habits and physical activity?
   - Dietary habits and recent changes?

4. **Comprehensive Assessment Phase**: Only after gathering sufficient information through questions, provide:
   - Your professional assessment
   - Possible causes or conditions
   - Recommended next steps
   - When to seek immediate care

AGENTIC CONVERSATION COMPLETION ANALYSIS:
As an intelligent AI provider, you must continuously assess whether the consultation has gathered sufficient information for a comprehensive diagnostic analysis. After each response, evaluate:

- INFORMATION COMPLETENESS: Have you gathered adequate details about symptoms, duration, severity, triggers, and impact?
- DIAGNOSTIC CLARITY: Do you have enough information to provide meaningful insights and recommendations?
- PATIENT SATISFACTION: Has the patient's primary concerns been thoroughly addressed?
- NATURAL CONCLUSION: Does the conversation feel complete from a medical consultation perspective?

When you determine the consultation is complete and you have sufficient information for a comprehensive diagnostic report, include this EXACT phrase at the end of your response: [CONSULTATION_COMPLETE]

This will trigger an automatic generation of a detailed diagnostic report for the patient. Only use this when:
- You have gathered comprehensive symptom information
- You understand the patient's medical context
- You can provide meaningful diagnostic insights
- The conversation has reached a natural conclusion
- The patient's immediate concerns have been addressed

CRITICAL SPECIALTY DETECTION AND REFERRAL PROTOCOL:
As a ${aiProvider.specialty} specialist, you must recognize when a patient's condition falls outside your area of expertise. This platform has qualified specialists available for immediate referral. If you identify symptoms or conditions that require a different specialty, you MUST:

1. **Acknowledge your limitation**: "Based on what you&apos;re describing, this appears to be outside my specialty as a ${aiProvider.specialty} specialist."

2. **Recommend appropriate specialist**: Suggest the most suitable specialist from our available team

3. **Trigger referral**: Include this EXACT phrase in your response: "[REFERRAL_NEEDED: SPECIALTY_NAME]" where SPECIALTY_NAME is the recommended specialty

4. **Provide context**: Briefly explain why this specialist would be more appropriate

SPECIAL MENTAL HEALTH CONSULTATION PROTOCOL:
For mental health concerns, emotional distress, or psychological symptoms:
- You are qualified to provide initial assessment and support
- Mental health concerns are legitimate medical conditions requiring professional attention
- If the patient expresses mental health symptoms (depression, anxiety, suicidal thoughts, emotional distress), provide supportive professional guidance
- For specialized mental health care, refer to our Psychiatry specialist: "[REFERRAL_NEEDED: Psychiatry]"
- NEVER dismiss mental health concerns or provide generic crisis responses
- Treat mental health with the same professionalism as physical health conditions

Specialty Detection Guidelines:
- Psychiatry: Mental health, depression, anxiety, behavioral issues, emotional distress, suicidal ideation, psychological symptoms
- Gynecology: Menstrual issues, pregnancy concerns, pelvic pain, reproductive health
- Dermatology: Skin conditions, rashes, moles, acne, hair/nail problems
- Orthopedics: Bone/joint pain, fractures, sports injuries, mobility issues
- Neurology: Headaches, seizures, memory issues, neurological symptoms
- Gastroenterology: Digestive issues, stomach pain, bowel problems
- Endocrinology: Diabetes, thyroid issues, hormonal problems
- Ophthalmology: Eye problems, vision issues
- ENT: Ear, nose, throat problems
- Urology: Urinary issues, kidney problems
- Internal Medicine: General medical concerns, chronic conditions, preventive care

DO NOT provide final diagnoses or comprehensive treatment plans until you have asked sufficient questions to understand the complete picture. Focus on one question at a time, and build upon their answers. Be empathetic, professional, and thorough in your questioning.

This is a professional medical consultation platform. Always maintain medical professionalism and provide appropriate specialist referrals when conditions fall outside your expertise.`;

    const completion = await openai.chat.completions.create({
      model: aiProvider.aiModel || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ] as Array<{ role: 'system' | 'assistant' | 'user'; content: string }>,
      max_tokens: 500,
      temperature: 0.7,
      // Additional parameters to ensure medical consultation context
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
      // Ensure the model understands this is a professional medical context
      user: `medical_consultation_${Date.now()}`
    });

    const aiMessage = completion.choices[0]?.message?.content || 'I apologize, but I\'m having trouble processing your message right now. Could you please try again?';
    
    const processingTime = Date.now() - startTime;

    // Get current consultation data to access totalMessages
    const currentConsultation = await db
      .select()
      .from(aiConsultations)
      .where(eq(aiConsultations.id, consultationId))
      .limit(1);
    
    // Generate recommendations based on the conversation
    const recommendations = await generateRecommendations(
      aiProvider, 
      { totalMessages: currentConsultation[0]?.totalMessages || 0 }, 
      userMessage, 
      aiMessage
    );

    return {
      message: aiMessage,
      confidence: 0.85, // This could be calculated based on various factors
      processingTime,
      recommendations
    };
  } catch (error: unknown) {
    console.error('Error generating AI response:', error);
    return {
      message: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.',
      confidence: 0,
      processingTime: Date.now() - startTime,
      recommendations: []
    };
  }
}

async function generateRecommendations(
  aiProvider: {
    specialty: string;
  },
  consultation: {
    totalMessages?: number;
  },
  userMessage: string,
  aiResponse: string
): Promise<Array<{
  type: string;
  message: string;
  priority: string;
}>> {
  // This is a simplified recommendation system
  // In a real implementation, this would be more sophisticated
  const recommendations = [];

  // Check for urgent keywords
  const urgentKeywords = ['chest pain', 'difficulty breathing', 'severe pain', 'bleeding', 'unconscious'];
  if (urgentKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
    recommendations.push({
      type: 'urgent_care',
      message: 'Based on your symptoms, I recommend seeking immediate medical attention.',
      priority: 'high'
    });
  }

  // Check for follow-up needs
  if (consultation.totalMessages && consultation.totalMessages > 10) {
    recommendations.push({
      type: 'follow_up',
      message: 'Consider scheduling a follow-up appointment with a healthcare provider for continued care.',
      priority: 'medium'
    });
  }

  // Specialty-specific recommendations
  if (aiProvider.specialty === 'Cardiology' && userMessage.toLowerCase().includes('heart')) {
    recommendations.push({
      type: 'lifestyle',
      message: 'Consider heart-healthy lifestyle changes including regular exercise and a balanced diet.',
      priority: 'low'
    });
  }

  return recommendations;
}

// Function to find an available specialist for referral
async function findAvailableSpecialist(specialty: string) {
  try {
    const specialist = await db
      .select()
      .from(aiProviders)
      .where(
        and(
          eq(aiProviders.specialty, specialty),
          eq(aiProviders.isActive, true),
          eq(aiProviders.isAvailable, true)
        )
      )
      .limit(1);
    
    return specialist.length > 0 ? specialist[0] : null;
  } catch (error: unknown) {
    console.error('Error finding available specialist:', error);
    return null;
  }
}