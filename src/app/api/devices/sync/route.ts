import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface SyncRequest {
  deviceId: string;
  forceSync?: boolean;
}

// Mock database references
const mockDeviceConnections = new Map();
const mockBiometricData = new Map();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: SyncRequest = await request.json();
    const { deviceId, forceSync = false } = body;

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    // Find the device
    const userDevices = mockDeviceConnections.get(userId) || mockDeviceConnections.get('sample_user') || [];
    const device = userDevices.find((d: any) => d.id === deviceId);

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    if (!device.isActive) {
      return NextResponse.json(
        { error: 'Device is not active' },
        { status: 400 }
      );
    }

    // Check if sync is needed (unless force sync)
    const lastSyncTime = new Date(device.lastSync).getTime();
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTime;
    const minSyncInterval = getSyncInterval(device.deviceType);

    if (!forceSync && timeSinceLastSync < minSyncInterval) {
      const nextSyncTime = new Date(lastSyncTime + minSyncInterval);
      return NextResponse.json({
        success: false,
        message: 'Sync not needed yet',
        nextSyncAvailable: nextSyncTime.toISOString(),
        timeSinceLastSync: Math.floor(timeSinceLastSync / 1000 / 60) // minutes
      });
    }

    // Simulate sync process
    const syncResult = await simulateDeviceSync(device, userId);

    // Update device last sync time
    device.lastSync = new Date().toISOString();
    device.status = syncResult.success ? 'connected' : 'error';

    return NextResponse.json({
      success: syncResult.success,
      message: syncResult.message,
      device: {
        id: device.id,
        name: device.deviceName,
        type: device.deviceType,
        lastSync: device.lastSync,
        status: device.status
      },
      syncData: syncResult.data,
      recordsAdded: syncResult.recordsAdded
    });

  } catch (error) {
    console.error('Error syncing device:', error);
    return NextResponse.json(
      { error: 'Failed to sync device' },
      { status: 500 }
    );
  }
}

function getSyncInterval(deviceType: string): number {
  // Return sync interval in milliseconds
  const intervals = {
    apple_health: 15 * 60 * 1000,    // 15 minutes
    fitbit: 30 * 60 * 1000,          // 30 minutes
    garmin: 60 * 60 * 1000,          // 1 hour
    samsung_health: 20 * 60 * 1000   // 20 minutes
  };
  
  return intervals[deviceType as keyof typeof intervals] || 30 * 60 * 1000;
}

async function simulateDeviceSync(device: any, userId: string) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  // Simulate occasional sync failures
  if (Math.random() < 0.1) { // 10% chance of failure
    return {
      success: false,
      message: 'Sync failed: Device temporarily unavailable',
      data: null,
      recordsAdded: 0
    };
  }

  // Generate new mock data based on device type
  const newData = generateMockSyncData(device, userId);
  
  // Add to mock database
  if (!mockBiometricData.has(userId)) {
    mockBiometricData.set(userId, []);
  }
  
  const existingData = mockBiometricData.get(userId) || [];
  mockBiometricData.set(userId, [...existingData, ...newData]);

  return {
    success: true,
    message: `Successfully synced ${newData.length} new records from ${device.deviceName}`,
    data: newData,
    recordsAdded: newData.length
  };
}

function generateMockSyncData(device: any, userId: string) {
  const now = new Date();
  const data = [];
  
  // Generate data based on device type and supported metrics
  const dataTypes = device.dataTypes || ['steps', 'heart_rate'];
  
  for (const dataType of dataTypes) {
    // Generate 1-3 new readings per metric
    const readingCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < readingCount; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000); // Hourly readings
      
      data.push({
        id: `${dataType}_${device.id}_${timestamp.getTime()}`,
        userId,
        deviceId: device.id,
        metricType: dataType,
        value: generateMockValue(dataType),
        unit: getUnitForMetric(dataType),
        recordedAt: timestamp.toISOString(),
        createdAt: now.toISOString()
      });
    }
  }
  
  return data;
}

function generateMockValue(metricType: string): number {
  switch (metricType) {
    case 'heart_rate':
      return 60 + Math.floor(Math.random() * 40); // 60-100 bpm
    case 'steps':
      return Math.floor(Math.random() * 2000) + 500; // 500-2500 steps per hour
    case 'calories':
      return Math.floor(Math.random() * 200) + 50; // 50-250 calories per hour
    case 'sleep':
      return Math.random() * 2 + 6; // 6-8 hours
    case 'distance':
      return Math.random() * 5; // 0-5 km
    case 'blood_pressure':
      return Math.floor(Math.random() * 40) + 110; // 110-150 systolic
    case 'stress':
      return Math.floor(Math.random() * 100); // 0-100 stress level
    case 'active_minutes':
      return Math.floor(Math.random() * 60); // 0-60 active minutes
    default:
      return Math.random() * 100;
  }
}

function getUnitForMetric(metricType: string): string {
  const units = {
    heart_rate: 'bpm',
    steps: 'steps',
    calories: 'cal',
    sleep: 'hours',
    distance: 'km',
    blood_pressure: 'mmHg',
    stress: 'level',
    active_minutes: 'minutes'
  };
  
  return units[metricType as keyof typeof units] || 'unit';
}