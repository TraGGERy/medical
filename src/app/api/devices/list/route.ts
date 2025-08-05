import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Mock database for demonstration
const mockDeviceConnections = new Map();
const mockBiometricData = new Map();

// Initialize with some sample data
if (!mockDeviceConnections.has('sample_user')) {
  mockDeviceConnections.set('sample_user', [
    {
      id: 'device_1',
      userId: 'sample_user',
      deviceType: 'apple_health',
      deviceName: 'iPhone Health',
      deviceId: 'apple_health_sample_user_1',
      lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      isActive: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      status: 'connected',
      dataTypes: ['steps', 'heart_rate', 'sleep', 'calories']
    },
    {
      id: 'device_2',
      userId: 'sample_user',
      deviceType: 'fitbit',
      deviceName: 'Fitbit Charge 5',
      deviceId: 'fitbit_sample_user_2',
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      isActive: true,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      status: 'connected',
      batteryLevel: 75,
      dataTypes: ['steps', 'heart_rate', 'sleep', 'calories', 'active_minutes']
    }
  ]);
}

export async function GET(request: NextRequest) {
  try {
    const { userId } =await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's connected devices
    const userDevices = mockDeviceConnections.get(userId) || mockDeviceConnections.get('sample_user') || [];
    
    // Filter only active devices
    const activeDevices = userDevices.filter((device: any) => device.isActive);

    // Add some real-time status simulation
    const devicesWithStatus = activeDevices.map((device: any) => {
      const timeSinceLastSync = Date.now() - new Date(device.lastSync).getTime();
      const hoursAgo = timeSinceLastSync / (1000 * 60 * 60);
      
      let status = device.status;
      if (hoursAgo > 24) {
        status = 'error';
      } else if (hoursAgo > 6) {
        status = 'disconnected';
      }
      
      return {
        ...device,
        status,
        syncStatus: {
          lastSyncAgo: formatTimeAgo(device.lastSync),
          nextSyncIn: getNextSyncTime(device.deviceType),
          syncFrequency: getSyncFrequency(device.deviceType)
        }
      };
    });

    return NextResponse.json({
      success: true,
      devices: devicesWithStatus,
      totalDevices: devicesWithStatus.length,
      connectedDevices: devicesWithStatus.filter((device: { status: string }) => device.status === 'connected').length
    });

  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    );
  }
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

function getNextSyncTime(deviceType: string): string {
  const frequencies = {
    apple_health: 15, // 15 minutes
    fitbit: 30,       // 30 minutes
    garmin: 60,       // 1 hour
    samsung_health: 20 // 20 minutes
  };
  
  const frequency = frequencies[deviceType as keyof typeof frequencies] || 30;
  return `${frequency}m`;
}

function getSyncFrequency(deviceType: string): string {
  const frequencies = {
    apple_health: 'Every 15 minutes',
    fitbit: 'Every 30 minutes',
    garmin: 'Every hour',
    samsung_health: 'Every 20 minutes'
  };
  
  return frequencies[deviceType as keyof typeof frequencies] || 'Every 30 minutes';
}