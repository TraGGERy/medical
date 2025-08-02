import { db } from '@/lib/db';
import { subscriptionPlans, userSubscriptions, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string; // Changed from number to string to match database
  currency: string | null;
  features: unknown; // Changed to match database type
  maxReports: number | null;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  status: string; // Changed to string to match database
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const plans = await db.select().from(subscriptionPlans);
    return plans;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return [];
  }
}

export async function getSubscriptionPlanById(planId: string): Promise<SubscriptionPlan | null> {
  try {
    const plan = await db.select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);
    
    return plan.length > 0 ? plan[0] : null;
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    return null;
  }
}

export async function createOrUpdateSubscription(
  userId: string,
  planId: string,
  stripeSubscriptionId: string,
  stripeCustomerId: string,
  status: string, // Changed to string
  currentPeriodStart: Date,
  currentPeriodEnd: Date
): Promise<UserSubscription | null> {
  try {
    // Check if subscription already exists
    const existingSubscription = await db.select()
      .from(userSubscriptions)
      .where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.stripeSubscriptionId, stripeSubscriptionId)
      ))
      .limit(1);

    if (existingSubscription.length > 0) {
      // Update existing subscription
      const updated = await db.update(userSubscriptions)
        .set({
          planId,
          status,
          currentPeriodStart,
          currentPeriodEnd,
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, existingSubscription[0].id))
        .returning();

      return updated[0] || null;
    } else {
      // Create new subscription
      const created = await db.insert(userSubscriptions)
        .values({
          userId,
          planId,
          stripeSubscriptionId,
          stripeCustomerId,
          status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return created[0] || null;
    }
  } catch (error) {
    console.error('Error creating/updating subscription:', error);
    return null;
  }
}

export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: string, // Changed to string
  currentPeriodStart?: Date,
  currentPeriodEnd?: Date,
  cancelAtPeriodEnd?: boolean
): Promise<boolean> {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (currentPeriodStart) updateData.currentPeriodStart = currentPeriodStart;
    if (currentPeriodEnd) updateData.currentPeriodEnd = currentPeriodEnd;
    if (cancelAtPeriodEnd !== undefined) updateData.cancelAtPeriodEnd = cancelAtPeriodEnd;

    await db.update(userSubscriptions)
      .set(updateData)
      .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubscriptionId));

    return true;
  } catch (error) {
    console.error('Error updating subscription status:', error);
    return false;
  }
}

export async function cancelSubscription(stripeSubscriptionId: string): Promise<boolean> {
  try {
    await db.update(userSubscriptions)
      .set({
        status: 'canceled',
        updatedAt: new Date()
      })
      .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubscriptionId));

    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }
}

export async function updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<boolean> {
  try {
    await db.update(users)
      .set({
        stripeCustomerId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    return true;
  } catch (error) {
    console.error('Error updating user Stripe customer ID:', error);
    return false;
  }
}

export function getPlanDisplayName(planId: string): string {
  switch (planId) {
    case 'free':
      return 'Free Plan';
    case 'pro':
      return 'Pro Plan';
    case 'family':
      return 'Family Plan';
    default:
      return 'Unknown Plan';
  }
}

export function getMaxReportsForPlan(planId: string): number {
  switch (planId) {
    case 'free':
      return 3;
    case 'pro':
      return -1; // Unlimited
    case 'family':
      return -1; // Unlimited
    default:
      return 3; // Default to free plan limits
  }
}