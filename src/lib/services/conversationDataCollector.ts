import { FullDiagnosticRequest } from './geminiService';

export interface DiagnosticData {
  symptoms: string[];
  duration?: string;
  severity?: string;
  additionalInfo?: string;
  medicalHistory?: string[];
  currentMedications?: string[];
  allergies?: string[];
  age?: number;
  gender?: string;
}

export interface TimingData {
  conversationStartTime?: Date;
  lastUserMessageTime?: Date;
  userResponseTimes: number[]; // Array of response times in milliseconds
  isWithinTimeWindow: boolean;
  requiresConfirmation: boolean;
}

export interface DataCompleteness {
  hasSymptoms: boolean;
  hasDuration: boolean;
  hasSeverity: boolean;
  hasAdditionalInfo: boolean;
  completenessScore: number;
  isComplete: boolean;
  missingFields: string[];
}

export class ConversationDataCollector {
  private diagnosticData: DiagnosticData = {
    symptoms: [],
    medicalHistory: [],
    currentMedications: [],
    allergies: []
  };

  private timingData: TimingData = {
    userResponseTimes: [],
    isWithinTimeWindow: true,
    requiresConfirmation: false
  };

  private readonly CONVERSATION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  private readonly QUICK_RESPONSE_THRESHOLD_MS = 7 * 60 * 1000; // 7 minutes

  private symptomKeywords = [
    'pain', 'ache', 'hurt', 'sore', 'headache', 'fever', 'nausea', 'vomit', 'dizzy',
    'tired', 'fatigue', 'cough', 'sneeze', 'runny nose', 'congestion', 'rash',
    'itch', 'swelling', 'bruise', 'cut', 'burn', 'bleed', 'shortness of breath',
    'chest pain', 'stomach ache', 'back pain', 'joint pain', 'muscle pain',
    'anxiety', 'depression', 'stress', 'insomnia', 'sleep', 'appetite'
  ];

  private durationKeywords = {
    'less-than-day': ['today', 'this morning', 'few hours', 'since today', 'started today'],
    '1-3-days': ['yesterday', 'couple days', 'few days', '2 days', '3 days', 'since yesterday'],
    '1-week': ['week', 'last week', 'about a week', 'for a week', '7 days'],
    '1-month': ['month', 'last month', 'about a month', 'for a month', '30 days'],
    'more-than-month': ['months', 'several months', 'long time', 'chronic', 'ongoing']
  };

  private severityKeywords = {
    'mild': ['mild', 'slight', 'little', 'barely', 'minor', 'light'],
    'moderate': ['moderate', 'noticeable', 'manageable', 'medium', 'okay'],
    'severe': ['severe', 'bad', 'terrible', 'awful', 'intense', 'strong', 'significant'],
    'extreme': ['extreme', 'unbearable', 'excruciating', 'worst', 'can\'t handle']
  };

  /**
   * Initialize conversation timing
   */
  initializeConversation(startTime?: Date): void {
    this.timingData.conversationStartTime = startTime || new Date();
    this.timingData.isWithinTimeWindow = true;
    this.timingData.userResponseTimes = [];
    this.timingData.lastUserMessageTime = undefined;
    this.timingData.requiresConfirmation = false;
  }

  /**
   * Check if conversation is within the 30-minute window
   */
  private isConversationValid(): boolean {
    if (!this.timingData.conversationStartTime) {
      return false;
    }

    const now = new Date();
    const timeDiff = now.getTime() - this.timingData.conversationStartTime.getTime();
    this.timingData.isWithinTimeWindow = timeDiff <= this.CONVERSATION_TIMEOUT_MS;
    
    return this.timingData.isWithinTimeWindow;
  }

  /**
   * Check if user response was too quick (under 7 minutes)
   */
  private isQuickResponse(): boolean {
    if (!this.timingData.lastUserMessageTime) {
      return false;
    }

    const now = new Date();
    const responseTime = now.getTime() - this.timingData.lastUserMessageTime.getTime();
    this.timingData.userResponseTimes.push(responseTime);
    
    return responseTime < this.QUICK_RESPONSE_THRESHOLD_MS;
  }

  /**
   * Process a new message and extract diagnostic information
   */
  processMessage(message: string, senderType: string, messageTime?: Date): { shouldConfirm: boolean; reason?: string } {
    // Only process user messages
    if (senderType !== 'user' && senderType !== 'patient') {
      return { shouldConfirm: false };
    }

    // Check if conversation is still valid (within 30 minutes)
    if (!this.isConversationValid()) {
      return { 
        shouldConfirm: false, 
        reason: 'Conversation has exceeded 30-minute time limit. Diagnostic collection is disabled for older conversations.' 
      };
    }

    const currentTime = messageTime || new Date();
    
    // Check for quick response if this isn't the first message
    const isQuick = this.isQuickResponse();
    this.timingData.lastUserMessageTime = currentTime;

    // If response is too quick, require confirmation
    if (isQuick) {
      this.timingData.requiresConfirmation = true;
      return { 
        shouldConfirm: true, 
        reason: 'Your response was very quick (under 7 minutes). Would you like to add this information to your diagnostic data?' 
      };
    }

    // Process the message normally
    this.extractDiagnosticInfo(message);
    
    return { shouldConfirm: false };
  }

  /**
   * Process message after user confirmation (for quick responses)
   */
  processConfirmedMessage(message: string): void {
    this.extractDiagnosticInfo(message);
    this.timingData.requiresConfirmation = false;
  }

  /**
   * Extract diagnostic information from message
   */
  private extractDiagnosticInfo(message: string): void {
    const lowerMessage = message.toLowerCase();
    
    // Extract symptoms
    this.extractSymptoms(lowerMessage);
    
    // Extract duration
    this.extractDuration(lowerMessage);
    
    // Extract severity
    this.extractSeverity(lowerMessage);
    
    // Extract additional medical information
    this.extractMedicalInfo(lowerMessage);
    
    // Store as additional info if it contains relevant medical context
    if (this.containsMedicalContext(lowerMessage)) {
      if (!this.diagnosticData.additionalInfo) {
        this.diagnosticData.additionalInfo = message;
      } else {
        this.diagnosticData.additionalInfo += ' ' + message;
      }
    }
  }

  /**
   * Extract symptoms from message text
   */
  private extractSymptoms(message: string): void {
    const foundSymptoms: string[] = [];
    
    this.symptomKeywords.forEach(keyword => {
      if (message.includes(keyword)) {
        // Extract context around the symptom
        const words = message.split(' ');
        const keywordIndex = words.findIndex(word => word.includes(keyword));
        
        if (keywordIndex !== -1) {
          // Get 2 words before and after for context
          const start = Math.max(0, keywordIndex - 2);
          const end = Math.min(words.length, keywordIndex + 3);
          const symptomPhrase = words.slice(start, end).join(' ');
          
          if (!this.diagnosticData.symptoms.some(s => s.includes(keyword))) {
            foundSymptoms.push(symptomPhrase);
          }
        }
      }
    });
    
    this.diagnosticData.symptoms.push(...foundSymptoms);
  }

  /**
   * Extract duration information
   */
  private extractDuration(message: string): void {
    if (this.diagnosticData.duration) return; // Already found
    
    for (const [duration, keywords] of Object.entries(this.durationKeywords)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        this.diagnosticData.duration = duration;
        break;
      }
    }
  }

  /**
   * Extract severity information
   */
  private extractSeverity(message: string): void {
    if (this.diagnosticData.severity) return; // Already found
    
    for (const [severity, keywords] of Object.entries(this.severityKeywords)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        this.diagnosticData.severity = severity;
        break;
      }
    }
  }

  /**
   * Extract medical history, medications, and allergies
   */
  private extractMedicalInfo(message: string): void {
    // Medical history keywords
    const historyKeywords = ['history', 'diagnosed', 'condition', 'disease', 'illness'];
    if (historyKeywords.some(keyword => message.includes(keyword))) {
      if (!this.diagnosticData.medicalHistory?.includes(message)) {
        this.diagnosticData.medicalHistory?.push(message);
      }
    }
    
    // Medication keywords
    const medicationKeywords = ['taking', 'medication', 'medicine', 'pill', 'drug', 'prescription'];
    if (medicationKeywords.some(keyword => message.includes(keyword))) {
      if (!this.diagnosticData.currentMedications?.includes(message)) {
        this.diagnosticData.currentMedications?.push(message);
      }
    }
    
    // Allergy keywords
    const allergyKeywords = ['allergic', 'allergy', 'allergies', 'reaction'];
    if (allergyKeywords.some(keyword => message.includes(keyword))) {
      if (!this.diagnosticData.allergies?.includes(message)) {
        this.diagnosticData.allergies?.push(message);
      }
    }
  }

  /**
   * Check if message contains medical context
   */
  private containsMedicalContext(message: string): boolean {
    const medicalKeywords = [
      'symptom', 'feel', 'pain', 'hurt', 'sick', 'unwell', 'doctor', 'hospital',
      'treatment', 'medicine', 'health', 'medical', 'diagnosis', 'condition'
    ];
    
    return medicalKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check data completeness based on existing validation rules
   */
  checkCompleteness(): DataCompleteness {
    const hasSymptoms = this.diagnosticData.symptoms.length > 0;
    const hasDuration = !!this.diagnosticData.duration;
    const hasSeverity = !!this.diagnosticData.severity;
    const hasAdditionalInfo = !!this.diagnosticData.additionalInfo;
    
    const missingFields: string[] = [];
    if (!hasSymptoms) missingFields.push('symptoms');
    if (!hasDuration) missingFields.push('duration');
    if (!hasSeverity) missingFields.push('severity');
    
    // Calculate completeness score (symptoms is required, others are optional but recommended)
    let score = 0;
    if (hasSymptoms) score += 40; // Symptoms are most important
    if (hasDuration) score += 25;
    if (hasSeverity) score += 25;
    if (hasAdditionalInfo) score += 10;
    
    // Consider complete if we have symptoms and at least one other field
    const isComplete = hasSymptoms && (hasDuration || hasSeverity);
    
    return {
      hasSymptoms,
      hasDuration,
      hasSeverity,
      hasAdditionalInfo,
      completenessScore: score,
      isComplete,
      missingFields
    };
  }

  /**
   * Get current diagnostic data
   */
  getDiagnosticData(): DiagnosticData {
    return { ...this.diagnosticData };
  }

  /**
   * Convert to FullDiagnosticRequest format
   */
  toFullDiagnosticRequest(): FullDiagnosticRequest {
    return {
      symptoms: this.diagnosticData.symptoms,
      duration: this.diagnosticData.duration,
      severity: this.diagnosticData.severity,
      additionalInfo: this.diagnosticData.additionalInfo
    };
  }

  /**
   * Get timing data
   */
  getTimingData(): TimingData {
    return { ...this.timingData };
  }

  /**
   * Check if conversation is within time window
   */
  isWithinTimeWindow(): boolean {
    return this.isConversationValid();
  }

  /**
   * Check if confirmation is required for current message
   */
  requiresConfirmation(): boolean {
    return this.timingData.requiresConfirmation;
  }

  /**
   * Reset collected data
   */
  reset(): void {
    this.diagnosticData = {
      symptoms: [],
      medicalHistory: [],
      currentMedications: [],
      allergies: []
    };
    
    this.timingData = {
      userResponseTimes: [],
      isWithinTimeWindow: true,
      requiresConfirmation: false
    };
  }

  /**
   * Get a summary of collected data for user confirmation
   */
  getSummary(): string {
    const data = this.diagnosticData;
    let summary = '';
    
    if (data.symptoms.length > 0) {
      summary += `Symptoms: ${data.symptoms.join(', ')}\n`;
    }
    
    if (data.duration) {
      summary += `Duration: ${data.duration}\n`;
    }
    
    if (data.severity) {
      summary += `Severity: ${data.severity}\n`;
    }
    
    if (data.additionalInfo) {
      summary += `Additional Information: ${data.additionalInfo}\n`;
    }
    
    return summary || 'No diagnostic information collected yet.';
  }
}

// Export singleton instance
export const conversationDataCollector = new ConversationDataCollector();