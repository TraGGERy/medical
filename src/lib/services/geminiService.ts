import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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



export class GeminiHealthService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  private visionModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  async analyzeSymptoms(request: HealthAnalysisRequest): Promise<HealthAnalysisResponse> {
    try {
      const prompt = this.buildHealthAnalysisPrompt(request);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseHealthAnalysisResponse(text);
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
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
      const parts: any[] = [{ text: prompt }];
      
      // Add images to the request
      if (request.uploadedFiles) {
        for (const file of request.uploadedFiles) {
          if (file.isImage && file.base64) {
            parts.push({
              inline_data: {
                mime_type: file.type,
                data: file.base64
              }
            });
          }
        }
      }

      const result = await this.visionModel.generateContent(parts);
      const response = await result.response;
      const text = response.text();

      return this.parseFullDiagnosticResponse(text);
    } catch (error) {
      console.error('Error in vision analysis:', error);
      throw error;
    }
  }

  private async analyzeWithText(request: FullDiagnosticRequest): Promise<FullDiagnosticResponse> {
    try {
      const prompt = this.buildFullDiagnosticPrompt(request);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseFullDiagnosticResponse(text);
    } catch (error) {
      console.error('Error in text analysis:', error);
      throw error;
    }
  }

  async chatWithAssistant(message: string, userMedicalHistory?: string): Promise<string> {
    try {
      const systemPrompt = this.buildChatSystemPrompt(userMedicalHistory);
      const prompt = `${systemPrompt}\n\nUser: ${message}\n\nPlease provide a helpful, accurate, and empathetic response:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error in chat:', error);
      throw new Error('Failed to get response from AI assistant. Please try again.');
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

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseHealthReportResponse(text);
    } catch (error) {
      console.error('Error generating health report:', error);
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
          fileContext += `[Medical Image - Please analyze the visual content in relation to the symptoms]\n`;
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
      - Always emphasize the need for professional medical consultation
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
}

export const geminiHealthService = new GeminiHealthService();