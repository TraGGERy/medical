import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface ConnectDeviceRequest {
  deviceType: 'apple_health' | 'fitbit' | 'garmin' | 'samsung_health';
  deviceName: string;
  accessToken?: string;
  refreshToken?: string;
}

// Mock database for demonstration
const mockDeviceConnections = new Map();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: ConnectDeviceRequest = await request.json();
    const { deviceType, deviceName, accessToken, refreshToken } = body;

    if (!deviceType || !deviceName) {
      return NextResponse.json(
        { error: 'Device type and name are required' },
        { status: 400 }
      );
    }

    // Generate a unique device ID
    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create device connection record
    const deviceConnection = {
      id: deviceId,
      userId,
      deviceType,
      deviceName,
      deviceId: `${deviceType}_${userId}_${Date.now()}`,
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
      lastSync: new Date().toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
      status: 'connected',
      dataTypes: getDataTypesForDevice(deviceType)
    };

    // Store in mock database
    if (!mockDeviceConnections.has(userId)) {
      mockDeviceConnections.set(userId, []);
    }
    mockDeviceConnections.get(userId).push(deviceConnection);

    // Simulate OAuth flow for different devices
    let authUrl = null;
    switch (deviceType) {
      case 'fitbit':
        authUrl = `https://www.fitbit.com/oauth2/authorize?client_id=mock&redirect_uri=${encodeURIComponent('http://localhost:3001/api/devices/callback/fitbit')}&scope=activity+heartrate+sleep&response_type=code`;
        break;
      case 'garmin':
        authUrl = `https://connect.garmin.com/oauth/authorize?client_id=mock&redirect_uri=${encodeURIComponent('http://localhost:3001/api/devices/callback/garmin')}&scope=activity+heartrate&response_type=code`;
        break;
      case 'apple_health':
        // Apple Health uses HealthKit which doesn't require OAuth
        break;
      case 'samsung_health':
        authUrl = `https://account.samsung.com/oauth2/authorize?client_id=mock&redirect_uri=${encodeURIComponent('http://localhost:3001/api/devices/callback/samsung')}&scope=health&response_type=code`;
        break;
    }

    return NextResponse.json({
      success: true,
      device: deviceConnection,
      authUrl,
      message: `${deviceName} connected successfully`
    });

  } catch (error) {
    console.error('Error connecting device:', error);
    return NextResponse.json(
      { error: 'Failed to connect device' },
      { status: 500 }
    );
  }
}

function getDataTypesForDevice(deviceType: string): string[] {
  switch (deviceType) {
    case 'apple_health':
      return ['steps', 'heart_rate', 'sleep', 'calories', 'distance', 'blood_pressure'];
    case 'fitbit':
      return ['steps', 'heart_rate', 'sleep', 'calories', 'distance', 'active_minutes'];
    case 'garmin':
      return ['steps', 'heart_rate', 'sleep', 'calories', 'distance', 'stress'];
    case 'samsung_health':
      return ['steps', 'heart_rate', 'sleep', 'calories', 'blood_pressure'];
    default:
      return ['steps', 'heart_rate'];
  }
}