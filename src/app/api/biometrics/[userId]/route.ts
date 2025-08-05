import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface BiometricData {
  id: string;
  userId: string;
  deviceId: string;
  metricType: string;
  value: number;
  unit: string;
  recordedAt: string;
  createdAt: string;
}

// Mock biometric data
const mockBiometricData = new Map();

// Initialize with sample data
if (!mockBiometricData.has('sample_user')) {
  const now = new Date();
  const sampleData: BiometricData[] = [];
  
  // Generate sample data for the last 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    
    // Heart rate data (multiple readings per day)
    for (let j = 0; j < 4; j++) {
      const time = new Date(date.getTime() + j * 6 * 60 * 60 * 1000);
      sampleData.push({
        id: `hr_${i}_${j}`,
        userId: 'sample_user',
        deviceId: 'device_1',
        metricType: 'heart_rate',
        value: 65 + Math.floor(Math.random() * 20),
        unit: 'bpm',
        recordedAt: time.toISOString(),
        createdAt: time.toISOString()
      });
    }
    
    // Steps data (daily)
    sampleData.push({
      id: `steps_${i}`,
      userId: 'sample_user',
      deviceId: 'device_2',
      metricType: 'steps',
      value: 6000 + Math.floor(Math.random() * 4000),
      unit: 'steps',
      recordedAt: date.toISOString(),
      createdAt: date.toISOString()
    });
    
    // Calories data (daily)
    sampleData.push({
      id: `calories_${i}`,
      userId: 'sample_user',
      deviceId: 'device_2',
      metricType: 'calories',
      value: 1800 + Math.floor(Math.random() * 600),
      unit: 'cal',
      recordedAt: date.toISOString(),
      createdAt: date.toISOString()
    });
    
    // Sleep data (daily)
    sampleData.push({
      id: `sleep_${i}`,
      userId: 'sample_user',
      deviceId: 'device_1',
      metricType: 'sleep',
      value: 6.5 + Math.random() * 2,
      unit: 'hours',
      recordedAt: date.toISOString(),
      createdAt: date.toISOString()
    });
  }
  
  mockBiometricData.set('sample_user', sampleData);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: authUserId } = await auth();
    const { userId } = await context.params;
    
    if (!authUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Users can only access their own data
    if (authUserId !== userId && userId !== 'sample_user') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const metricType = searchParams.get('metricType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Get user's biometric data
    let userData = mockBiometricData.get(userId) || mockBiometricData.get('sample_user') || [];

    // Filter by metric type if specified
    if (metricType) {
      userData = userData.filter((data: BiometricData) => data.metricType === metricType);
    }

    // Filter by date range if specified
    if (startDate) {
      const start = new Date(startDate);
      userData = userData.filter((data: BiometricData) => new Date(data.recordedAt) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      userData = userData.filter((data: BiometricData) => new Date(data.recordedAt) <= end);
    }

    // Sort by recorded date (newest first)
    userData.sort((a: BiometricData, b: BiometricData) => 
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );

    // Apply limit
    userData = userData.slice(0, limit);

    // Calculate summary statistics
    const summary = calculateSummary(userData);

    return NextResponse.json({
      success: true,
      data: userData,
      summary,
      totalRecords: userData.length,
      filters: {
        metricType,
        startDate,
        endDate,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching biometric data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch biometric data' },
      { status: 500 }
    );
  }
}

interface MetricSummary {
  count: number;
  latest: number;
  average: number;
  min: number;
  max: number;
  unit: string;
}

function calculateSummary(data: BiometricData[]) {
  const summary: Record<string, MetricSummary> = {};
  
  // Group data by metric type
  const groupedData = data.reduce((acc, item) => {
    if (!acc[item.metricType]) {
      acc[item.metricType] = [];
    }
    acc[item.metricType].push(item.value);
    return acc;
  }, {} as Record<string, number[]>);

  // Calculate statistics for each metric type
  Object.keys(groupedData).forEach(metricType => {
    const values = groupedData[metricType];
    if (values.length > 0) {
      summary[metricType] = {
        count: values.length,
        latest: values[0], // Already sorted by newest first
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        unit: data.find(d => d.metricType === metricType)?.unit || ''
      };
    }
  });

  return summary;
}