import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { healthReports } from '@/lib/db/schema';
import { createOrUpdateUser } from '@/lib/services/userService';
import { updateUserReportAnalytics, getUserMonthlyReportCount } from '@/lib/services/analyticsService';
import { checkReportLimit } from '@/lib/services/subscriptionService';

// Retry function for database operations
async function retryDatabaseOperation<T>(operation: () => Promise<T>, maxRetries = 5): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.log(`Database operation attempt ${attempt}/${maxRetries} failed:`, error);
      
      // Check if it's a retryable error
      const isRetryableError = error instanceof Error && (
        error.message.includes('Connect Timeout Error') ||
        error.message.includes('fetch failed') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('ENOTFOUND')
      );
      
      if (!isRetryableError || attempt >= maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff with jitter)
      const baseDelay = Math.pow(2, attempt) * 1000;
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;
      
      console.log(`Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get current month's report count
    const monthlyReportCount = await getUserMonthlyReportCount(userId);
    
    // Check subscription and report limits
    const limitCheck = await checkReportLimit(userId, monthlyReportCount);
    
    if (!limitCheck.canCreateReport) {
      return NextResponse.json({ 
        error: 'Monthly report limit reached. Please upgrade your subscription for more reports.',
        limitReached: true,
        currentCount: limitCheck.currentReports,
        maxReports: limitCheck.maxReports,
        planName: limitCheck.planName
      }, { status: 403 });
    }

    const requestBody = await request.json();
    console.log('Received request body:', requestBody);

    const { 
      title,
      symptoms, 
      aiAnalysis, 
      urgencyLevel,
      riskLevel,
      confidence,
      recommendations,
      followUpRequired,
      doctorRecommended
    } = requestBody;

    // Validate required fields
    if (!title || !symptoms || !aiAnalysis) {
      return NextResponse.json(
        { error: 'Missing required fields: title, symptoms, and aiAnalysis are required' },
        { status: 400 }
      );
    }

    // Determine risk level based on urgency if not provided
    let finalRiskLevel = riskLevel;
    if (!finalRiskLevel) {
      switch (urgencyLevel) {
        case 'emergency':
          finalRiskLevel = 'critical';
          break;
        case 'high':
          finalRiskLevel = 'high';
          break;
        case 'medium':
          finalRiskLevel = 'medium';
          break;
        case 'low':
        default:
          finalRiskLevel = 'low';
          break;
      }
    }

    // Determine follow-up and doctor recommendation based on urgency
    const needsFollowUp = followUpRequired !== undefined ? followUpRequired : urgencyLevel === 'high' || urgencyLevel === 'emergency';
    const needsDoctor = doctorRecommended !== undefined ? doctorRecommended : urgencyLevel === 'emergency';

    // Determine urgency level number (1-5 scale)
    let urgencyNumber = 1;
    switch (urgencyLevel) {
      case 'emergency':
        urgencyNumber = 5;
        break;
      case 'high':
        urgencyNumber = 4;
        break;
      case 'medium':
        urgencyNumber = 3;
        break;
      case 'low':
        urgencyNumber = 2;
        break;
      default:
        urgencyNumber = 1;
        break;
    }

    // Save the health report to database
    const insertData = {
      userId,
      title,
      symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
      aiAnalysis,
      riskLevel: finalRiskLevel,
      confidence: confidence !== undefined ? confidence.toString() : '85.00',
      recommendations: Array.isArray(recommendations) ? recommendations : [],
      urgencyLevel: urgencyNumber,
      followUpRequired: needsFollowUp,
      doctorRecommended: needsDoctor,
      status: 'completed'
    };

    console.log('Inserting data:', insertData);

    const [newReport] = await retryDatabaseOperation(async () => {
      return await db.insert(healthReports).values(insertData).returning();
    });

    console.log('Successfully saved report:', newReport.id);

    // Update user analytics
    await updateUserReportAnalytics(userId);

    // Get updated report count for the current month
    const updatedReportCount = await getUserMonthlyReportCount(userId);

    return NextResponse.json({ 
      success: true, 
      reportId: newReport.id,
      message: 'Health report saved successfully',
      reportCount: {
        current: limitCheck.currentReports + 1,
        max: limitCheck.maxReports
      },
      planName: limitCheck.planName
    });

  } catch (error) {
    console.error('Error saving health report:', error);
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('Connect Timeout Error')) {
      return NextResponse.json(
        { error: 'Database connection timeout. Please try again in a moment.' },
        { status: 503 }
      );
    }
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in and try again.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to save health report. Please try again.' },
      { status: 500 }
    );
  }
}