import { 
  pgTable, 
  text, 
  timestamp, 
  uuid, 
  integer, 
  boolean, 
  jsonb,
  varchar,
  decimal
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table - extends Clerk user data
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  imageUrl: text('image_url'),
  stripeCustomerId: text('stripe_customer_id'),
  subscriptionPlan: text('subscription_plan').default('free'), // free, pro, family
  subscriptionStatus: text('subscription_status').default('active'), // active, cancelled, expired
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Health reports table
export const healthReports = pgTable('health_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  symptoms: jsonb('symptoms').notNull(), // Array of symptoms with severity
  aiAnalysis: jsonb('ai_analysis').notNull(), // AI diagnosis results
  riskLevel: text('risk_level').notNull(), // low, medium, high, critical
  confidence: decimal('confidence', { precision: 5, scale: 2 }).notNull(), // AI confidence percentage
  recommendations: jsonb('recommendations').notNull(), // Treatment recommendations
  urgencyLevel: integer('urgency_level').notNull(), // 1-5 scale
  followUpRequired: boolean('follow_up_required').default(false),
  doctorRecommended: boolean('doctor_recommended').default(false),
  status: text('status').default('completed'), // pending, completed, reviewed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Symptoms table - predefined symptoms database
export const symptoms = pgTable('symptoms', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  category: text('category').notNull(), // respiratory, cardiovascular, neurological, etc.
  description: text('description'),
  commonCauses: jsonb('common_causes'), // Array of common causes
  severity: integer('severity').notNull(), // 1-5 scale
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Medical conditions table
export const medicalConditions = pgTable('medical_conditions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  category: text('category').notNull(),
  description: text('description'),
  symptoms: jsonb('symptoms'), // Related symptom IDs
  severity: text('severity').notNull(), // mild, moderate, severe, critical
  treatmentOptions: jsonb('treatment_options'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User medical history
export const userMedicalHistory = pgTable('user_medical_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  allergies: jsonb('allergies'), // Array of allergies
  medications: jsonb('medications'), // Current medications
  chronicConditions: jsonb('chronic_conditions'), // Existing conditions
  familyHistory: jsonb('family_history'), // Family medical history
  lifestyle: jsonb('lifestyle'), // Smoking, drinking, exercise habits
  emergencyContact: jsonb('emergency_contact'), // Emergency contact info
  bloodType: text('blood_type'),
  height: decimal('height', { precision: 5, scale: 2 }), // in cm
  weight: decimal('weight', { precision: 5, scale: 2 }), // in kg
  dateOfBirth: timestamp('date_of_birth'),
  gender: text('gender'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI chat sessions
export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  messages: jsonb('messages').notNull(), // Array of chat messages
  relatedReportId: uuid('related_report_id').references(() => healthReports.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Subscription plans
export const subscriptionPlans = pgTable('subscription_plans', {
  id: text('id').primaryKey(), // free, pro, family
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  features: jsonb('features').notNull(), // Array of features
  maxReports: integer('max_reports'), // null for unlimited
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User subscriptions
export const userSubscriptions = pgTable('user_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  planId: text('plan_id').references(() => subscriptionPlans.id).notNull(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripeCustomerId: text('stripe_customer_id'),
  status: text('status').notNull(), // active, cancelled, past_due, unpaid
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Analytics and usage tracking
export const userAnalytics = pgTable('user_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  reportCount: integer('report_count').default(0),
  lastReportDate: timestamp('last_report_date'),
  totalChatMessages: integer('total_chat_messages').default(0),
  averageRiskLevel: decimal('average_risk_level', { precision: 3, scale: 2 }),
  mostCommonSymptoms: jsonb('most_common_symptoms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User privacy settings
export const userPrivacySettings = pgTable('user_privacy_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  dataEncryption: boolean('data_encryption').default(true),
  shareWithDoctors: boolean('share_with_doctors').default(false),
  anonymousAnalytics: boolean('anonymous_analytics').default(true),
  emailNotifications: boolean('email_notifications').default(true),
  smsNotifications: boolean('sms_notifications').default(false),
  dataRetention: text('data_retention').default('2-years'), // 6-months, 1-year, 2-years, 5-years, indefinite
  thirdPartySharing: boolean('third_party_sharing').default(false),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertHealthReportSchema = createInsertSchema(healthReports);
export const selectHealthReportSchema = createSelectSchema(healthReports);

export const insertUserMedicalHistorySchema = createInsertSchema(userMedicalHistory);
export const selectUserMedicalHistorySchema = createSelectSchema(userMedicalHistory);

export const insertChatSessionSchema = createInsertSchema(chatSessions);
export const selectChatSessionSchema = createSelectSchema(chatSessions);

export const insertUserPrivacySettingsSchema = createInsertSchema(userPrivacySettings);
export const selectUserPrivacySettingsSchema = createSelectSchema(userPrivacySettings);

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type HealthReport = typeof healthReports.$inferSelect;
export type NewHealthReport = typeof healthReports.$inferInsert;

export type UserMedicalHistory = typeof userMedicalHistory.$inferSelect;
export type NewUserMedicalHistory = typeof userMedicalHistory.$inferInsert;

export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;

export type Symptom = typeof symptoms.$inferSelect;
export type NewSymptom = typeof symptoms.$inferInsert;

export type MedicalCondition = typeof medicalConditions.$inferSelect;
export type NewMedicalCondition = typeof medicalConditions.$inferInsert;

export type UserPrivacySettings = typeof userPrivacySettings.$inferSelect;
export type NewUserPrivacySettings = typeof userPrivacySettings.$inferInsert;