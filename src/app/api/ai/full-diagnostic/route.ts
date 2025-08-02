import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { geminiHealthService } from '@/lib/services/geminiService';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data for file uploads
    const formData = await request.formData();
    
    // Extract text fields
    const symptoms = formData.get('symptoms') as string;
    const duration = formData.get('duration') as string;
    const severity = formData.get('severity') as string;
    const additionalInfo = formData.get('additionalInfo') as string;
    const aiModel = formData.get('aiModel') as string || 'gemini';
    
    // Extract uploaded files
    const files = formData.getAll('files') as File[];

    // Validate required fields
    if (!symptoms || symptoms.trim().length === 0) {
      return NextResponse.json(
        { error: 'Symptoms are required for analysis' },
        { status: 400 }
      );
    }

    // Process uploaded files
    const processedFiles = await processUploadedFiles(files);

    // Prepare analysis request
    const analysisRequest = {
      symptoms: symptoms.split(',').map(s => s.trim()).filter(s => s.length > 0),
      duration,
      severity,
      additionalInfo,
      uploadedFiles: processedFiles
    };

    let analysis;
    
    if (aiModel === 'o3') {
      analysis = await analyzeWithO3(analysisRequest);
    } else {
      analysis = await analyzeWithGemini(analysisRequest);
    }

    return NextResponse.json({
      success: true,
      analysis,
      model: aiModel === 'o3' ? 'OpenAI O3' : 'Gemini 2.5 Pro',
      timestamp: new Date().toISOString(),
      filesProcessed: processedFiles.length
    });

  } catch (error) {
    console.error('Error in full diagnostic analysis:', error);
    return NextResponse.json(
      { error: 'Failed to perform full diagnostic analysis. Please try again.' },
      { status: 500 }
    );
  }
}

async function processUploadedFiles(files: File[]) {
  const processedFiles = [];
  
  for (const file of files) {
    try {
      const fileType = file.type;
      const fileName = file.name;
      const fileSize = file.size;
      
      // Check file size (max 10MB)
      if (fileSize > 10 * 1024 * 1024) {
        console.warn(`File ${fileName} is too large (${fileSize} bytes)`);
        continue;
      }

      let content = '';
      let fileInfo = {
        name: fileName,
        type: fileType,
        size: fileSize,
        content: '',
        isImage: false,
        base64: ''
      };

      if (fileType.startsWith('image/')) {
        // Process image files
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        fileInfo.isImage = true;
        fileInfo.base64 = base64;
        fileInfo.content = `[Image: ${fileName}]`;
      } else if (fileType === 'text/plain' || fileType.includes('text')) {
        // Process text files
        content = await file.text();
        fileInfo.content = content;
      } else if (fileType === 'application/pdf') {
        // For PDF files, we'll indicate they're uploaded but need special processing
        fileInfo.content = `[PDF Document: ${fileName} - ${Math.round(fileSize / 1024)}KB]`;
      } else {
        // Other document types
        fileInfo.content = `[Document: ${fileName} - ${fileType}]`;
      }

      processedFiles.push(fileInfo);
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
    }
  }
  
  return processedFiles;
}

async function analyzeWithGemini(request: any) {
  try {
    // Use the enhanced Gemini service for full diagnostic
    const analysis = await geminiHealthService.analyzeFullDiagnostic({
      symptoms: request.symptoms,
      duration: request.duration,
      severity: request.severity,
      additionalInfo: request.additionalInfo,
      uploadedFiles: request.uploadedFiles
    });
    
    return analysis;
  } catch (error) {
    console.error('Error with Gemini analysis:', error);
    throw error;
  }
}

async function analyzeWithO3(request: any) {
  try {
    const prompt = buildO3FullDiagnosticPrompt(request);

    const completion = await openai.chat.completions.create({
      model: "o3-mini",
      messages: [
        {
          role: "system",
          content: "You are an advanced medical AI assistant specialized in comprehensive diagnostic analysis. Provide detailed, structured analysis while emphasizing the importance of professional medical consultation. You can analyze symptoms along with uploaded medical documents and images."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 2500,
    });

    const analysisText = completion.choices[0]?.message?.content;

    if (!analysisText) {
      throw new Error('No analysis generated');
    }

    return parseO3FullDiagnosticResponse(analysisText);
  } catch (error) {
    console.error('Error with O3 analysis:', error);
    throw error;
  }
}

function buildO3FullDiagnosticPrompt(request: any): string {
  let fileContext = '';
  let hasUploadedReports = false;
  if (request.uploadedFiles && request.uploadedFiles.length > 0) {
    fileContext = '\n\nUPLOADED DOCUMENTS/IMAGES:\n';
    request.uploadedFiles.forEach((file: any, index: number) => {
      fileContext += `${index + 1}. ${file.name} (${file.type})\n`;
      if (file.content && !file.isImage) {
        fileContext += `Content: ${file.content.substring(0, 1000)}${file.content.length > 1000 ? '...' : ''}\n`;
        hasUploadedReports = true;
      } else if (file.isImage) {
        fileContext += `[Image file - visual analysis would be performed if image processing was available]\n`;
        hasUploadedReports = true;
      }
      fileContext += '\n';
    });
  }

  return `
Please perform a comprehensive diagnostic analysis based on the following information:

SYMPTOMS: ${request.symptoms.join(', ')}
${request.duration ? `DURATION: ${request.duration}` : ''}
${request.severity ? `SEVERITY: ${request.severity}` : ''}
${request.additionalInfo ? `ADDITIONAL INFO: ${request.additionalInfo}` : ''}
${fileContext}

${hasUploadedReports ? `
🚨 CRITICAL MEDICAL NEGLIGENCE ASSESSMENT REQUIRED:
Since medical reports/documents have been uploaded, you MUST perform a thorough negligence analysis:

1. STANDARD OF CARE EVALUATION:
   - Assess if previous medical care met accepted medical standards
   - Identify any missed diagnoses or delayed treatments
   - Review appropriateness of diagnostic tests ordered
   - Check for proper follow-up and monitoring protocols

2. RED FLAG SYMPTOM ANALYSIS:
   - Identify symptoms that should have triggered immediate action
   - Look for concerning patterns in previous treatment decisions
   - Check for medication errors, contraindications, or adverse reactions
   - Review timing and appropriateness of interventions and referrals

3. CONTINUITY AND QUALITY OF CARE:
   - Assess gaps in treatment or communication between providers
   - Review if patient concerns were adequately addressed
   - Identify any dismissive or inadequate medical responses
   - Check for proper informed consent and patient education

4. DOCUMENTATION AND RECORD REVIEW:
   - Look for incomplete, missing, or inconsistent medical information
   - Assess quality and thoroughness of clinical notes
   - Review if proper protocols were followed
   - Identify any potential liability or malpractice indicators
` : ''}

Please provide a structured FULL DIAGNOSTIC analysis in the following format:

URGENCY_LEVEL: [emergency/high/medium/low]

COMPREHENSIVE_ANALYSIS:
[Your detailed analysis considering all symptoms, duration, severity, and any uploaded documents]

DIFFERENTIAL_DIAGNOSIS:
- [Most likely condition with reasoning]
- [Second possibility with reasoning]
- [Third possibility with reasoning]
- [Additional considerations]

CLINICAL_RECOMMENDATIONS:
- [Immediate actions needed]
- [Diagnostic tests recommended]
- [Specialist referrals if needed]
- [Monitoring guidelines]

LIFESTYLE_RECOMMENDATIONS:
- [Diet and nutrition advice]
- [Exercise recommendations]
- [Sleep and stress management]
- [Preventive measures]

FOLLOW_UP_PLAN:
- [Short-term follow-up (1-7 days)]
- [Medium-term follow-up (1-4 weeks)]
- [Long-term monitoring]

RED_FLAGS:
[Warning signs that require immediate medical attention]

DOCUMENT_ANALYSIS:
${request.uploadedFiles.length > 0 ? '[Analysis of uploaded documents and their relevance to the symptoms]' : '[No documents uploaded]'}

${hasUploadedReports ? `
NEGLIGENCE_ASSESSMENT:
[CRITICAL: Detailed analysis of potential medical negligence indicators based on uploaded reports. Include:
- Assessment of standard of care violations
- Identification of missed diagnoses or delayed treatments
- Review of inappropriate or inadequate medical responses
- Documentation of potential malpractice indicators
- Recommendations for second opinions or legal consultation if warranted]
` : ''}

DISCLAIMER:
[Comprehensive medical disclaimer about seeking professional care]

Focus on:
1. Comprehensive symptom correlation
2. Evidence-based medical reasoning
3. Risk stratification
4. Actionable recommendations
5. Integration of uploaded medical information
6. Clear follow-up guidelines
${hasUploadedReports ? '7. CRITICAL: Thorough medical negligence assessment when reports are provided' : ''}

This is a full diagnostic assessment, provide detailed and thorough analysis.
${hasUploadedReports ? 'IMPORTANT: If potential negligence is identified, strongly recommend seeking second medical opinion and/or legal consultation.' : ''}
`;
}

function parseO3FullDiagnosticResponse(response: string) {
  const lines = response.split('\n');
  let urgencyLevel = 'medium';
  let comprehensiveAnalysis = '';
  let differentialDiagnosis: string[] = [];
  let clinicalRecommendations: string[] = [];
  let lifestyleRecommendations: string[] = [];
  let followUpPlan: string[] = [];
  let redFlags = '';
  let documentAnalysis = '';
  let negligenceAssessment = '';
  let disclaimer = '';

  let currentSection = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('URGENCY_LEVEL:')) {
      urgencyLevel = trimmedLine.replace('URGENCY_LEVEL:', '').trim().toLowerCase();
    } else if (trimmedLine === 'COMPREHENSIVE_ANALYSIS:') {
      currentSection = 'analysis';
    } else if (trimmedLine === 'DIFFERENTIAL_DIAGNOSIS:') {
      currentSection = 'diagnosis';
    } else if (trimmedLine === 'CLINICAL_RECOMMENDATIONS:') {
      currentSection = 'clinical';
    } else if (trimmedLine === 'LIFESTYLE_RECOMMENDATIONS:') {
      currentSection = 'lifestyle';
    } else if (trimmedLine === 'FOLLOW_UP_PLAN:') {
      currentSection = 'followup';
    } else if (trimmedLine === 'RED_FLAGS:') {
      currentSection = 'redflags';
    } else if (trimmedLine === 'DOCUMENT_ANALYSIS:') {
      currentSection = 'documents';
    } else if (trimmedLine === 'NEGLIGENCE_ASSESSMENT:') {
      currentSection = 'negligence';
    } else if (trimmedLine === 'DISCLAIMER:') {
      currentSection = 'disclaimer';
    } else if (trimmedLine) {
      switch (currentSection) {
        case 'analysis':
          comprehensiveAnalysis += trimmedLine + ' ';
          break;
        case 'diagnosis':
          if (trimmedLine.startsWith('-')) {
            differentialDiagnosis.push(trimmedLine.substring(1).trim());
          }
          break;
        case 'clinical':
          if (trimmedLine.startsWith('-')) {
            clinicalRecommendations.push(trimmedLine.substring(1).trim());
          }
          break;
        case 'lifestyle':
          if (trimmedLine.startsWith('-')) {
            lifestyleRecommendations.push(trimmedLine.substring(1).trim());
          }
          break;
        case 'followup':
          if (trimmedLine.startsWith('-')) {
            followUpPlan.push(trimmedLine.substring(1).trim());
          }
          break;
        case 'redflags':
          redFlags += trimmedLine + ' ';
          break;
        case 'documents':
          documentAnalysis += trimmedLine + ' ';
          break;
        case 'negligence':
          negligenceAssessment += trimmedLine + ' ';
          break;
        case 'disclaimer':
          disclaimer += trimmedLine + ' ';
          break;
      }
    }
  }

  // Provide fallback values
  if (!comprehensiveAnalysis) {
    comprehensiveAnalysis = 'Comprehensive diagnostic analysis completed. Please consult with a healthcare professional for proper evaluation.';
  }
  
  if (differentialDiagnosis.length === 0) {
    differentialDiagnosis = ['Multiple conditions could cause these symptoms', 'Professional evaluation needed for accurate diagnosis'];
  }
  
  if (clinicalRecommendations.length === 0) {
    clinicalRecommendations = ['Consult healthcare provider for proper evaluation', 'Consider appropriate diagnostic tests', 'Monitor symptoms closely'];
  }

  if (lifestyleRecommendations.length === 0) {
    lifestyleRecommendations = ['Maintain healthy diet and hydration', 'Get adequate rest', 'Manage stress levels'];
  }

  if (followUpPlan.length === 0) {
    followUpPlan = ['Schedule appointment with healthcare provider', 'Monitor symptoms for changes', 'Return if symptoms worsen'];
  }
  
  if (!disclaimer) {
    disclaimer = 'This is a comprehensive AI analysis and should not replace professional medical advice. Please consult with a qualified healthcare provider for proper diagnosis and treatment.';
  }

  return {
    urgencyLevel: urgencyLevel || 'medium',
    analysis: comprehensiveAnalysis.trim(),
    possibleConditions: differentialDiagnosis,
    recommendations: clinicalRecommendations,
    lifestyleRecommendations,
    followUpPlan,
    redFlags: redFlags.trim() || 'Seek immediate medical attention if symptoms worsen significantly.',
    documentAnalysis: documentAnalysis.trim() || 'No specific document analysis available.',
    negligenceAssessment: negligenceAssessment.trim() || null,
    disclaimer: disclaimer.trim(),
    diagnosticType: 'full'
  };
}