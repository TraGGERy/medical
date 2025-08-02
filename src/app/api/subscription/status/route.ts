import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserSubscription } from '@/lib/services/subscriptionService';
import { getUserMonthlyReportCount } from '@/lib/services/analyticsService';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription
    const subscription = await getUserSubscription(userId);
    
    // Get monthly report count
    const monthlyReportCount = await getUserMonthlyReportCount(userId);
    
    // Default to free plan if no subscription found
    const subscriptionInfo = {
      planName: subscription?.planName || 'Free Plan',
      maxReports: subscription?.maxReports || 5,
      currentReports: monthlyReportCount,
      isUnlimited: subscription?.maxReports === null,
      status: subscription?.status || 'active'
    };

    return NextResponse.json(subscriptionInfo);
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}