import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export interface HealthAnalysisRequest {
  symptoms: string[];
  medicalHistory?: string;
  age?: number;
  gender?: string;
  duration?: string;
  severity?: string;
  additionalInfo?: string;
}

export interface FullDiagnosticRequest {
  symptoms: string[];
  duration?: string;
  severity?: string;
  additionalInfo?: string;
  uploadedFiles?: UploadedFile[];
}

export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  content: string;
  isImage: boolean;
  base64?: string;
}

export interface HealthAnalysisResponse {
  analysis: string;
  possibleConditions: string[];
  recommendations: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  disclaimer: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface HealthReport {
  summary: string;
  riskFactors: string[];
  recommendations: string[];
  followUpActions: string[];
}

export interface HealthPredictionRequest {
  biometricData: BiometricReading[];
  medicalHistory?: string;
  lifestyle?: {
    exercise: string;
    diet: string;
    sleep: string;
    stress: string;
    smoking: boolean;
    alcohol: string;
  };
  familyHistory?: string[];
  currentSymptoms?: string[];
  medications?: string[];
}

export interface BiometricReading {
  type: string;
  value: number;
  unit: string;
  timestamp: Date;
  deviceId?: string;
}

export interface HealthPrediction {
  riskScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  predictions: {
    condition: string;
    probability: number;
    timeframe: string;
    riskFactors: string[];
  }[];
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  trends: {
    metric: string;
    trend: 'improving' | 'stable' | 'declining';
    confidence: number;
    analysis: string;
  }[];
  alerts: {
    type: 'warning' | 'critical';
    message: string;
    action: string;
  }[];
}

export interface TrendAnalysisRequest {
  biometricHistory: BiometricReading[];
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  metrics: string[];
}

export interface TrendAnalysis {
  summary: string;
  trends: {
    metric: string;
    direction: 'improving' | 'stable' | 'declining';
    changePercentage: number;
    significance: 'low' | 'moderate' | 'high';
    analysis: string;
  }[];
  insights: string[];
  recommendations: string[];
}

export interface FullDiagnosticResponse {
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  analysis: string;
  possibleConditions: string[];
  recommendations: string[];
  lifestyleRecommendations: string[];
  followUpPlan: string[];
  redFlags: string;
  documentAnalysis: string;
  negligenceAssessment: string | null;
  disclaimer: string;
  diagnosticType: 'full';
}

export interface PrescriptionAnalysisRequest {
  prescriptionImage: UploadedFile;
  patientSymptoms?: string[];
  currentMedications?: string[];
  allergies?: string[];
  medicalHistory?: string;
}

export interface PrescriptionAnalysisResponse {
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration?: string;
    instructions: string;
  }[];
  interactions: {
    type: 'drug-drug' | 'drug-allergy' | 'drug-condition';
    severity: 'mild' | 'moderate' | 'severe' | 'contraindicated';
    description: string;
    recommendation: string;
  }[];
  sideEffects: {
    medication: string;
    commonEffects: string[];
    seriousEffects: string[];
  }[];
  compliance: {
    instructions: string[];
    warnings: string[];
    monitoring: string[];
  };
  imageQuality: 'excellent' | 'good' | 'fair' | 'poor';
  readabilityIssues: string[];
  disclaimer: string;
}



export class GeminiHealthService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  private visionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Rate limiting and retry logic
  private async retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on non-retryable errors
        if (error?.status === 403 || error?.status === 401) {
          throw error;
        }
        
        // For rate limiting (429), wait before retrying
        if (error?.status === 429 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
          console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If this is the last attempt or non-retryable error, throw
        if (attempt === maxRetries) {
          throw error;
        }
        
        // For other errors, wait a shorter time
        const delay = 1000 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  async analyzeSymptoms(request: HealthAnalysisRequest): Promise<HealthAnalysisResponse> {
    try {
      if (!request.symptoms.length) {
        throw new Error('Please enter at least one symptom for analysis.');
      }
      const prompt = this.buildHealthAnalysisPrompt(request);
      const result = await this.retryWithBackoff(() => this.model.generateContent(prompt));
      const response = await result.response;
      const text = response.text();

      return this.parseHealthAnalysisResponse(text);
    } catch (error: any) {
      console.error('Error analyzing symptoms:', error);
      
      // Handle specific error types
      if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
        throw new Error('AI service is temporarily busy due to high demand. Please wait a moment and try again.');
      }
      
      if (error?.status === 403) {
        throw new Error('AI service access is restricted. Please check your configuration.');
      }
      
      throw new Error('Failed to analyze symptoms. Please try again.');
    }
  }

  async analyzeFullDiagnostic(request: FullDiagnosticRequest): Promise<FullDiagnosticResponse> {
    try {
      // Check if we have images to process
      const hasImages = request.uploadedFiles?.some(file => file.isImage) || false;
      
      if (hasImages) {
        return await this.analyzeWithVision(request);
      } else {
        return await this.analyzeWithText(request);
      }
    } catch (error) {
      console.error('Error in full diagnostic analysis:', error);
      throw new Error('Failed to perform full diagnostic analysis. Please try again.');
    }
  }

  private async analyzeWithVision(request: FullDiagnosticRequest): Promise<FullDiagnosticResponse> {
    try {
      const prompt = this.buildFullDiagnosticPrompt(request);
      
      // Prepare content parts for multimodal input
      const parts: Part[] = [{ text: prompt }];
      
      // Validate and add images to the request
      if (request.uploadedFiles) {
        for (const file of request.uploadedFiles) {
          if (file.isImage) {
            // Validate image data
            if (!file.base64) {
              console.warn(`Image file ${file.name} missing base64 data, skipping`);
              continue;
            }
            
            // Validate MIME type
            if (!file.type.startsWith('image/')) {
              console.warn(`Invalid MIME type for image ${file.name}: ${file.type}`);
              continue;
            }
            
            // Check file size (Gemini has limits)
            if (file.size > 20 * 1024 * 1024) { // 20MB limit
              console.warn(`Image file ${file.name} too large: ${file.size} bytes`);
              continue;
            }
            
            parts.push({
              inlineData: {
                mimeType: file.type,
                data: file.base64
              }
            });
          }
        }
      }

      // Ensure we have at least the text prompt
      if (parts.length === 1) {
        console.warn('No valid images found, falling back to text analysis');
        return this.analyzeWithText(request);
      }

      const result = await this.retryWithBackoff(() => this.visionModel.generateContent(parts));
      const response = await result.response;
      
      // Check if response is blocked or has safety issues
      if (!response || !response.text) {
        throw new Error('Vision analysis was blocked or returned empty response');
      }
      
      const text = response.text();
      return this.parseFullDiagnosticResponse(text);
    } catch (error: any) {
      console.error('Error in vision analysis:', error);
      
      // Handle specific error types with better messages
      if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
        throw new Error('AI service is temporarily busy due to high demand. Please wait a moment and try again.');
      }
      
      if (error?.status === 403) {
        throw new Error('AI service access is restricted. Please check your configuration.');
      }
      
      // Handle specific Gemini API errors
      if (error instanceof Error) {
        if (error.message.includes('SAFETY')) {
          throw new Error('Image analysis was blocked due to safety concerns. Please ensure the image contains only medical content.');
        }
        if (error.message.includes('INVALID_ARGUMENT')) {
          throw new Error('Invalid image format or content. Please upload a clear medical image.');
        }
      }
      
      // Fallback to text analysis if vision fails
      console.log('Vision analysis failed, attempting text-only analysis');
      try {
        return await this.analyzeWithText(request);
      } catch (fallbackError) {
        console.error('Fallback text analysis also failed:', fallbackError);
        throw new Error('Both vision and text analysis failed. Please try again with a different image or contact support.');
      }
    }
  }

  private async analyzeWithText(request: FullDiagnosticRequest): Promise<FullDiagnosticResponse> {
    try {
      const prompt = this.buildFullDiagnosticPrompt(request);
      const result = await this.retryWithBackoff(() => this.model.generateContent(prompt));
      const response = await result.response;
      const text = response.text();

      return this.parseFullDiagnosticResponse(text);
    } catch (error: any) {
      console.error('Error in text analysis:', error);
      
      // Handle specific error types
      if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
        throw new Error('AI service is temporarily busy due to high demand. Please wait a moment and try again.');
      }
      
      if (error?.status === 403) {
        throw new Error('AI service access is restricted. Please check your configuration.');
      }
      
      throw error;
    }
  }

  async chatWithAssistant(message: string, userMedicalHistory?: string): Promise<string> {
    try {
      const systemPrompt = this.buildChatSystemPrompt(userMedicalHistory);
      const prompt = `${systemPrompt}\n\nUser: ${message}\n\nPlease provide a helpful, accurate, and empathetic response:`;

      const result = await this.retryWithBackoff(() => this.model.generateContent(prompt));
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Error in chat:', error);
      
      // Handle specific error types
      if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
        throw new Error('AI service is temporarily busy due to high demand. Please wait a moment and try again.');
      }
      
      if (error?.status === 403) {
        throw new Error('AI service access is restricted. Please check your configuration.');
      }
      
      throw new Error('Failed to get response from AI assistant. Please try again.');
    }
  }

  async generatePredictiveHealthInsights(request: HealthPredictionRequest): Promise<HealthPrediction> {
    try {
      const prompt = this.buildPredictiveHealthPrompt(request);
      const result = await this.retryWithBackoff(() => this.model.generateContent(prompt));
      const response = await result.response;
      const text = response.text();

      return this.parsePredictiveHealthResponse(text);
    } catch (error: any) {
      console.error('Error generating predictive health insights:', error);
      
      // Handle specific error types
      if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
        throw new Error('AI service is temporarily busy due to high demand. Please wait a moment and try again.');
      }
      
      if (error?.status === 403) {
        throw new Error('AI service access is restricted. Please check your configuration.');
      }
      
      throw new Error('Failed to generate predictive health insights. Please try again.');
    }
  }

  async analyzeTrends(request: TrendAnalysisRequest): Promise<TrendAnalysis> {
    try {
      const prompt = this.buildTrendAnalysisPrompt(request);
      const result = await this.retryWithBackoff(() => this.model.generateContent(prompt));
      const response = await result.response;
      const text = response.text();

      return this.parseTrendAnalysisResponse(text);
    } catch (error: any) {
      console.error('Error analyzing health trends:', error);
      
      // Handle specific error types
      if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
        throw new Error('AI service is temporarily busy due to high demand. Please wait a moment and try again.');
      }
      
      if (error?.status === 403) {
        throw new Error('AI service access is restricted. Please check your configuration.');
      }
      
      throw new Error('Failed to analyze health trends. Please try again.');
    }
  }

  async analyzePrescription(request: PrescriptionAnalysisRequest): Promise<PrescriptionAnalysisResponse> {
    try {
      // Validate prescription image
      if (!request.prescriptionImage) {
        throw new Error('No prescription image provided');
      }
      
      if (!request.prescriptionImage.isImage) {
        throw new Error('Uploaded file is not an image');
      }
      
      if (!request.prescriptionImage.base64) {
        throw new Error('Image data is missing or corrupted');
      }
      
      // Check file size
      if (request.prescriptionImage.size > 20 * 1024 * 1024) {
        throw new Error('Image file is too large. Please upload an image smaller than 20MB.');
      }
      
      // Validate image type
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validImageTypes.includes(request.prescriptionImage.type.toLowerCase())) {
        throw new Error('Invalid image format. Please upload a JPEG, PNG, or WebP image.');
      }
      
      const prompt = this.buildPrescriptionAnalysisPrompt(request);
      
      // Prepare content parts for multimodal input
      const parts: Part[] = [{ text: prompt }];
      
      parts.push({
        inlineData: {
          mimeType: request.prescriptionImage.type,
          data: request.prescriptionImage.base64
        }
      });

      const result = await this.retryWithBackoff(() => this.visionModel.generateContent(parts));
      const response = await result.response;
      
      if (!response || !response.text) {
        throw new Error('Prescription analysis was blocked or returned empty response');
      }
      
      const text = response.text();
      return this.parsePrescriptionAnalysisResponse(text);
    } catch (error: any) {
      console.error('Error analyzing prescription:', error);
      
      // Handle specific error types with better messages
      if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
        throw new Error('AI service is temporarily busy due to high demand. Please wait a moment and try again.');
      }
      
      if (error?.status === 403) {
        throw new Error('AI service access is restricted. Please check your configuration.');
      }
      
      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes('SAFETY')) {
          throw new Error('Prescription analysis was blocked due to safety concerns. Please ensure the image contains only a valid prescription.');
        }
        if (error.message.includes('QUOTA_EXCEEDED')) {
          throw new Error('API quota exceeded. Please try again later.');
        }
        if (error.message.includes('INVALID_ARGUMENT')) {
          throw new Error('Invalid prescription image. Please upload a clear, readable prescription image.');
        }
        // Re-throw validation errors as-is
        if (error.message.includes('No prescription image') || 
            error.message.includes('not an image') ||
            error.message.includes('too large') ||
            error.message.includes('Invalid image format')) {
          throw error;
        }
      }
      
      throw new Error('Failed to analyze prescription. Please ensure the image is clear and readable, then try again.');
    }
  }

  async generateHealthReport(symptoms: string): Promise<HealthReport> {
    try {
      const prompt = `
        Generate a comprehensive health report based on the following symptoms: ${symptoms}
        
        Please provide your response in the following JSON format:
        {
          "summary": "Brief summary of the health assessment",
          "riskFactors": ["risk factor 1", "risk factor 2", "risk factor 3"],
          "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
          "followUpActions": ["action 1", "action 2", "action 3"]
        }
        
        Important guidelines:
        - Provide educational information, not definitive diagnoses
        - Always recommend consulting with healthcare professionals
        - Be conservative and emphasize the need for professional medical evaluation
        - Include appropriate medical disclaimers in recommendations
      `;

      const result = await this.retryWithBackoff(() => this.model.generateContent(prompt));
      const response = await result.response;
      const text = response.text();

      return this.parseHealthReportResponse(text);
    } catch (error: any) {
      console.error('Error generating health report:', error);
      
      // Handle specific error types
      if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
        throw new Error('AI service is temporarily busy due to high demand. Please wait a moment and try again.');
      }
      
      if (error?.status === 403) {
        throw new Error('AI service access is restricted. Please check your configuration.');
      }
      
      throw new Error('Failed to generate health report. Please try again.');
    }
  }

  private buildFullDiagnosticPrompt(request: FullDiagnosticRequest): string {
    let fileContext = '';
    let hasUploadedReports = false;
    if (request.uploadedFiles && request.uploadedFiles.length > 0) {
      fileContext = '\n\nUPLOADED MEDICAL DOCUMENTS:\n';
      request.uploadedFiles.forEach((file, index) => {
        fileContext += `${index + 1}. ${file.name} (${file.type})\n`;
        if (file.content && !file.isImage) {
          fileContext += `Content: ${file.content}\n`;
          hasUploadedReports = true;
        } else if (file.isImage) {
          // Check if this might be a prescription based on filename or metadata
          const isPrescription = file.name.toLowerCase().includes('prescription') || 
                               file.name.toLowerCase().includes('rx') ||
                               file.name.toLowerCase().includes('medication');
          
          if (isPrescription) {
            fileContext += `[PRESCRIPTION IMAGE - Perform detailed prescription analysis including medication extraction, drug interactions, side effects, and compliance guidelines]\n`;
          } else {
            fileContext += `[Medical Image - Please analyze the visual content in relation to the symptoms]\n`;
          }
          hasUploadedReports = true;
        }
        fileContext += '\n';
      });
    }

    return `
      You are an advanced medical AI assistant performing a comprehensive diagnostic analysis. 
      Analyze the following health information and provide detailed insights:

      SYMPTOMS: ${request.symptoms.join(', ')}
      ${request.duration ? `DURATION: ${request.duration}` : ''}
      ${request.severity ? `SEVERITY: ${request.severity}` : ''}
      ${request.additionalInfo ? `ADDITIONAL INFO: ${request.additionalInfo}` : ''}
      ${fileContext}

      ${hasUploadedReports ? `
      🚨 CRITICAL MEDICAL NEGLIGENCE ASSESSMENT:
      Since medical reports/documents have been uploaded, you MUST perform a thorough negligence analysis:
      
      1. CARE STANDARD EVALUATION:
         - Review if previous medical care met standard protocols
         - Identify any missed diagnoses or delayed treatments
         - Check for appropriate follow-up and monitoring
         - Assess if proper diagnostic tests were ordered
      
      2. RED FLAG ANALYSIS:
         - Look for symptoms that should have triggered immediate action
         - Identify any concerning patterns in previous treatment
         - Check for medication errors or contraindications
         - Review timing of interventions and referrals
      
      3. CONTINUITY OF CARE:
         - Assess if there were gaps in treatment
         - Check for proper communication between providers
         - Review if patient concerns were adequately addressed
         - Identify any dismissive or inadequate responses
      
      4. DOCUMENTATION REVIEW:
         - Check for incomplete or missing information
         - Look for inconsistencies in medical records
         - Assess quality of clinical notes and assessments
         - Review if informed consent was properly obtained
      ` : ''}

      Please provide your response in the following JSON format:
      {
        "urgencyLevel": "low|medium|high|emergency",
        "analysis": "Comprehensive analysis of symptoms and uploaded materials",
        "possibleConditions": ["condition1", "condition2", "condition3"],
        "recommendations": ["clinical recommendation1", "clinical recommendation2", "clinical recommendation3"],
        "lifestyleRecommendations": ["lifestyle1", "lifestyle2", "lifestyle3"],
        "followUpPlan": ["followup1", "followup2", "followup3"],
        "redFlags": "Warning signs that require immediate attention",
        "documentAnalysis": "Analysis of uploaded documents and images",
        ${hasUploadedReports ? '"negligenceAssessment": "Detailed analysis of potential medical negligence indicators based on uploaded reports",' : ''}
        "disclaimer": "Medical disclaimer about seeking professional care"
      }

      Important guidelines for FULL DIAGNOSTIC:
      - Provide comprehensive analysis considering all available information
      - Analyze uploaded medical documents and images thoroughly
      - Include differential diagnosis with reasoning
      - Provide specific clinical recommendations
      - Include lifestyle and preventive recommendations
      - Create a detailed follow-up plan
      - Identify red flag symptoms
      ${hasUploadedReports ? '- CRITICALLY IMPORTANT: Assess for potential medical negligence when reports are provided' : ''}
      - Always emphasize the need for professional medical evaluation
      - Be thorough but conservative in assessments
      - If negligence is suspected, recommend seeking second opinion or legal consultation
    `;
  }

  private parseFullDiagnosticResponse(text: string): FullDiagnosticResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          urgencyLevel: parsed.urgencyLevel || 'medium',
          analysis: parsed.analysis || 'Comprehensive diagnostic analysis completed.',
          possibleConditions: parsed.possibleConditions || ['Professional evaluation needed for accurate diagnosis'],
          recommendations: parsed.recommendations || ['Consult with healthcare professional for proper evaluation'],
          lifestyleRecommendations: parsed.lifestyleRecommendations || ['Maintain healthy lifestyle habits'],
          followUpPlan: parsed.followUpPlan || ['Schedule follow-up with healthcare provider'],
          redFlags: parsed.redFlags || 'Seek immediate medical attention if symptoms worsen significantly.',
          documentAnalysis: parsed.documentAnalysis || 'No specific document analysis available.',
          negligenceAssessment: parsed.negligenceAssessment || null,
          disclaimer: parsed.disclaimer || 'This is a comprehensive AI analysis and should not replace professional medical advice.',
          diagnosticType: 'full'
        };
      }
    } catch (error) {
      console.error('Error parsing full diagnostic JSON response:', error);
    }

    // Fallback parsing if JSON extraction fails
    return {
      urgencyLevel: 'medium',
      analysis: text,
      possibleConditions: ['Professional evaluation needed for accurate diagnosis'],
      recommendations: ['Consult with healthcare professional for proper evaluation'],
      lifestyleRecommendations: ['Maintain healthy lifestyle habits'],
      followUpPlan: ['Schedule follow-up with healthcare provider'],
      redFlags: 'Seek immediate medical attention if symptoms worsen significantly.',
      documentAnalysis: 'Document analysis not available.',
      negligenceAssessment: null,
      disclaimer: 'This is a comprehensive AI analysis and should not replace professional medical advice.',
      diagnosticType: 'full'
    };
  }

  private buildHealthAnalysisPrompt(request: HealthAnalysisRequest): string {
    return `
      You are a medical AI assistant. Analyze the following health information and provide insights:

      Symptoms: ${request.symptoms.join(', ')}
      ${request.medicalHistory ? `Medical History: ${request.medicalHistory}` : ''}
      ${request.age ? `Age: ${request.age}` : ''}
      ${request.gender ? `Gender: ${request.gender}` : ''}
      ${request.duration ? `Duration: ${request.duration}` : ''}
      ${request.severity ? `Severity: ${request.severity}` : ''}
      ${request.additionalInfo ? `Additional Information: ${request.additionalInfo}` : ''}

      Please provide your response in the following JSON format:
      {
        "analysis": "Detailed analysis of the symptoms and potential causes",
        "possibleConditions": ["condition1", "condition2", "condition3"],
        "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
        "urgencyLevel": "low|medium|high|emergency",
        "disclaimer": "Medical disclaimer about seeking professional care"
      }

      Important guidelines:
      - Always recommend consulting with healthcare professionals
      - Be conservative with urgency levels
      - Provide educational information, not definitive diagnoses
      - Include appropriate medical disclaimers
    `;
  }

  private buildChatSystemPrompt(userMedicalHistory?: string): string {
    return `
      You are a friendly AI Wellness Assistant. Your role is to:
      - Provide general wellness and health information
      - Offer lifestyle and nutrition advice
      - Share tips for mental health and stress management
      - Discuss exercise and fitness guidance
      - Help with sleep hygiene and healthy habits
      - Provide preventive care recommendations
      - Support users with general health questions

      ${userMedicalHistory ? `User's Medical History: ${userMedicalHistory}` : ''}

      Important guidelines:
      - Focus on wellness, prevention, and healthy lifestyle choices
      - Be warm, encouraging, and supportive in your responses
      - Provide evidence-based wellness information
      - Always remind users that you provide general wellness information only
      - For specific medical concerns or symptoms, recommend consulting healthcare professionals
      - Encourage positive health behaviors and self-care
      - Keep responses conversational and easy to understand
      - If someone mentions serious symptoms, gently suggest they see a healthcare provider
      
      Remember: You are a wellness companion, not a medical diagnostic tool. Focus on promoting overall health and well-being.
    `;
  }

  private parseHealthAnalysisResponse(text: string): HealthAnalysisResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          analysis: parsed.analysis || 'Analysis not available',
          possibleConditions: parsed.possibleConditions || [],
          recommendations: parsed.recommendations || [],
          urgencyLevel: parsed.urgencyLevel || 'medium',
          disclaimer: parsed.disclaimer || 'This is not a medical diagnosis. Please consult with a healthcare professional.'
        };
      }
    } catch (error) {
      console.error('Error parsing JSON response:', error);
    }

    // Fallback parsing if JSON extraction fails
    return {
      analysis: text,
      possibleConditions: [],
      recommendations: ['Consult with a healthcare professional for proper evaluation'],
      urgencyLevel: 'medium',
      disclaimer: 'This is not a medical diagnosis. Please consult with a healthcare professional.'
    };
  }
  private parseHealthReportResponse(text: string): HealthReport {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'Health assessment summary not available',
          riskFactors: parsed.riskFactors || [],
          recommendations: parsed.recommendations || ['Consult with a healthcare professional for proper evaluation'],
          followUpActions: parsed.followUpActions || ['Schedule an appointment with your healthcare provider']
        };
      }
    } catch (error) {
      console.error('Error parsing health report JSON response:', error);
    }

    // Fallback parsing if JSON extraction fails
    return {
      summary: 'Health assessment completed. Please review the detailed information below.',
      riskFactors: ['Unable to determine specific risk factors'],
      recommendations: ['Consult with a healthcare professional for proper evaluation'],
      followUpActions: ['Schedule an appointment with your healthcare provider']
    };
  }

  private buildPredictiveHealthPrompt(request: HealthPredictionRequest): string {
    const biometricSummary = request.biometricData.map(reading => 
      `${reading.type}: ${reading.value} ${reading.unit} (${reading.timestamp.toISOString()})`
    ).join('\n');

    return `
      You are an advanced AI health prediction system. Analyze the following comprehensive health data to provide predictive insights:

      BIOMETRIC DATA (Recent Readings):
      ${biometricSummary}

      ${request.medicalHistory ? `MEDICAL HISTORY: ${request.medicalHistory}` : ''}
      ${request.lifestyle ? `LIFESTYLE FACTORS:
      - Exercise: ${request.lifestyle.exercise}
      - Diet: ${request.lifestyle.diet}
      - Sleep: ${request.lifestyle.sleep}
      - Stress: ${request.lifestyle.stress}
      - Smoking: ${request.lifestyle.smoking ? 'Yes' : 'No'}
      - Alcohol: ${request.lifestyle.alcohol}` : ''}
      ${request.familyHistory ? `FAMILY HISTORY: ${request.familyHistory.join(', ')}` : ''}
      ${request.currentSymptoms ? `CURRENT SYMPTOMS: ${request.currentSymptoms.join(', ')}` : ''}
      ${request.medications ? `CURRENT MEDICATIONS: ${request.medications.join(', ')}` : ''}

      Please provide your response in the following JSON format:
      {
        "riskScore": 0-100,
        "riskLevel": "low|moderate|high|critical",
        "predictions": [
          {
            "condition": "condition name",
            "probability": 0-100,
            "timeframe": "timeframe description",
            "riskFactors": ["factor1", "factor2"]
          }
        ],
        "recommendations": {
          "immediate": ["action1", "action2"],
          "shortTerm": ["action1", "action2"],
          "longTerm": ["action1", "action2"]
        },
        "trends": [
          {
            "metric": "metric name",
            "trend": "improving|stable|declining",
            "confidence": 0-100,
            "analysis": "detailed analysis"
          }
        ],
        "alerts": [
          {
            "type": "warning|critical",
            "message": "alert message",
            "action": "recommended action"
          }
        ]
      }

      Guidelines:
      - Analyze patterns in biometric data for early warning signs
      - Consider lifestyle factors in risk assessment
      - Provide actionable, evidence-based recommendations
      - Include confidence levels for predictions
      - Identify concerning trends that need attention
      - Always emphasize the need for professional medical consultation
    `;
  }

  private buildTrendAnalysisPrompt(request: TrendAnalysisRequest): string {
    const dataByMetric = request.biometricHistory.reduce((acc, reading) => {
      if (!acc[reading.type]) acc[reading.type] = [];
      acc[reading.type].push(`${reading.value} ${reading.unit} (${reading.timestamp.toISOString()})`);
      return acc;
    }, {} as Record<string, string[]>);

    const dataString = Object.entries(dataByMetric)
      .map(([metric, readings]) => `${metric}:\n${readings.join('\n')}`)
      .join('\n\n');

    return `
      You are an AI health trend analyst. Analyze the following biometric data over the ${request.timeframe} timeframe:

      BIOMETRIC DATA:
      ${dataString}

      METRICS TO ANALYZE: ${request.metrics.join(', ')}
      TIMEFRAME: ${request.timeframe}

      Please provide your response in the following JSON format:
      {
        "summary": "Overall trend summary",
        "trends": [
          {
            "metric": "metric name",
            "direction": "improving|stable|declining",
            "changePercentage": percentage change,
            "significance": "low|moderate|high",
            "analysis": "detailed trend analysis"
          }
        ],
        "insights": ["insight1", "insight2", "insight3"],
        "recommendations": ["recommendation1", "recommendation2"]
      }

      Guidelines:
      - Calculate percentage changes and trend directions
      - Identify statistically significant changes
      - Provide actionable insights based on trends
      - Consider normal variations vs concerning patterns
      - Recommend appropriate follow-up actions
    `;
  }

  private parsePredictiveHealthResponse(text: string): HealthPrediction {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          riskScore: parsed.riskScore || 0,
          riskLevel: parsed.riskLevel || 'low',
          predictions: parsed.predictions || [],
          recommendations: parsed.recommendations || {
            immediate: ['Consult with healthcare professional'],
            shortTerm: ['Monitor symptoms'],
            longTerm: ['Maintain healthy lifestyle']
          },
          trends: parsed.trends || [],
          alerts: parsed.alerts || []
        };
      }
    } catch (error) {
      console.error('Error parsing predictive health response:', error);
    }

    return {
      riskScore: 0,
      riskLevel: 'low',
      predictions: [],
      recommendations: {
        immediate: ['Consult with healthcare professional for proper evaluation'],
        shortTerm: ['Monitor your health regularly'],
        longTerm: ['Maintain healthy lifestyle habits']
      },
      trends: [],
      alerts: []
    };
  }

  private parseTrendAnalysisResponse(text: string): TrendAnalysis {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'Trend analysis completed',
          trends: parsed.trends || [],
          insights: parsed.insights || [],
          recommendations: parsed.recommendations || ['Continue monitoring your health metrics']
        };
      }
    } catch (error) {
      console.error('Error parsing trend analysis response:', error);
    }

    return {
      summary: 'Unable to analyze trends at this time',
      trends: [],
      insights: ['Insufficient data for trend analysis'],
      recommendations: ['Continue collecting health data for better insights']
    };
  }

  private buildPrescriptionAnalysisPrompt(request: PrescriptionAnalysisRequest): string {
    return `
      You are an expert pharmacist and medical AI assistant analyzing a prescription image.
      Please perform a comprehensive analysis of the uploaded prescription image.

      PATIENT CONTEXT:
      ${request.patientSymptoms ? `Current Symptoms: ${request.patientSymptoms.join(', ')}` : ''}
      ${request.currentMedications ? `Current Medications: ${request.currentMedications.join(', ')}` : ''}
      ${request.allergies ? `Known Allergies: ${request.allergies.join(', ')}` : ''}
      ${request.medicalHistory ? `Medical History: ${request.medicalHistory}` : ''}

      Please analyze the prescription image and provide your response in the following JSON format:
      {
        "medications": [
          {
            "name": "medication name",
            "dosage": "dosage amount and unit",
            "frequency": "how often to take",
            "duration": "treatment duration if specified",
            "instructions": "specific instructions for taking"
          }
        ],
        "interactions": [
          {
            "type": "drug-drug|drug-allergy|drug-condition",
            "severity": "mild|moderate|severe|contraindicated",
            "description": "description of the interaction",
            "recommendation": "what to do about it"
          }
        ],
        "sideEffects": [
          {
            "medication": "medication name",
            "commonEffects": ["common side effect 1", "common side effect 2"],
            "seriousEffects": ["serious side effect 1", "serious side effect 2"]
          }
        ],
        "compliance": {
          "instructions": ["instruction 1", "instruction 2"],
          "warnings": ["warning 1", "warning 2"],
          "monitoring": ["what to monitor 1", "what to monitor 2"]
        },
        "imageQuality": "excellent|good|fair|poor",
        "readabilityIssues": ["issue 1", "issue 2"],
        "disclaimer": "Important medical disclaimer"
      }

      ANALYSIS REQUIREMENTS:
      1. **Medication Extraction**: Carefully read all medication names, dosages, frequencies, and instructions
      2. **Drug Interactions**: Check for interactions with current medications and known allergies
      3. **Side Effects**: List common and serious side effects for each medication
      4. **Compliance Guidelines**: Provide clear instructions for proper medication adherence
      5. **Image Quality Assessment**: Evaluate the clarity and readability of the prescription
      6. **Safety Warnings**: Highlight any critical safety concerns or contraindications

      IMPORTANT GUIDELINES:
      - If the image quality is poor, mention specific readability issues
      - Always include appropriate medical disclaimers
      - Prioritize patient safety in all recommendations
      - Be thorough but conservative in assessments
      - Recommend consulting pharmacist or doctor for clarification if needed
      - Include monitoring requirements for medications that need it
    `;
  }

  private parsePrescriptionAnalysisResponse(text: string): PrescriptionAnalysisResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          medications: parsed.medications || [],
          interactions: parsed.interactions || [],
          sideEffects: parsed.sideEffects || [],
          compliance: parsed.compliance || {
            instructions: ['Follow prescription instructions carefully'],
            warnings: ['Consult healthcare provider if you experience side effects'],
            monitoring: ['Monitor for any adverse reactions']
          },
          imageQuality: parsed.imageQuality || 'fair',
          readabilityIssues: parsed.readabilityIssues || [],
          disclaimer: parsed.disclaimer || 'This analysis is for informational purposes only. Always consult with your healthcare provider or pharmacist for medical advice.'
        };
      }
    } catch (error) {
      console.error('Error parsing prescription analysis JSON response:', error);
    }

    // Fallback parsing if JSON extraction fails
    return {
      medications: [],
      interactions: [],
      sideEffects: [],
      compliance: {
        instructions: ['Follow prescription instructions carefully'],
        warnings: ['Consult healthcare provider if you experience side effects'],
        monitoring: ['Monitor for any adverse reactions']
      },
      imageQuality: 'poor',
      readabilityIssues: ['Unable to parse prescription clearly'],
      disclaimer: 'This analysis is for informational purposes only. Always consult with your healthcare provider or pharmacist for medical advice.'
    };
  }
}

export const geminiHealthService = new GeminiHealthService();