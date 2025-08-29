import { ConversationDataCollector, DataCompleteness } from './conversationDataCollector';
import type { FullDiagnosticRequest } from './geminiService';

export interface DiagnosticTriggerResult {
  shouldTrigger: boolean;
  completeness: DataCompleteness;
  summary: string;
  confidence: number;
  recommendedAction: 'collect_more' | 'confirm_generation' | 'generate_now';
  missingCriticalFields: string[];
}

export class DiagnosticCompletenessDetector {
  private dataCollector: ConversationDataCollector;
  private lastCheckTimestamp: number = 0;
  private checkCooldown: number = 30000; // 30 seconds between checks
  private messagesSinceLastCheck: number = 0;
  private minMessagesForCheck: number = 3; // Minimum messages before checking

  constructor(dataCollector: ConversationDataCollector) {
    this.dataCollector = dataCollector;
  }

  /**
   * Check if we should trigger diagnostic report generation
   * This matches the validation logic from NewDiagnostic component
   */
  shouldTriggerDiagnostic(): DiagnosticTriggerResult {
    const now = Date.now();
    
    // Respect cooldown period to avoid spam
    if (now - this.lastCheckTimestamp < this.checkCooldown) {
      return this.createNegativeResult('Cooldown period active');
    }

    // Need minimum messages for meaningful analysis
    if (this.messagesSinceLastCheck < this.minMessagesForCheck) {
      return this.createNegativeResult('Insufficient conversation data');
    }

    const completeness = this.dataCollector.checkCompleteness();
    const diagnosticData = this.dataCollector.getDiagnosticData();
    
    // Calculate confidence based on data quality and completeness
    const confidence = this.calculateConfidence(completeness, diagnosticData);
    
    // Determine if we have enough data (matching NewDiagnostic validation)
    const hasMinimumRequiredData = this.validateMinimumRequirements(completeness);
    const hasHighQualityData = this.validateDataQuality(diagnosticData);
    
    let shouldTrigger = false;
    let recommendedAction: 'collect_more' | 'confirm_generation' | 'generate_now' = 'collect_more';
    
    if (hasMinimumRequiredData && hasHighQualityData && confidence >= 0.8) {
      shouldTrigger = true;
      recommendedAction = 'confirm_generation';
    } else if (hasMinimumRequiredData && confidence >= 0.6) {
      shouldTrigger = true;
      recommendedAction = 'confirm_generation';
    } else if (completeness.completenessScore >= 70) {
      recommendedAction = 'confirm_generation';
    }

    const missingCriticalFields = this.identifyMissingCriticalFields(completeness);
    
    this.lastCheckTimestamp = now;
    this.messagesSinceLastCheck = 0;
    
    return {
      shouldTrigger,
      completeness,
      summary: this.dataCollector.getSummary(),
      confidence,
      recommendedAction,
      missingCriticalFields
    };
  }

  /**
   * Validate minimum requirements (matching NewDiagnostic validation)
   */
  private validateMinimumRequirements(completeness: DataCompleteness): boolean {
    // At minimum, we need symptoms described
    if (!completeness.hasSymptoms) {
      return false;
    }

    // For full diagnostic, we should have at least symptoms + one temporal/severity indicator
    return completeness.hasDuration || completeness.hasSeverity;
  }

  /**
   * Validate data quality
   */
  private validateDataQuality(diagnosticData: FullDiagnosticRequest): boolean {
    // Check if symptoms are meaningful (not just single words)
    const hasDetailedSymptoms = diagnosticData.symptoms.some((symptom: string) => 
      symptom.split(' ').length >= 2
    );

    // Check if we have contextual information
    const hasContext = diagnosticData.additionalInfo && 
      diagnosticData.additionalInfo.length > 20;

    return Boolean(hasDetailedSymptoms) || Boolean(hasContext);
  }

  /**
   * Calculate confidence score based on data completeness and quality
   */
  private calculateConfidence(completeness: DataCompleteness, diagnosticData: FullDiagnosticRequest): number {
    let confidence = 0;

    // Base confidence from completeness score
    confidence += completeness.completenessScore * 0.6 / 100;

    // Bonus for detailed symptoms
    const avgSymptomLength = diagnosticData.symptoms.reduce(
      (acc: number, symptom: string) => acc + symptom.length, 0
    ) / Math.max(diagnosticData.symptoms.length, 1);
    
    if (avgSymptomLength > 15) confidence += 0.2;
    if (avgSymptomLength > 30) confidence += 0.1;

    // Bonus for additional context
    if (diagnosticData.additionalInfo && diagnosticData.additionalInfo.length > 50) {
      confidence += 0.1;
    }

    // Bonus for additional context
    if (diagnosticData.duration && diagnosticData.duration.length > 0) confidence += 0.05;
    if (diagnosticData.severity && diagnosticData.severity.length > 0) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  /**
   * Identify missing critical fields
   */
  private identifyMissingCriticalFields(completeness: DataCompleteness): string[] {
    const missing: string[] = [];
    
    if (!completeness.hasSymptoms) {
      missing.push('symptoms description');
    }
    
    if (!completeness.hasDuration && !completeness.hasSeverity) {
      missing.push('duration or severity information');
    }
    
    return missing;
  }

  /**
   * Create a negative result when conditions aren't met
   */
  private createNegativeResult(): DiagnosticTriggerResult {
    const completeness = this.dataCollector.checkCompleteness();
    
    return {
      shouldTrigger: false,
      completeness,
      summary: this.dataCollector.getSummary(),
      confidence: 0,
      recommendedAction: 'collect_more',
      missingCriticalFields: this.identifyMissingCriticalFields(completeness)
    };
  }

  /**
   * Get user-friendly message about what's needed
   */
  getCollectionGuidance(result: DiagnosticTriggerResult): string {
    if (result.missingCriticalFields.length === 0) {
      return "We have enough information to generate your diagnostic report.";
    }

    const missing = result.missingCriticalFields;
    let guidance = "To generate a comprehensive diagnostic report, I still need: ";
    
    if (missing.includes('symptoms description')) {
      guidance += "a detailed description of your symptoms, ";
    }
    
    if (missing.includes('duration or severity information')) {
      guidance += "information about how long you've been experiencing these symptoms or how severe they are, ";
    }
    
    return guidance.replace(/, $/, '.'); // Remove trailing comma
  }

  /**
   * Validate that collected data can be converted to FullDiagnosticRequest
   */
  validateForDiagnosticRequest(): { isValid: boolean; errors: string[] } {
    const data = this.dataCollector.getDiagnosticData();
    const errors: string[] = [];
    
    // Check required fields for FullDiagnosticRequest
    if (!data.symptoms || data.symptoms.length === 0) {
      errors.push('Symptoms are required');
    }
    
    // Validate symptoms are not empty strings
    if (data.symptoms.some(symptom => !symptom.trim())) {
      errors.push('Symptoms cannot be empty');
    }
    
    // Check if we have enough detail for meaningful analysis
    const totalSymptomLength = data.symptoms.join(' ').length;
    if (totalSymptomLength < 10) {
      errors.push('Symptom descriptions need more detail');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const diagnosticCompletenessDetector = new DiagnosticCompletenessDetector(
  // Will be injected when used
  {} as ConversationDataCollector
);