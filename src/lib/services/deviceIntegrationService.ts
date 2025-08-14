'use client';

// Enhanced Device Integration Service for MediScope AI
// Supports multiple device types and real-time data collection

export interface DeviceData {
  deviceId: string;
  deviceType: DeviceType;
  deviceName: string;
  manufacturer: string;
  lastSync: Date;
  batteryLevel?: number;
  connectionStatus: 'connected' | 'disconnected' | 'syncing' | 'error';
}

export interface BiometricReading {
  id: string;
  deviceId: string;
  type: BiometricType;
  value: number;
  unit: string;
  timestamp: Date;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  status: 'normal' | 'warning' | 'critical';
  metadata?: {
    accuracy?: number;
    confidence?: number;
    rawData?: Record<string, unknown>;
    context?: string;
  };
}

export type DeviceType = 
  | 'smartwatch'
  | 'fitness_tracker'
  | 'blood_pressure_monitor'
  | 'glucose_meter'
  | 'pulse_oximeter'
  | 'smart_scale'
  | 'ecg_monitor'
  | 'sleep_tracker'
  | 'thermometer'
  | 'inhaler'
  | 'continuous_glucose_monitor';

export type BiometricType = 
  | 'heart_rate'
  | 'blood_pressure_systolic'
  | 'blood_pressure_diastolic'
  | 'blood_glucose'
  | 'oxygen_saturation'
  | 'body_temperature'
  | 'weight'
  | 'body_fat_percentage'
  | 'steps'
  | 'calories_burned'
  | 'sleep_duration'
  | 'sleep_quality'
  | 'stress_level'
  | 'respiratory_rate'
  | 'ecg_reading'
  | 'blood_pressure_mean';

export interface HealthAlert {
  id: string;
  type: 'emergency' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  deviceId: string;
  biometricType: BiometricType;
  value: number;
  thresholds: {
    min?: number;
    max?: number;
    target?: number;
  };
  actionRequired: boolean;
  acknowledged: boolean;
}

export interface DeviceIntegrationConfig {
  enableRealTimeSync: boolean;
  syncInterval: number; // in milliseconds
  alertThresholds: Record<BiometricType, {
    min?: number;
    max?: number;
    target?: number;
  }>;
  emergencyContacts: string[];
  autoEmergencyAlert: boolean;
}

class DeviceIntegrationService {
  private devices: Map<string, DeviceData> = new Map();
  private readings: BiometricReading[] = [];
  private alerts: HealthAlert[] = [];
  private config: DeviceIntegrationConfig;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  constructor() {
    this.config = {
      enableRealTimeSync: true,
      syncInterval: 30000, // 30 seconds
      alertThresholds: {
        heart_rate: { min: 60, max: 100 },
        blood_pressure_systolic: { min: 90, max: 140 },
        blood_pressure_diastolic: { min: 60, max: 90 },
        blood_glucose: { min: 70, max: 180 },
        oxygen_saturation: { min: 95, max: 100 },
        body_temperature: { min: 97.0, max: 99.5 },
        weight: { min: 0, max: 1000 },
        body_fat_percentage: { min: 5, max: 50 },
        steps: { target: 10000 },
        calories_burned: { target: 2000 },
        sleep_duration: { min: 6, max: 10 },
        sleep_quality: { min: 70, max: 100 },
        stress_level: { min: 0, max: 100 },
        respiratory_rate: { min: 12, max: 20 },
        ecg_reading: { min: 60, max: 100 },
        blood_pressure_mean: { min: 70, max: 110 }
      },
      emergencyContacts: [],
      autoEmergencyAlert: true
    };
    
    // Remove automatic initialization of simulated devices
    // this.initializeSimulatedDevices();
    // Only start real-time sync if devices are actually connected
    // this.startRealTimeSync();
  }

  // Initialize simulated devices for demo purposes
  private initializeSimulatedDevices(): void {
    const simulatedDevices: DeviceData[] = [
      {
        deviceId: 'apple-watch-001',
        deviceType: 'smartwatch',
        deviceName: 'Apple Watch Series 9',
        manufacturer: 'Apple',
        lastSync: new Date(),
        batteryLevel: 85,
        connectionStatus: 'connected'
      },
      {
        deviceId: 'fitbit-charge-001',
        deviceType: 'fitness_tracker',
        deviceName: 'Fitbit Charge 6',
        manufacturer: 'Fitbit',
        lastSync: new Date(),
        batteryLevel: 72,
        connectionStatus: 'connected'
      },
      {
        deviceId: 'omron-bp-001',
        deviceType: 'blood_pressure_monitor',
        deviceName: 'Omron HeartGuide',
        manufacturer: 'Omron',
        lastSync: new Date(),
        batteryLevel: 45,
        connectionStatus: 'connected'
      },
      {
        deviceId: 'freestyle-cgm-001',
        deviceType: 'continuous_glucose_monitor',
        deviceName: 'FreeStyle Libre 3',
        manufacturer: 'Abbott',
        lastSync: new Date(),
        connectionStatus: 'connected'
      }
    ];

    simulatedDevices.forEach(device => {
      this.devices.set(device.deviceId, device);
    });
  }

  // Start real-time data synchronization
  public startRealTimeSync(): void {
    if (this.config.enableRealTimeSync && !this.syncInterval) {
      this.syncInterval = setInterval(() => {
        this.simulateDeviceReadings();
      }, this.config.syncInterval);
    }
  }

  // Stop real-time data synchronization
  public stopRealTimeSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Simulate device readings for demo purposes
  private simulateDeviceReadings(): void {
    const devices = Array.from(this.devices.values());
    
    devices.forEach(device => {
      if (device.connectionStatus === 'connected') {
        const readings = this.generateSimulatedReadings(device);
        readings.forEach(reading => {
          this.addBiometricReading(reading);
        });
      }
    });
  }

  // Generate simulated readings based on device type
  private generateSimulatedReadings(device: DeviceData): BiometricReading[] {
    const readings: BiometricReading[] = [];
    const timestamp = new Date();

    switch (device.deviceType) {
      case 'smartwatch':
      case 'fitness_tracker':
        readings.push({
          id: `${device.deviceId}-hr-${Date.now()}`,
          deviceId: device.deviceId,
          type: 'heart_rate',
          value: 65 + Math.random() * 40,
          unit: 'bpm',
          timestamp,
          quality: 'good',
          status: 'normal'
        });
        
        readings.push({
          id: `${device.deviceId}-steps-${Date.now()}`,
          deviceId: device.deviceId,
          type: 'steps',
          value: Math.floor(Math.random() * 1000) + 8000,
          unit: 'steps',
          timestamp,
          quality: 'excellent',
          status: 'normal'
        });
        break;

      case 'blood_pressure_monitor':
        const systolic = 110 + Math.random() * 30;
        const diastolic = 70 + Math.random() * 20;
        
        readings.push({
          id: `${device.deviceId}-sys-${Date.now()}`,
          deviceId: device.deviceId,
          type: 'blood_pressure_systolic',
          value: systolic,
          unit: 'mmHg',
          timestamp,
          quality: 'excellent',
          status: systolic > 140 ? 'warning' : 'normal'
        });
        
        readings.push({
          id: `${device.deviceId}-dia-${Date.now()}`,
          deviceId: device.deviceId,
          type: 'blood_pressure_diastolic',
          value: diastolic,
          unit: 'mmHg',
          timestamp,
          quality: 'excellent',
          status: diastolic > 90 ? 'warning' : 'normal'
        });
        break;

      case 'continuous_glucose_monitor':
        const glucose = 80 + Math.random() * 100;
        readings.push({
          id: `${device.deviceId}-glucose-${Date.now()}`,
          deviceId: device.deviceId,
          type: 'blood_glucose',
          value: glucose,
          unit: 'mg/dL',
          timestamp,
          quality: 'good',
          status: glucose > 180 || glucose < 70 ? 'warning' : 'normal'
        });
        break;
    }

    return readings;
  }

  // Add a new biometric reading
  public addBiometricReading(reading: BiometricReading): void {
    this.readings.push(reading);
    
    // Keep only last 1000 readings for performance
    if (this.readings.length > 1000) {
      this.readings = this.readings.slice(-1000);
    }
    
    // Check for alerts
    this.checkForAlerts(reading);
    
    // Notify listeners
    this.notifyListeners('reading_added', reading);
  }

  // Check if a reading triggers any alerts
  private checkForAlerts(reading: BiometricReading): void {
    const thresholds = this.config.alertThresholds[reading.type];
    if (!thresholds) return;

    let alertType: 'emergency' | 'warning' | 'info' | null = null;
    let message = '';

    if (thresholds.min !== undefined && reading.value < thresholds.min) {
      alertType = reading.value < thresholds.min * 0.8 ? 'emergency' : 'warning';
      message = `${reading.type.replace('_', ' ')} is below normal range: ${reading.value} ${reading.unit}`;
    } else if (thresholds.max !== undefined && reading.value > thresholds.max) {
      alertType = reading.value > thresholds.max * 1.2 ? 'emergency' : 'warning';
      message = `${reading.type.replace('_', ' ')} is above normal range: ${reading.value} ${reading.unit}`;
    }

    if (alertType) {
      const alert: HealthAlert = {
        id: `alert-${Date.now()}`,
        type: alertType,
        title: `${reading.type.replace('_', ' ')} Alert`,
        message,
        timestamp: new Date(),
        deviceId: reading.deviceId,
        biometricType: reading.type,
        value: reading.value,
        thresholds,
        actionRequired: alertType === 'emergency',
        acknowledged: false
      };
      
      this.alerts.push(alert);
      this.notifyListeners('alert_created', alert);
      
      if (alertType === 'emergency' && this.config.autoEmergencyAlert) {
        this.triggerEmergencyAlert(alert);
      }
    }
  }

  // Trigger emergency alert
  private triggerEmergencyAlert(alert: HealthAlert): void {
    console.log('🚨 EMERGENCY ALERT TRIGGERED:', alert);
    this.notifyListeners('emergency_alert', alert);
  }

  // Get all connected devices
  public getConnectedDevices(): DeviceData[] {
    return Array.from(this.devices.values()).filter(
      device => device.connectionStatus === 'connected'
    );
  }

  // Get recent readings for a specific biometric type
  public getRecentReadings(type: BiometricType, limit: number = 10): BiometricReading[] {
    return this.readings
      .filter(reading => reading.type === type)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get all recent readings
  public getAllRecentReadings(limit: number = 50): BiometricReading[] {
    return this.readings
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get active alerts
  public getActiveAlerts(): HealthAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  // Acknowledge an alert
  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.notifyListeners('alert_acknowledged', alert);
    }
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
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Get health summary
  public getHealthSummary(): {
    totalDevices: number;
    connectedDevices: number;
    recentReadings: number;
    activeAlerts: number;
    emergencyAlerts: number;
    lastSync: Date | null;
  } {
    const connectedDevices = this.getConnectedDevices();
    const activeAlerts = this.getActiveAlerts();
    const emergencyAlerts = activeAlerts.filter(alert => alert.type === 'emergency');
    const recentReadings = this.readings.filter(
      reading => Date.now() - reading.timestamp.getTime() < 24 * 60 * 60 * 1000
    );
    
    const lastSync = connectedDevices.length > 0 
      ? new Date(Math.max(...connectedDevices.map(d => d.lastSync.getTime())))
      : null;

    return {
      totalDevices: this.devices.size,
      connectedDevices: connectedDevices.length,
      recentReadings: recentReadings.length,
      activeAlerts: activeAlerts.length,
      emergencyAlerts: emergencyAlerts.length,
      lastSync
    };
  }

  // Update configuration
  public updateConfig(newConfig: Partial<DeviceIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enableRealTimeSync !== undefined) {
      if (newConfig.enableRealTimeSync) {
        this.startRealTimeSync();
      } else {
        this.stopRealTimeSync();
      }
    }
  }

  // Get current configuration
  public getConfig(): DeviceIntegrationConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const deviceIntegrationService = new DeviceIntegrationService();
export default deviceIntegrationService;