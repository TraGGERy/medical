'use server';

import { db } from '@/lib/db';
import { userSubscriptions, subscriptionPlans } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function createFreeSubscription(userId: string) {
  try {
    // Check if user already has a subscription
    const existingSubscription = await db.select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .limit(1);

    if (existingSubscription.length > 0) {
      return { success: true, message: 'User already has a subscription' };
    }

    // Create free subscription for new user
    const currentDate = new Date();
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await db.insert(userSubscriptions).values({
      userId,
      planId: 'free',
      status: 'active',
      currentPeriodStart: currentDate,
      currentPeriodEnd: nextMonth,
      cancelAtPeriodEnd: false
    });

    return { success: true, message: 'Free subscription created successfully' };
  } catch (error) {
    console.error('Error creating free subscription:', error);
    return { success: false, message: 'Failed to create subscription' };
  }
}

export async function getUserSubscription(userId: string) {
  try {
    const subscription = await db.select({
      id: userSubscriptions.id,
      planId: userSubscriptions.planId,
      status: userSubscriptions.status,
      currentPeriodStart: userSubscriptions.currentPeriodStart,
      currentPeriodEnd: userSubscriptions.currentPeriodEnd,
      stripeSubscriptionId: userSubscriptions.stripeSubscriptionId,
      stripeCustomerId: userSubscriptions.stripeCustomerId,
      planName: subscriptionPlans.name,
      maxReports: subscriptionPlans.maxReports,
      price: subscriptionPlans.price
    })
    .from(userSubscriptions)
    .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
    .where(and(
      eq(userSubscriptions.userId, userId),
      eq(userSubscriptions.status, 'active')
    ))
    .limit(1);

    return subscription.length > 0 ? subscription[0] : null;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
}

export async function checkReportLimit(userId: string, currentMonthReports: number) {
  try {
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      // No subscription found, default to free plan limits
      return {
        canCreateReport: currentMonthReports < 5,
        maxReports: 5,
        currentReports: currentMonthReports,
        planName: 'Free Plan'
      };
    }

    // If unlimited reports (maxReports is null)
    if (subscription.maxReports === null) {
      return {
        canCreateReport: true,
        maxReports: null,
        currentReports: currentMonthReports,
        planName: subscription.planName || 'Pro Plan'
      };
    }

    // Check against plan limits
    return {
      canCreateReport: currentMonthReports < subscription.maxReports,
      maxReports: subscription.maxReports,
      currentReports: currentMonthReports,
      planName: subscription.planName || 'Free Plan'
    };
  } catch (error) {
    console.error('Error checking report limit:', error);
    // Default to free plan limits on error
    return {
      canCreateReport: currentMonthReports < 5,
      maxReports: 5,
      currentReports: currentMonthReports,
      planName: 'Free Plan'
    };
  }
}