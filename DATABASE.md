# Database Setup Guide

## Prerequisites

1. **Create a Neon Database**:
   - Go to [Neon Console](https://console.neon.tech)
   - Create a new project
   - Copy your connection string

2. **Update Environment Variables**:
   ```bash
   # Replace with your actual Neon connection string
   DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

## Database Commands

```bash
# Generate migration files
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Run migrations (for production)
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio

# Seed the database with initial data
npm run db:seed
```

## Schema Overview

### Core Tables

1. **users** - User profiles (extends Clerk data)
2. **health_reports** - AI-generated health analysis
3. **user_medical_history** - Personal medical information
4. **chat_sessions** - AI chat conversations
5. **symptoms** - Predefined symptoms database
6. **medical_conditions** - Medical conditions database
7. **subscription_plans** - Available plans (free, pro, family)
8. **user_subscriptions** - User subscription tracking
9. **user_analytics** - Usage analytics

### Key Features

- **Clerk Integration**: Users table syncs with Clerk authentication
- **JSONB Fields**: Flexible storage for symptoms, AI analysis, recommendations
- **Subscription Management**: Built-in support for Stripe subscriptions
- **Analytics**: Track user behavior and health patterns
- **Type Safety**: Full TypeScript support with Zod validation

## Usage Example

```typescript
import { db } from '@/lib/db';
import { users, healthReports } from '@/lib/db/schema';

// Create a new health report
const report = await db.insert(healthReports).values({
  userId: 'user_123',
  title: 'Headache Analysis',
  symptoms: [
    { name: 'headache', severity: 7 },
    { name: 'nausea', severity: 3 }
  ],
  aiAnalysis: {
    diagnosis: 'Tension headache',
    confidence: 85
  },
  riskLevel: 'low',
  confidence: '85.00'
});
```