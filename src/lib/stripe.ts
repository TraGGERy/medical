import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}
// Create a Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

export const STRIPE_CONFIG = {
  PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID!,
  FAMILY_PRICE_ID: process.env.STRIPE_FAMILY_PRICE_ID!,
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

// Validate required environment variables
if (!STRIPE_CONFIG.PRO_PRICE_ID) {
  throw new Error('STRIPE_PRO_PRICE_ID is not set in environment variables');
}

if (!STRIPE_CONFIG.FAMILY_PRICE_ID) {
  throw new Error('STRIPE_FAMILY_PRICE_ID is not set in environment variables');
}

if (!STRIPE_CONFIG.WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set in environment variables');
}