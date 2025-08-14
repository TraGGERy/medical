import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiConsultations, consultationMessages, aiProviders, healthReports } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { geminiHealthService } from '@/lib/services/geminiService';

interface RouteParams {
  id: string;
}

// Function to generate full diagnostic report from consultation data
async function generateFullDiagnosticFromConsultation(
  consultation: {
    id: string;
    reasonForVisit: string;
    symptoms?: string[];
    urgencyLevel: number;
    patientAge?: number;
    patientGender?: string;
    medicalHistory?: string[];
    currentMedications?: string[];
    allergies?: string[];
  },
  messages: Array<{
    senderType: string;
    content: string;
  }>,
  aiProvider: {
    name: string;
    specialty: string;
  }
) {
  try {
    // Extract symptoms from conversation and consultation data
    const symptoms = [];
    
    // Add initial symptoms from consultation
    if (consultation.symptoms && Array.isArray(consultation.symptoms)) {
      symptoms.push(...consultation.symptoms);
    }
    
    // Extract additional symptoms mentioned in conversation
    const conversationText = messages
      .filter(msg => msg.senderType === 'user')
      .map(msg => msg.content)
      .join(' ');
    
    // Add reason for visit as primary symptom if not already included
    if (consultation.reasonForVisit && !symptoms.includes(consultation.reasonForVisit)) {
      symptoms.push(consultation.reasonForVisit);
    }
    
    // Prepare full diagnostic request data
    const diagnosticData = {
      symptoms: symptoms.length > 0 ? symptoms : [consultation.reasonForVisit || 'General consultation'],
      duration: 'Ongoing', // Default since we don't have specific duration from consultation
      severity: consultation.urgencyLevel > 7 ? 'High' : consultation.urgencyLevel > 4 ? 'Medium' : 'Low',
      additionalInfo: `
Consultation Context:
- Patient Age: ${consultation.patientAge || 'Not specified'}
- Patient Gender: ${consultation.patientGender || 'Not specified'}
- Medical History: ${consultation.medicalHistory?.join(', ') || 'None specified'}
- Current Medications: ${consultation.currentMedications?.join(', ') || 'None specified'}
- Allergies: ${consultation.allergies?.join(', ') || 'None specified'}
- AI Provider: ${aiProvider.name} (${aiProvider.specialty})
- Urgency Level: ${consultation.urgencyLevel}/10

Conversation Summary:
${conversationText.substring(0, 1500)}${conversationText.length > 1500 ? '...' : ''}`,
      uploadedFiles: [] // No files from consultation
    };
    
    // Call Gemini service for full diagnostic analysis
    const fullDiagnostic = await geminiHealthService.analyzeFullDiagnostic(diagnosticData);
    
    return {
      ...fullDiagnostic,
      consultationId: consultation.id,
      generatedFrom: 'ai_consultation',
      consultationProvider: aiProvider.name,
      consultationSpecialty: aiProvider.specialty
    };
    
  } catch (error: unknown) {
    console.error('Error generating full diagnostic from consultation:', error);
    throw error;
  }
}

// Function to generate AI assessment/report
async function generateConsultationReport(
  consultationId: string,
  messages: Array<{
    senderType: string;
    content: string;
  }>,
  consultation: {
    reasonForVisit: string;
    patientAge?: number;
    patientGender?: string;
    medicalHistory?: string[];
    currentMedications?: string[];
    allergies?: string[];
    startedAt: string;
  },
  aiProvider: {
    name: string;
    specialty: string;
  }
) {
  try {
    // Prepare conversation summary for AI analysis
    const conversationText = messages
      .map(msg => `${msg.senderType === 'user' ? 'Patient' : 'AI Doctor'}: ${msg.content}`)
      .join('\n');

    const prompt = `
As an AI medical assistant, please generate a comprehensive consultation report based on the following conversation between a patient and AI doctor.

Patient Information:
- Age: ${consultation.patientAge || 'Not specified'}
- Gender: ${consultation.patientGender || 'Not specified'}
- Reason for visit: ${consultation.reasonForVisit}
- Medical history: ${consultation.medicalHistory?.join(', ') || 'None specified'}
- Current medications: ${consultation.currentMedications?.join(', ') || 'None specified'}
- Allergies: ${consultation.allergies?.join(', ') || 'None specified'}

Conversation:
${conversationText}

Please provide a structured medical report including:
1. Chief Complaint
2. History of Present Illness
3. Assessment
4. Recommendations
5. Follow-up Instructions
6. Red Flags (if any)

Format the response as a JSON object with these sections.`;

    // For now, we'll create a basic report structure
    // In a real implementation, you would call an AI service like OpenAI
    const report = {
      chiefComplaint: consultation.reasonForVisit,
      historyOfPresentIllness: `Patient consulted AI doctor ${aiProvider.name} regarding ${consultation.reasonForVisit}. Consultation lasted ${messages.length} messages.`,
      assessment: `Based on the conversation, the AI doctor provided guidance and recommendations for the patient's concerns.`,
      recommendations: [
        'Follow the advice provided during the consultation',
        'Monitor symptoms and seek immediate medical attention if they worsen',
        'Consider follow-up with a human healthcare provider if symptoms persist'
      ],
      followUpInstructions: [
        'Schedule follow-up if symptoms persist beyond recommended timeframe',
        'Keep a symptom diary if applicable',
        'Contact emergency services if experiencing severe symptoms'
      ],
      redFlags: [
        'Severe or worsening symptoms',
        'New concerning symptoms',
        'Symptoms not responding to recommended treatment'
      ],
      consultationSummary: {
        duration: `${messages.length} messages exchanged`,
        aiProvider: aiProvider.name,
        specialty: aiProvider.specialty,
        startTime: consultation.startedAt,
        endTime: new Date().toISOString()
      }
    };

    return report;
  } catch (error: unknown) {
    console.error('Error generating consultation report:', error);
    return {
      chiefComplaint: consultation.reasonForVisit,
      assessment: 'Consultation completed with AI provider',
      recommendations: ['Follow up with healthcare provider if needed'],
      consultationSummary: {
        duration: `${messages.length} messages exchanged`,
        aiProvider: aiProvider.name,
        startTime: consultation.startedAt,
        endTime: new Date().toISOString()
      }
    };
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

    // Get consultation with AI provider details
    const consultationResult = await db
      .select({
        consultation: aiConsultations,
        aiProvider: aiProviders
      })
      .from(aiConsultations)
      .leftJoin(aiProviders, eq(aiConsultations.aiProviderId, aiProviders.id))
      .where(
        and(
          eq(aiConsultations.id, id),
          eq(aiConsultations.patientId, userId)
        )
      )
      .limit(1);

    if (consultationResult.length === 0) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    const { consultation, aiProvider } = consultationResult[0];

    // Check if consultation is already ended
    if (consultation.status === 'completed') {
      return NextResponse.json(
        { error: 'Consultation is already completed' },
        { status: 400 }
      );
    }

    // Get all messages for the consultation
    const messages = await db
      .select()
      .from(consultationMessages)
      .where(eq(consultationMessages.consultationId, id))
      .orderBy(consultationMessages.createdAt);

    // Generate consultation report
    const aiAssessment = await generateConsultationReport(
      id,
      messages.map(m => ({ senderType: m.senderType, content: m.message })),
      {
        ...consultation,
        patientAge: consultation.patientAge ?? undefined,
        patientGender: consultation.patientGender ?? undefined,
        medicalHistory: Array.isArray(consultation.medicalHistory) ? consultation.medicalHistory : undefined,
        currentMedications: Array.isArray(consultation.currentMedications) ? consultation.currentMedications : undefined,
        allergies: Array.isArray(consultation.allergies) ? consultation.allergies : undefined,
        startedAt: consultation.startedAt ? new Date(consultation.startedAt).toISOString() : new Date().toISOString()
      },
      aiProvider || { name: 'AI Provider', specialty: 'General' }
    );

    // Generate full diagnostic report from consultation data
    let fullDiagnosticReport = null;
    let savedReportId = null;
    try {
      fullDiagnosticReport = await generateFullDiagnosticFromConsultation(
        {
          id: consultation.id,
          reasonForVisit: consultation.reasonForVisit,
          symptoms: Array.isArray(consultation.symptoms) ? consultation.symptoms : [consultation.reasonForVisit],
          urgencyLevel: consultation.urgencyLevel ?? 1,
          patientAge: consultation.patientAge ?? undefined,
          patientGender: consultation.patientGender ?? undefined,
          medicalHistory: Array.isArray(consultation.medicalHistory) ? consultation.medicalHistory : undefined,
          currentMedications: Array.isArray(consultation.currentMedications) ? consultation.currentMedications : undefined,
          allergies: Array.isArray(consultation.allergies) ? consultation.allergies : undefined
        },
        messages.map(m => ({ senderType: m.senderType, content: m.message })),
        aiProvider || { name: 'AI Provider', specialty: 'General' }
      );
      
      // Save the full diagnostic report to health reports
      if (fullDiagnosticReport) {
        const reportData = {
          userId: userId,
          title: `Full Diagnostic Report - ${consultation.reasonForVisit}`,
          symptoms: Array.isArray(consultation.symptoms) ? consultation.symptoms : [consultation.reasonForVisit],
          aiAnalysis: fullDiagnosticReport,
          riskLevel: fullDiagnosticReport.urgencyLevel === 'emergency' ? 'high' : 
                    fullDiagnosticReport.urgencyLevel === 'high' ? 'medium' : 'low',
          confidence: '0.80',
          recommendations: fullDiagnosticReport.recommendations || [],
          urgencyLevel: fullDiagnosticReport.urgencyLevel === 'emergency' ? 3 : 
                       fullDiagnosticReport.urgencyLevel === 'high' ? 2 : 1,
          followUpRequired: fullDiagnosticReport.urgencyLevel === 'emergency' || 
                           fullDiagnosticReport.urgencyLevel === 'high',
          doctorRecommended: fullDiagnosticReport.urgencyLevel === 'emergency' || 
                            fullDiagnosticReport.urgencyLevel === 'high'
        };
        
        const savedReport = await db.insert(healthReports).values(reportData).returning();
        savedReportId = savedReport[0]?.id;
      }
    } catch (error: unknown) {
      console.error('Error generating full diagnostic report:', error);
      // Continue with consultation end even if diagnostic report fails
    }

    // Calculate duration
    const startTime = new Date(consultation.startedAt);
    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    // Update consultation with end details
    const updatedConsultation = await db
      .update(aiConsultations)
      .set({
        status: 'completed',
        endedAt: endTime,
        durationMinutes,
        aiAssessment,
        totalMessages: messages.length,
        updatedAt: new Date()
      })
      .where(eq(aiConsultations.id, id))
      .returning();

    return NextResponse.json({
      message: 'Consultation ended successfully',
      consultation: updatedConsultation[0],
      report: aiAssessment,
      fullDiagnosticReport: fullDiagnosticReport,
      savedReportId: savedReportId
    });
  } catch (error: unknown) {
    console.error('Error ending AI consultation:', error);
    return NextResponse.json(
      { error: 'Failed to end AI consultation' },
      { status: 500 }
    );
  }
}