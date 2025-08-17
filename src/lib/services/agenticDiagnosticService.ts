import { ConversationDataCollector } from './conversationDataCollector';
import { DiagnosticCompletenessDetector } from './diagnosticCompletenessDetector';
import { GeminiHealthService } from './geminiService';
import type { FullDiagnosticRequest } from './geminiService';

export interface ConversationCompletionAnalysis {
  isComplete: boolean;
  confidence: number;
  reasoning: string;
  completionIndicators: string[];
  missingElements: string[];
  recommendedAction: 'continue_conversation' | 'generate_report' | 'ask_clarifying_questions';
  diagnosticReadiness: {
    hasSymptoms: boolean;
    hasDuration: boolean;
    hasSeverity: boolean;
    hasContext: boolean;
    completenessScore: number;
  };
}

export interface AgenticDiagnosticTrigger {
  shouldTrigger: boolean;
  triggerReason: string;
  userNotification: string;
  diagnosticData: FullDiagnosticRequest;
  confidence: number;
}

export class AgenticDiagnosticService {
  private dataCollector: ConversationDataCollector;
  private completenessDetector: DiagnosticCompletenessDetector;
  private geminiService: GeminiHealthService;
  private conversationStartTime: number;
  private lastAnalysisTime: number = 0;
  private analysisInterval: number = 60000; // 1 minute between analyses

  constructor() {
    this.dataCollector = new ConversationDataCollector();
    this.completenessDetector = new DiagnosticCompletenessDetector(this.dataCollector);
    this.geminiService = new GeminiHealthService();
    this.conversationStartTime = Date.now();
  }

  /**
   * Analyze conversation completion using AI-powered analysis
   * This is the core agentic function that determines if a consultation is complete
   */
  async analyzeConversationCompletion(
    messages: Array<{
      senderType: string;
      content: string;
      timestamp: string;
    }>,
    consultationContext: {
      reasonForVisit: string;
      aiProviderSpecialty: string;
      patientAge?: number;
      patientGender?: string;
    }
  ): Promise<ConversationCompletionAnalysis> {
    try {
      // Process messages for diagnostic data collection
      this.processMessagesForDiagnostic(messages);
      
      // Get current diagnostic completeness
      const completeness = this.dataCollector.checkCompleteness();
      
      // Build AI prompt for conversation completion analysis
      const analysisPrompt = this.buildCompletionAnalysisPrompt(
        messages,
        consultationContext,
        completeness
      );
      
      // Use Gemini to analyze conversation completion
      const aiAnalysis = await this.geminiService.chatWithAssistant(analysisPrompt);
      
      // Parse AI response
      const analysis = this.parseCompletionAnalysis(aiAnalysis, completeness);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing conversation completion:', error);
      
      // Fallback to rule-based analysis
      return this.fallbackCompletionAnalysis(messages, consultationContext);
    }
  }

  /**
   * Determine if diagnostic report should be automatically triggered
   */
  async shouldTriggerAutomaticDiagnostic(
    messages: Array<{
      senderType: string;
      content: string;
      timestamp: string;
    }>,
    consultationContext: {
      reasonForVisit: string;
      aiProviderSpecialty: string;
      patientAge?: number;
      patientGender?: string;
    }
  ): Promise<AgenticDiagnosticTrigger> {
    const now = Date.now();
    
    // Respect analysis interval to avoid spam
    if (now - this.lastAnalysisTime < this.analysisInterval) {
      return {
        shouldTrigger: false,
        triggerReason: 'Analysis interval not met',
        userNotification: '',
        diagnosticData: {} as FullDiagnosticRequest,
        confidence: 0
      };
    }
    
    this.lastAnalysisTime = now;
    
    // Analyze conversation completion
    const completionAnalysis = await this.analyzeConversationCompletion(
      messages,
      consultationContext
    );
    
    // Check if conversation is complete and diagnostic data is ready
    if (completionAnalysis.isComplete && 
        completionAnalysis.recommendedAction === 'generate_report' &&
        completionAnalysis.confidence >= 0.7) {
      
      const diagnosticData = this.dataCollector.getDiagnosticData();
      
      // Validate diagnostic data quality
      const validation = this.completenessDetector.validateForDiagnosticRequest();
      
      if (validation.isValid) {
        return {
          shouldTrigger: true,
          triggerReason: completionAnalysis.reasoning,
          userNotification: this.generateUserNotification(completionAnalysis),
          diagnosticData,
          confidence: completionAnalysis.confidence
        };
      }
    }
    
    return {
      shouldTrigger: false,
      triggerReason: 'Conversation not complete or data insufficient',
      userNotification: '',
      diagnosticData: {} as FullDiagnosticRequest,
      confidence: completionAnalysis.confidence
    };
  }

  /**
   * Build AI prompt for conversation completion analysis
   */
  private buildCompletionAnalysisPrompt(
    messages: Array<{
      senderType: string;
      content: string;
      timestamp: string;
    }>,
    consultationContext: {
      reasonForVisit: string;
      aiProviderSpecialty: string;
      patientAge?: number;
      patientGender?: string;
    },
    completeness: {hasSymptoms: boolean; hasDuration: boolean; hasSeverity: boolean; hasAdditionalInfo: boolean; completenessScore: number}
  ): string {
    const conversationHistory = messages
      .slice(-10) // Last 10 messages for context
      .map(msg => `${msg.senderType === 'ai' ? 'AI Provider' : 'Patient'}: ${msg.content}`)
      .join('\n');
    
    const conversationDuration = Math.round((Date.now() - this.conversationStartTime) / 60000);
    
    return `
You are an expert medical consultation analyst. Analyze this telemedicine conversation to determine if it's complete and ready for diagnostic report generation.

CONSULTATION CONTEXT:
- Reason for visit: ${consultationContext.reasonForVisit}
- AI Provider specialty: ${consultationContext.aiProviderSpecialty}
- Patient age: ${consultationContext.patientAge || 'Not specified'}
- Patient gender: ${consultationContext.patientGender || 'Not specified'}
- Conversation duration: ${conversationDuration} minutes
- Total messages: ${messages.length}

CONVERSATION HISTORY (Last 10 messages):
${conversationHistory}

DIAGNOSTIC DATA COMPLETENESS:
- Has symptoms: ${completeness.hasSymptoms}
- Has duration: ${completeness.hasDuration}
- Has severity: ${completeness.hasSeverity}
- Has additional info: ${completeness.hasAdditionalInfo}
- Completeness score: ${completeness.completenessScore}%

ANALYSIS CRITERIA:
A consultation is considered COMPLETE when:
1. Patient has described their main symptoms clearly
2. AI provider has gathered sufficient medical history
3. Duration and severity of symptoms are established
4. Patient's questions have been adequately addressed
5. AI provider has provided initial assessment/guidance
6. No urgent follow-up questions are pending
7. Natural conversation conclusion indicators are present

COMPLETION INDICATORS TO LOOK FOR:
- Patient expressing satisfaction with information received
- AI provider summarizing findings/recommendations
- Patient saying "thank you" or indicating they're done
- AI provider asking if there are any other questions
- Natural conversation wind-down patterns
- Patient confirming understanding of next steps

Analyze this conversation and respond with ONLY this JSON format:
{
  "isComplete": boolean,
  "confidence": number (0-1),
  "reasoning": "Brief explanation of why conversation is/isn't complete",
  "completionIndicators": ["list of indicators found"],
  "missingElements": ["list of missing elements if incomplete"],
  "recommendedAction": "continue_conversation|generate_report|ask_clarifying_questions"
}

Be conservative - only mark as complete if you're confident the consultation has reached a natural conclusion with sufficient medical information gathered.`;
  }

  /**
   * Parse AI completion analysis response
   */
  private parseCompletionAnalysis(
    aiResponse: string,
    completeness: {hasSymptoms: boolean; hasDuration: boolean; hasSeverity: boolean; hasAdditionalInfo: boolean; completenessScore: number}
  ): ConversationCompletionAnalysis {
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          isComplete: parsed.isComplete || false,
          confidence: parsed.confidence || 0,
          reasoning: parsed.reasoning || 'AI analysis completed',
          completionIndicators: parsed.completionIndicators || [],
          missingElements: parsed.missingElements || [],
          recommendedAction: parsed.recommendedAction || 'continue_conversation',
          diagnosticReadiness: {
            hasSymptoms: completeness.hasSymptoms,
            hasDuration: completeness.hasDuration,
            hasSeverity: completeness.hasSeverity,
            hasContext: completeness.hasAdditionalInfo,
            completenessScore: completeness.completenessScore
          }
        };
      }
    } catch (error) {
      console.error('Error parsing AI completion analysis:', error);
    }
    
    // Fallback response
    return this.fallbackCompletionAnalysis([], {});
  }

  /**
   * Fallback rule-based completion analysis
   */
  private fallbackCompletionAnalysis(
    messages: Array<{senderType: string; content: string; timestamp: string}>,
    _consultationContext: {reasonForVisit?: string; aiProviderSpecialty?: string; patientAge?: number; patientGender?: string}
  ): ConversationCompletionAnalysis {
    const completeness = this.dataCollector.checkCompleteness();
    const conversationDuration = Date.now() - this.conversationStartTime;
    
    // Simple rule-based analysis
    const hasMinimumMessages = messages.length >= 6;
    const hasMinimumDuration = conversationDuration >= 300000; // 5 minutes
    const hasBasicInfo = completeness.hasSymptoms;
    
    const isComplete = hasMinimumMessages && hasMinimumDuration && hasBasicInfo;
    
    return {
      isComplete,
      confidence: isComplete ? 0.6 : 0.3,
      reasoning: isComplete ? 
        'Basic consultation criteria met through rule-based analysis' :
        'Insufficient conversation data for completion',
      completionIndicators: isComplete ? ['Minimum message count', 'Basic symptoms described'] : [],
      missingElements: isComplete ? [] : ['More conversation needed'],
      recommendedAction: isComplete ? 'generate_report' : 'continue_conversation',
      diagnosticReadiness: {
        hasSymptoms: completeness.hasSymptoms,
        hasDuration: completeness.hasDuration,
        hasSeverity: completeness.hasSeverity,
        hasContext: completeness.hasAdditionalInfo,
        completenessScore: completeness.completenessScore
      }
    };
  }

  /**
   * Generate user notification message
   */
  private generateUserNotification(analysis: ConversationCompletionAnalysis): string {
    return `Thank you for providing detailed information about your symptoms. Based on our conversation, I have gathered sufficient information to generate a comprehensive diagnostic report. Please wait while I analyze all the information you've shared and prepare your personalized health assessment. This may take a few moments...`;
  }

  /**
   * Detect explicit completion indicators in AI response
   */
  private detectExplicitCompletion(aiResponse: string): boolean {
    // Primary trigger phrase for agentic completion
    if (aiResponse.includes('[CONSULTATION_COMPLETE]')) {
      return true;
    }

    // Fallback completion indicators
    const completionIndicators = [
      'consultation is complete',
      'we have covered everything',
      'comprehensive assessment complete',
      'ready for diagnostic report',
      'sufficient information gathered',
      'consultation concluded'
    ];

    return completionIndicators.some(indicator => 
      aiResponse.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  /**
   * Process messages for diagnostic data collection
   */
  private processMessagesForDiagnostic(
    messages: Array<{
      senderType: string;
      content: string;
      timestamp: string;
    }>
  ): void {
    // Process each user message for diagnostic data
    messages
      .filter(msg => msg.senderType === 'patient' || msg.senderType === 'user')
      .forEach(msg => {
        this.dataCollector.processMessage(msg.content, 'user');
      });
  }

  /**
   * Reset the service for a new consultation
   */
  reset(): void {
    this.dataCollector.reset();
    this.completenessDetector.reset();
    this.conversationStartTime = Date.now();
    this.lastAnalysisTime = 0;
  }

  /**
   * Get current diagnostic data
   */
  getDiagnosticData(): FullDiagnosticRequest {
    return this.dataCollector.getDiagnosticData();
  }

  /**
   * Get conversation summary
   */
  getConversationSummary(): string {
    return this.dataCollector.getSummary();
  }
}

// Export singleton instance
export const agenticDiagnosticService = new AgenticDiagnosticService();