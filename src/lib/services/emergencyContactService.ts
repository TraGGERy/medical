'use client';

// Emergency Contact Management Service for MediScope AI
// Handles emergency contacts, notifications, and alert protocols

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: 'spouse' | 'parent' | 'child' | 'sibling' | 'friend' | 'doctor' | 'caregiver' | 'other';
  priority: number; // 1 = highest priority
  isActive: boolean;
  preferredContactMethod: 'phone' | 'sms' | 'email' | 'all';
  availabilityHours?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
  medicalInfo?: {
    isHealthcareProvider: boolean;
    specialization?: string;
    licenseNumber?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface EmergencyAlert {
  id: string;
  type: 'medical_emergency' | 'panic_button' | 'critical_vitals' | 'fall_detection' | 'medication_alert' | 'device_malfunction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  patientInfo: {
    name: string;
    age?: number;
    medicalConditions?: string[];
    medications?: string[];
    allergies?: string[];
    bloodType?: string;
    emergencyMedicalInfo?: string;
  };
  location?: {
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    accuracy?: number;
  };
  vitals?: {
    heartRate?: number;
    bloodPressure?: string;
    temperature?: number;
    oxygenSaturation?: number;
    glucoseLevel?: number;
  };
  timestamp: Date;
  status: 'pending' | 'sent' | 'acknowledged' | 'resolved';
  contactsNotified: string[]; // contact IDs
  responses: EmergencyResponse[];
  autoResolved?: boolean;
  resolvedAt?: Date;
}

export interface EmergencyResponse {
  id: string;
  contactId: string;
  contactName: string;
  responseType: 'acknowledged' | 'on_way' | 'contacted_ems' | 'false_alarm' | 'need_more_info';
  message?: string;
  timestamp: Date;
  estimatedArrival?: Date;
}

export interface EmergencyProtocol {
  id: string;
  name: string;
  triggerConditions: {
    vitals?: {
      heartRate?: { min?: number; max?: number };
      bloodPressure?: { systolic?: { min?: number; max?: number }; diastolic?: { min?: number; max?: number } };
      temperature?: { min?: number; max?: number };
      oxygenSaturation?: { min?: number; max?: number };
      glucoseLevel?: { min?: number; max?: number };
    };
    deviceAlerts?: string[];
    userTriggers?: string[];
  };
  actions: {
    notifyContacts: boolean;
    contactPriorities: number[]; // which priority levels to contact
    callEmergencyServices: boolean;
    sendLocationData: boolean;
    escalationTimeMinutes: number;
    customMessage?: string;
  };
  isActive: boolean;
  createdAt: Date;
}

class EmergencyContactService {
  private contacts: Map<string, EmergencyContact> = new Map();
  private alerts: Map<string, EmergencyAlert> = new Map();
  private protocols: Map<string, EmergencyProtocol> = new Map();
  private listeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();
  private notificationQueue: EmergencyAlert[] = [];
  private isProcessingQueue = false;

  constructor() {
    // Remove automatic initialization of default contacts
    // this.initializeDefaultContacts();
    this.initializeDefaultProtocols();
    this.startNotificationProcessor();
  }

  // Initialize default emergency contacts for demo
  private initializeDefaultContacts(): void {
    const defaultContacts: EmergencyContact[] = [
      {
        id: 'contact-001',
        name: 'Dr. Sarah Johnson',
        phone: '+1-555-0123',
        email: 'dr.johnson@medicenter.com',
        relationship: 'doctor',
        priority: 1,
        isActive: true,
        preferredContactMethod: 'phone',
        availabilityHours: {
          start: '08:00',
          end: '18:00',
          timezone: 'America/New_York'
        },
        medicalInfo: {
          isHealthcareProvider: true,
          specialization: 'Internal Medicine',
          licenseNumber: 'MD123456'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'contact-002',
        name: 'John Smith (Spouse)',
        phone: '+1-555-0456',
        email: 'john.smith@email.com',
        relationship: 'spouse',
        priority: 2,
        isActive: true,
        preferredContactMethod: 'all',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'contact-003',
        name: 'Emergency Services',
        phone: '911',
        relationship: 'other',
        priority: 1,
        isActive: true,
        preferredContactMethod: 'phone',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultContacts.forEach(contact => {
      this.contacts.set(contact.id, contact);
    });
  }

  // Initialize default emergency protocols
  private initializeDefaultProtocols(): void {
    const defaultProtocols: EmergencyProtocol[] = [
      {
        id: 'protocol-critical-vitals',
        name: 'Critical Vital Signs',
        triggerConditions: {
          vitals: {
            heartRate: { min: 40, max: 150 },
            bloodPressure: { 
              systolic: { min: 80, max: 180 },
              diastolic: { min: 50, max: 110 }
            },
            temperature: { min: 95.0, max: 104.0 },
            oxygenSaturation: { min: 88 },
            glucoseLevel: { min: 50, max: 300 }
          }
        },
        actions: {
          notifyContacts: true,
          contactPriorities: [1, 2],
          callEmergencyServices: true,
          sendLocationData: true,
          escalationTimeMinutes: 5,
          customMessage: 'Critical vital signs detected. Immediate medical attention required.'
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'protocol-panic-button',
        name: 'Panic Button Activation',
        triggerConditions: {
          userTriggers: ['panic_button']
        },
        actions: {
          notifyContacts: true,
          contactPriorities: [1, 2, 3],
          callEmergencyServices: true,
          sendLocationData: true,
          escalationTimeMinutes: 2,
          customMessage: 'Emergency assistance requested via panic button.'
        },
        isActive: true,
        createdAt: new Date()
      }
    ];

    defaultProtocols.forEach(protocol => {
      this.protocols.set(protocol.id, protocol);
    });
  }

  // Start notification processor
  private startNotificationProcessor(): void {
    setInterval(() => {
      this.processNotificationQueue();
    }, 1000); // Process every second
  }

  // Process notification queue
  private async processNotificationQueue(): Promise<void> {
    if (this.isProcessingQueue || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const alert = this.notificationQueue.shift();
      if (alert) {
        await this.sendNotifications(alert);
      }
    } catch (error) {
      console.error('Error processing notification queue:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Create emergency alert
  public createEmergencyAlert(alertData: Partial<EmergencyAlert>): EmergencyAlert {
    const alert: EmergencyAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: alertData.type || 'medical_emergency',
      severity: alertData.severity || 'high',
      title: alertData.title || 'Emergency Alert',
      message: alertData.message || 'Emergency situation detected',
      patientInfo: alertData.patientInfo || {
        name: 'Patient',
        emergencyMedicalInfo: 'No additional medical information available'
      },
      location: alertData.location,
      vitals: alertData.vitals,
      timestamp: new Date(),
      status: 'pending',
      contactsNotified: [],
      responses: [],
      ...alertData
    };

    this.alerts.set(alert.id, alert);
    this.notificationQueue.push(alert);
    this.notifyListeners('alert_created', alert);

    return alert;
  }

  // Send notifications for an alert
  private async sendNotifications(alert: EmergencyAlert): Promise<void> {
    const relevantProtocol = this.findRelevantProtocol(alert);
    if (!relevantProtocol) {
      console.warn('No relevant protocol found for alert:', alert.id);
      return;
    }

    const contactsToNotify = this.getContactsToNotify(relevantProtocol.actions.contactPriorities);
    
    for (const contact of contactsToNotify) {
      try {
        await this.sendNotificationToContact(alert, contact, relevantProtocol);
        alert.contactsNotified.push(contact.id);
      } catch (error) {
        console.error(`Failed to notify contact ${contact.name}:`, error);
      }
    }

    alert.status = 'sent';
    this.alerts.set(alert.id, alert);
    this.notifyListeners('alert_sent', alert);

    // Schedule escalation if needed
    if (relevantProtocol.actions.escalationTimeMinutes > 0) {
      setTimeout(() => {
        this.checkForEscalation(alert.id);
      }, relevantProtocol.actions.escalationTimeMinutes * 60 * 1000);
    }
  }

  // Find relevant protocol for alert
  private findRelevantProtocol(alert: EmergencyAlert): EmergencyProtocol | null {
    for (const protocol of this.protocols.values()) {
      if (!protocol.isActive) continue;

      // Check if alert type matches protocol triggers
      if (alert.type === 'panic_button' && protocol.triggerConditions.userTriggers?.includes('panic_button')) {
        return protocol;
      }

      if (alert.type === 'critical_vitals' && protocol.triggerConditions.vitals) {
        return protocol;
      }
    }

    // Return default critical protocol if no specific match
    return Array.from(this.protocols.values()).find(p => p.name === 'Critical Vital Signs') || null;
  }

  // Get contacts to notify based on priorities
  private getContactsToNotify(priorities: number[]): EmergencyContact[] {
    return Array.from(this.contacts.values())
      .filter(contact => contact.isActive && priorities.includes(contact.priority))
      .sort((a, b) => a.priority - b.priority);
  }

  // Send notification to specific contact
  private async sendNotificationToContact(
    alert: EmergencyAlert, 
    contact: EmergencyContact, 
    protocol: EmergencyProtocol
  ): Promise<void> {
    // Simulate notification sending
    console.log(`🚨 EMERGENCY NOTIFICATION SENT TO ${contact.name}:`);
    console.log(`Alert: ${alert.title}`);
    console.log(`Message: ${protocol.actions.customMessage || alert.message}`);
    console.log(`Contact Method: ${contact.preferredContactMethod}`);
    console.log(`Phone: ${contact.phone}`);
    
    if (alert.location) {
      console.log(`Location: ${alert.location.address || 'Coordinates provided'}`);
    }
    
    if (alert.vitals) {
      console.log(`Vitals: ${JSON.stringify(alert.vitals)}`);
    }

    // In a real implementation, this would integrate with:
    // - SMS services (Twilio, AWS SNS)
    // - Email services (SendGrid, AWS SES)
    // - Push notifications
    // - Voice calling services
    
    this.notifyListeners('notification_sent', { alert, contact });
  }

  // Check for escalation
  private checkForEscalation(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status === 'resolved' || alert.responses.length > 0) {
      return;
    }

    // Escalate to emergency services if no response
    console.log(`🚨 ESCALATING ALERT ${alertId} - No response received`);
    this.notifyListeners('alert_escalated', alert);
  }

  // Add emergency contact
  public addEmergencyContact(contactData: Omit<EmergencyContact, 'id' | 'createdAt' | 'updatedAt'>): EmergencyContact {
    const contact: EmergencyContact = {
      ...contactData,
      id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.contacts.set(contact.id, contact);
    this.notifyListeners('contact_added', contact);
    return contact;
  }

  // Update emergency contact
  public updateEmergencyContact(contactId: string, updates: Partial<EmergencyContact>): EmergencyContact | null {
    const contact = this.contacts.get(contactId);
    if (!contact) return null;

    const updatedContact = {
      ...contact,
      ...updates,
      updatedAt: new Date()
    };

    this.contacts.set(contactId, updatedContact);
    this.notifyListeners('contact_updated', updatedContact);
    return updatedContact;
  }

  // Remove emergency contact
  public removeEmergencyContact(contactId: string): boolean {
    const success = this.contacts.delete(contactId);
    if (success) {
      this.notifyListeners('contact_removed', contactId);
    }
    return success;
  }

  // Get all emergency contacts
  public getEmergencyContacts(): EmergencyContact[] {
    return Array.from(this.contacts.values())
      .sort((a, b) => a.priority - b.priority);
  }

  // Get active alerts
  public getActiveAlerts(): EmergencyAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.status !== 'resolved')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Respond to alert
  public respondToAlert(alertId: string, contactId: string, response: Omit<EmergencyResponse, 'id' | 'timestamp'>): boolean {
    const alert = this.alerts.get(alertId);
    const contact = this.contacts.get(contactId);
    
    if (!alert || !contact) return false;

    const emergencyResponse: EmergencyResponse = {
      ...response,
      id: `response-${Date.now()}`,
      timestamp: new Date()
    };

    alert.responses.push(emergencyResponse);
    
    if (response.responseType === 'false_alarm') {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
    } else {
      alert.status = 'acknowledged';
    }

    this.alerts.set(alertId, alert);
    this.notifyListeners('alert_response', { alert, response: emergencyResponse });
    
    return true;
  }

  // Resolve alert
  public resolveAlert(alertId: string, autoResolved: boolean = false): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.autoResolved = autoResolved;

    this.alerts.set(alertId, alert);
    this.notifyListeners('alert_resolved', alert);
    
    return true;
  }

  // Test emergency system
  public testEmergencySystem(): void {
    const testAlert = this.createEmergencyAlert({
      type: 'medical_emergency',
      severity: 'low',
      title: 'Emergency System Test',
      message: 'This is a test of the emergency notification system. No action required.',
      patientInfo: {
        name: 'Test Patient',
        emergencyMedicalInfo: 'This is a test alert'
      }
    });

    console.log('🧪 Emergency system test initiated:', testAlert.id);
    
    // Auto-resolve test alert after 30 seconds
    setTimeout(() => {
      this.resolveAlert(testAlert.id, true);
    }, 30000);
  }

  // Add event listener
  public addEventListener(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  // Remove event listener
  public removeEventListener(event: string, callback: (...args: unknown[]) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  // Notify listeners
  private notifyListeners(event: string, data: unknown): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Get emergency system status
  public getSystemStatus(): {
    totalContacts: number;
    activeContacts: number;
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    lastAlert: Date | null;
    systemHealth: 'healthy' | 'warning' | 'critical';
  } {
    const allContacts = Array.from(this.contacts.values());
    const allAlerts = Array.from(this.alerts.values());
    const activeAlerts = allAlerts.filter(a => a.status !== 'resolved');
    const resolvedAlerts = allAlerts.filter(a => a.status === 'resolved');
    
    const lastAlert = allAlerts.length > 0 
      ? new Date(Math.max(...allAlerts.map(a => a.timestamp.getTime())))
      : null;
    
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (activeAlerts.some(a => a.severity === 'critical')) {
      systemHealth = 'critical';
    } else if (activeAlerts.length > 5) {
      systemHealth = 'warning';
    }

    return {
      totalContacts: allContacts.length,
      activeContacts: allContacts.filter(c => c.isActive).length,
      totalAlerts: allAlerts.length,
      activeAlerts: activeAlerts.length,
      resolvedAlerts: resolvedAlerts.length,
      lastAlert,
      systemHealth
    };
  }
}

// Export singleton instance
export const emergencyContactService = new EmergencyContactService();
export default emergencyContactService;