import { agenticDiagnosticService } from './agenticDiagnosticService';
import { GeminiHealthService } from './geminiService';
import type { FullDiagnosticRequest, FullDiagnosticResponse } from './geminiService';
import { db } from '@/lib/db';
import { healthReports, aiConsultations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface AutomaticDiagnosticResult {
  success: boolean;
  reportId?: string;
  diagnosticResponse?: FullDiagnosticResponse;
  error?: string;
  userNotification: string;
  processingTime: number;
}

export interface DiagnosticReportGenerationContext {
  consultationId: string;
  userId: string;
  aiProviderId: string;
  aiProviderName: string;
  aiProviderSpecialty: string;
  reasonForVisit: string;
  patientAge?: number;
  patientGender?: string;
  messages: Array<{
    senderType: string;
    content: string;
    timestamp: string;
  }>;
}

export class AutomaticDiagnosticReportService {
  private geminiService: GeminiHealthService;
  private isGenerating: Map<string, boolean> = new Map();

  constructor() {
    this.geminiService = new GeminiHealthService();
  }

  /**
   * Check if automatic diagnostic report should be triggered
   * This is called by AI providers during conversation
   */
  async checkAndTriggerAutomaticReport(
    context: DiagnosticReportGenerationContext
  ): Promise<AutomaticDiagnosticResult> {
    const startTime = Date.now();
    
    try {
      // Prevent duplicate generation for the same consultation
      if (this.isGenerating.get(context.consultationId)) {
        return {
          success: false,
          error: 'Report generation already in progress',
          userNotification: 'A diagnostic report is already being generated for this consultation.',
          processingTime: Date.now() - startTime
        };
      }

      // Check if automatic diagnostic should be triggered
      const triggerResult = await agenticDiagnosticService.shouldTriggerAutomaticDiagnostic(
        context.messages,
        {
          reasonForVisit: context.reasonForVisit,
          aiProviderSpecialty: context.aiProviderSpecialty,
          patientAge: context.patientAge,
          patientGender: context.patientGender
        }
      );

      if (!triggerResult.shouldTrigger) {
        return {
          success: false,
          error: triggerResult.triggerReason,
          userNotification: '',
          processingTime: Date.now() - startTime
        };
      }

      // Mark as generating
      this.isGenerating.set(context.consultationId, true);

      try {
        // Generate the diagnostic report
        const reportResult = await this.generateAutomaticDiagnosticReport(
          context,
          triggerResult.diagnosticData,
          triggerResult.confidence
        );

        return {
          success: true,
          reportId: reportResult.reportId,
          diagnosticResponse: reportResult.diagnosticResponse,
          userNotification: triggerResult.userNotification,
          processingTime: Date.now() - startTime
        };
      } finally {
        // Always clear the generating flag
        this.isGenerating.delete(context.consultationId);
      }
    } catch (error) {
      console.error('Error in automatic diagnostic report generation:', error);
      this.isGenerating.delete(context.consultationId);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        userNotification: 'I apologize, but there was an error generating your diagnostic report. Please try again.',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Generate the actual diagnostic report
   */
  private async generateAutomaticDiagnosticReport(
    context: DiagnosticReportGenerationContext,
    diagnosticData: FullDiagnosticRequest,
    confidence: number
  ): Promise<{
    reportId: string;
    diagnosticResponse: FullDiagnosticResponse;
  }> {
    try {
      // Enhance diagnostic data with conversation context
      const enhancedDiagnosticData = this.enhanceDiagnosticData(
        diagnosticData,
        context
      );

      // Generate comprehensive diagnostic analysis using Gemini
      const diagnosticResponse = await this.geminiService.analyzeFullDiagnostic(
        enhancedDiagnosticData
      );

      // Save the report to database
      const reportId = await this.saveDiagnosticReport(
        context,
        diagnosticResponse,
        confidence
      );

      // Update consultation status
      await this.updateConsultationWithReport(
        context.consultationId,
        reportId,
        diagnosticResponse
      );

      return {
        reportId,
        diagnosticResponse
      };
    } catch (error) {
      console.error('Error generating automatic diagnostic report:', error);
      throw new Error('Failed to generate diagnostic report');
    }
  }

  /**
   * Enhance diagnostic data with conversation context
   */
  private enhanceDiagnosticData(
    diagnosticData: FullDiagnosticRequest,
    context: DiagnosticReportGenerationContext
  ): FullDiagnosticRequest {
    // Extract additional context from conversation
    const conversationSummary = this.extractConversationSummary(context.messages);
    const aiProviderInsights = this.extractAIProviderInsights(context.messages);
    
    return {
      ...diagnosticData,
      additionalInfo: [
        diagnosticData.additionalInfo || '',
        `\n\nCONSULTATION CONTEXT:`,
        `- Consultation with ${context.aiProviderName} (${context.aiProviderSpecialty})`,
        `- Reason for visit: ${context.reasonForVisit}`,
        `- Patient age: ${context.patientAge || 'Not specified'}`,
        `- Patient gender: ${context.patientGender || 'Not specified'}`,
        `\nCONVERSATION SUMMARY:`,
        conversationSummary,
        `\nAI PROVIDER INSIGHTS:`,
        aiProviderInsights
      ].filter(Boolean).join('\n')
    };
  }

  /**
   * Extract conversation summary from messages
   */
  private extractConversationSummary(
    messages: Array<{
      senderType: string;
      content: string;
      timestamp: string;
    }>
  ): string {
    const userMessages = messages
      .filter(msg => msg.senderType === 'patient' || msg.senderType === 'user')
      .map(msg => msg.content)
      .join(' ');
    
    // Extract key information patterns
    const keyPoints = [];
    
    // Look for symptom descriptions
    if (userMessages.toLowerCase().includes('pain')) {
      keyPoints.push('Patient reported pain symptoms');
    }
    
    // Look for duration mentions
    const durationMatch = userMessages.match(/(\d+)\s*(day|week|month|year)s?/i);
    if (durationMatch) {
      keyPoints.push(`Symptoms duration: ${durationMatch[0]}`);
    }
    
    // Look for severity mentions
    const severityWords = ['mild', 'moderate', 'severe', 'intense', 'unbearable'];
    const severityMention = severityWords.find(word => 
      userMessages.toLowerCase().includes(word)
    );
    if (severityMention) {
      keyPoints.push(`Severity described as: ${severityMention}`);
    }
    
    return keyPoints.length > 0 ? 
      keyPoints.join('; ') : 
      'Patient provided detailed symptom information during consultation';
  }

  /**
   * Extract AI provider insights from messages
   */
  private extractAIProviderInsights(
    messages: Array<{
      senderType: string;
      content: string;
      timestamp: string;
    }>
  ): string {
    const aiMessages = messages
      .filter(msg => msg.senderType === 'ai' || msg.senderType === 'ai_provider')
      .map(msg => msg.content)
      .join(' ');
    
    // Extract key insights from AI responses
    const insights = [];
    
    // Look for assessment mentions
    if (aiMessages.toLowerCase().includes('assess')) {
      insights.push('AI provider conducted symptom assessment');
    }
    
    // Look for recommendation mentions
    if (aiMessages.toLowerCase().includes('recommend')) {
      insights.push('AI provider provided recommendations');
    }
    
    // Look for follow-up mentions
    if (aiMessages.toLowerCase().includes('follow')) {
      insights.push('AI provider suggested follow-up care');
    }
    
    return insights.length > 0 ? 
      insights.join('; ') : 
      'AI provider conducted comprehensive consultation';
  }

  /**
   * Save diagnostic report to database
   */
  private async saveDiagnosticReport(
    context: DiagnosticReportGenerationContext,
    diagnosticResponse: FullDiagnosticResponse,
    confidence: number
  ): Promise<string> {
    try {
      const reportData = {
        userId: context.userId,
        title: `Diagnostic Report - ${context.reasonForVisit}`,
        symptoms: agenticDiagnosticService.getDiagnosticData().symptoms,
        aiAnalysis: {
          analysis: diagnosticResponse.analysis,
          possibleConditions: diagnosticResponse.possibleConditions,
          recommendations: diagnosticResponse.recommendations,
          confidence: confidence,
          generatedBy: 'automatic_agentic_system',
          aiProvider: {
            id: context.aiProviderId,
            name: context.aiProviderName,
            specialty: context.aiProviderSpecialty
          },
          conversationSummary: agenticDiagnosticService.getConversationSummary(),
          generationMethod: 'automatic',
          diagnosticType: 'full'
        },
        riskLevel: parseInt(diagnosticResponse.urgencyLevel) === 1 ? 'low' : parseInt(diagnosticResponse.urgencyLevel) === 2 ? 'medium' : 'high',
        confidence: confidence.toString(),
        recommendations: diagnosticResponse.recommendations,
        urgencyLevel: parseInt(diagnosticResponse.urgencyLevel) || 1,
        followUpRequired: parseInt(diagnosticResponse.urgencyLevel) >= 2,
        doctorRecommended: parseInt(diagnosticResponse.urgencyLevel) >= 3
      };

      const result = await db
        .insert(healthReports)
        .values([reportData])
        .returning({ id: healthReports.id });

      return result[0].id;
    } catch (error) {
      console.error('Error saving diagnostic report:', error);
      throw new Error('Failed to save diagnostic report');
    }
  }

  /**
   * Update consultation with report information
   */
  private async updateConsultationWithReport(
    consultationId: string,
    reportId: string,
    diagnosticResponse: FullDiagnosticResponse
  ): Promise<void> {
    try {
      await db
        .update(aiConsultations)
        .set({
          aiAssessment: diagnosticResponse.analysis,
          status: 'completed',
          updatedAt: new Date(),
          // Add report reference to metadata if needed
        })
        .where(eq(aiConsultations.id, consultationId));
    } catch (error) {
      console.error('Error updating consultation with report:', error);
      // Don't throw here as the report was already saved successfully
    }
  }
}

// Export singleton instance
export const automaticDiagnosticReportService = new AutomaticDiagnosticReportService();