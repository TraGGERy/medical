import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  storeHealthData, 
  getUserRealtimeData,
  triggerAnalysisJob,
  getActiveAlerts
} from '@/lib/services/realtimeMonitoringService';
import { z } from 'zod';

/**
 * Health Data API Route for Real-time Monitoring
 * Handles storing and retrieving real-time health data
 */

// Validation schemas
const healthDataSchema = z.object({
  dataType: z.enum(['heart_rate', 'blood_pressure', 'temperature', 'oxygen_saturation', 'steps', 'sleep', 'weight', 'glucose']),
  value: z.number(),
  unit: z.string(),
  source: z.string().optional().default('manual'),
  timestamp: z.string().optional(),
});

const bulkHealthDataSchema = z.object({
  data: z.array(healthDataSchema),
});

const querySchema = z.object({
  dataType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().optional(),
  includeAlerts: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'store':
        // Store single health data point
        const validatedData = healthDataSchema.parse(body);
        
        const result = await storeHealthData({
          userId,
          dataType: validatedData.dataType,
          value: validatedData.value,
          unit: validatedData.unit,
          source: validatedData.source,
          timestamp: validatedData.timestamp ? new Date(validatedData.timestamp) : new Date(),
        });

        if (result.success) {
          // Trigger analysis job for anomaly detection
          await triggerAnalysisJob(userId, 'anomaly_detection', {
            dataType: validatedData.dataType,
            value: validatedData.value,
            timestamp: result.data?.timestamp,
          });
        }

        return Response.json(result);

      case 'bulk':
        // Store multiple health data points
        const validatedBulkData = bulkHealthDataSchema.parse(body);
        const results = [];

        for (const dataPoint of validatedBulkData.data) {
          const result = await storeHealthData({
            userId,
            dataType: dataPoint.dataType,
            value: dataPoint.value,
            unit: dataPoint.unit,
            source: dataPoint.source,
            timestamp: dataPoint.timestamp ? new Date(dataPoint.timestamp) : new Date(),
          });
          results.push(result);
        }

        // Trigger bulk analysis
        await triggerAnalysisJob(userId, 'bulk_analysis', {
          dataCount: validatedBulkData.data.length,
          dataTypes: [...new Set(validatedBulkData.data.map(d => d.dataType))],
        });

        return Response.json({ 
          success: true, 
          results,
          message: `Stored ${results.filter(r => r.success).length} of ${results.length} data points`
        });

      case 'trigger_analysis':
        // Manually trigger analysis
        const { analysisType, parameters } = body;
        const analysisResult = await triggerAnalysisJob(userId, analysisType, parameters);
        return Response.json(analysisResult);

      default:
        return Response.json({ error: 'Invalid action parameter' }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Health data API error:', error);
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = querySchema.parse(queryParams);

    const {
      dataType,
      startDate,
      endDate,
      limit,
      includeAlerts
    } = validatedQuery;

    // Get user's real-time health data
    const healthData = await getUserRealtimeData(userId, {
      dataType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : 100,
    });

    let alerts = null;
    if (includeAlerts === 'true') {
      alerts = await getActiveAlerts(userId);
    }

    return Response.json({
      success: true,
      data: healthData,
      alerts,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Health data GET error:', error);
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const dataId = url.searchParams.get('id');
    
    if (!dataId) {
      return Response.json({ error: 'Data ID is required' }, { status: 400 });
    }

    // Note: Implementation would require adding a delete function to the service
    // For now, return a placeholder response
    return Response.json({ 
      success: true, 
      message: 'Health data deletion not yet implemented',
      dataId 
    });
  } catch (error: unknown) {
    console.error('Health data DELETE error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}