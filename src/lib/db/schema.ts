import { 
  pgTable, 
  text, 
  timestamp, 
  uuid, 
  integer, 
  boolean, 
  jsonb,
  decimal
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

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

// Real-time Health Monitoring Tables
export const realtimeHealthData = pgTable('realtime_health_data', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  dataType: text('data_type').notNull(), // 'heart_rate', 'blood_pressure', 'temperature', 'symptoms'
  value: jsonb('value').notNull(), // Flexible data structure for different metrics
  unit: text('unit'), // 'bpm', 'mmHg', 'celsius', etc.
  source: text('source').notNull(), // 'manual', 'device', 'ai_analysis'
  deviceId: text('device_id'), // Reference to connected device
  timestamp: timestamp('timestamp').notNull(),
  isProcessed: boolean('is_processed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Alert Thresholds Configuration
export const alertThresholds = pgTable('alert_thresholds', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  dataType: text('data_type').notNull(), // 'heart_rate', 'blood_pressure', etc.
  minValue: decimal('min_value', { precision: 10, scale: 2 }),
  maxValue: decimal('max_value', { precision: 10, scale: 2 }),
  severity: text('severity').notNull(), // 'low', 'medium', 'high', 'critical'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Real-time Health Alerts
export const healthAlerts = pgTable('health_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  alertType: text('alert_type').notNull(), // 'threshold_breach', 'anomaly_detected', 'emergency'
  severity: text('severity').notNull(), // 'low', 'medium', 'high', 'critical'
  title: text('title').notNull(),
  message: text('message').notNull(),
  dataSnapshot: jsonb('data_snapshot'), // Related health data at time of alert
  thresholdId: uuid('threshold_id').references(() => alertThresholds.id),
  isRead: boolean('is_read').default(false),
  isResolved: boolean('is_resolved').default(false),
  resolvedAt: timestamp('resolved_at'),
  notificationsSent: jsonb('notifications_sent'), // Track which notifications were sent
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Real-time Analysis Jobs
export const analysisJobs = pgTable('analysis_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  jobType: text('job_type').notNull(), // 'continuous_monitoring', 'trend_analysis', 'anomaly_detection'
  status: text('status').notNull(), // 'pending', 'running', 'completed', 'failed'
  inputData: jsonb('input_data').notNull(),
  outputData: jsonb('output_data'),
  errorMessage: text('error_message'),
  priority: integer('priority').default(1), // 1-5, higher number = higher priority
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// WebSocket Connection Tracking
export const websocketConnections = pgTable('websocket_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  connectionId: text('connection_id').notNull().unique(),
  deviceInfo: jsonb('device_info'), // Browser, OS, etc.
  isActive: boolean('is_active').default(true),
  lastPing: timestamp('last_ping').defaultNow(),
  connectedAt: timestamp('connected_at').defaultNow().notNull(),
  disconnectedAt: timestamp('disconnected_at'),
});

// Notification Queue
export const notificationQueue = pgTable('notification_queue', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  alertId: uuid('alert_id').references(() => healthAlerts.id),
  notificationType: text('notification_type').notNull(), // 'push', 'email', 'sms', 'websocket'
  recipient: text('recipient').notNull(), // email, phone, or connection_id
  title: text('title').notNull(),
  message: text('message').notNull(),
  payload: jsonb('payload'), // Additional data for the notification
  status: text('status').default('pending'), // 'pending', 'sent', 'failed', 'delivered'
  attempts: integer('attempts').default(0),
  maxAttempts: integer('max_attempts').default(3),
  scheduledAt: timestamp('scheduled_at').defaultNow(),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Zod schemas for new tables
export const insertRealtimeHealthDataSchema = createInsertSchema(realtimeHealthData);
export const selectRealtimeHealthDataSchema = createSelectSchema(realtimeHealthData);

export const insertAlertThresholdSchema = createInsertSchema(alertThresholds);
export const selectAlertThresholdSchema = createSelectSchema(alertThresholds);

export const insertHealthAlertSchema = createInsertSchema(healthAlerts);
export const selectHealthAlertSchema = createSelectSchema(healthAlerts);

export const insertAnalysisJobSchema = createInsertSchema(analysisJobs);
export const selectAnalysisJobSchema = createSelectSchema(analysisJobs);

export const insertWebsocketConnectionSchema = createInsertSchema(websocketConnections);
export const selectWebsocketConnectionSchema = createSelectSchema(websocketConnections);

export const insertNotificationQueueSchema = createInsertSchema(notificationQueue);
export const selectNotificationQueueSchema = createSelectSchema(notificationQueue);

// Telemedicine Tables

// Healthcare Providers
export const healthcareProviders = pgTable('healthcare_providers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  licenseNumber: text('license_number').notNull().unique(),
  specialty: text('specialty').notNull(),
  subSpecialty: text('sub_specialty'),
  verificationStatus: text('verification_status').default('pending'), // pending, verified, rejected
  practiceName: text('practice_name'),
  practiceAddress: jsonb('practice_address'), // Address object
  yearsOfExperience: integer('years_of_experience'),
  education: jsonb('education'), // Array of education details
  certifications: jsonb('certifications'), // Array of certifications
  languages: jsonb('languages'), // Array of languages spoken
  bio: text('bio'),
  consultationFee: decimal('consultation_fee', { precision: 10, scale: 2 }),
  currency: text('currency').default('USD'),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  totalReviews: integer('total_reviews').default(0),
  isActive: boolean('is_active').default(true),
  isAvailable: boolean('is_available').default(true),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Provider Specialties (Reference table)
export const providerSpecialties = pgTable('provider_specialties', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  category: text('category').notNull(), // primary_care, specialist, mental_health, etc.
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Provider Availability
export const providerAvailability = pgTable('provider_availability', {
  id: uuid('id').defaultRandom().primaryKey(),
  providerId: uuid('provider_id').references(() => healthcareProviders.id, { onDelete: 'cascade' }).notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6 (Sunday-Saturday)
  startTime: text('start_time').notNull(), // HH:MM format
  endTime: text('end_time').notNull(), // HH:MM format
  timezone: text('timezone').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Telemedicine Appointments
export const telemedicineAppointments = pgTable('telemedicine_appointments', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: text('patient_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  providerId: uuid('provider_id').references(() => healthcareProviders.id, { onDelete: 'cascade' }).notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  durationMinutes: integer('duration_minutes').default(30),
  status: text('status').default('scheduled'), // scheduled, confirmed, in_progress, completed, cancelled, no_show
  appointmentType: text('appointment_type').notNull(), // consultation, follow_up, emergency
  meetingRoomId: text('meeting_room_id'),
  meetingUrl: text('meeting_url'),
  reasonForVisit: text('reason_for_visit'),
  symptoms: jsonb('symptoms'), // Array of symptoms
  urgencyLevel: integer('urgency_level').default(1), // 1-5 scale
  patientNotes: text('patient_notes'),
  remindersSent: jsonb('reminders_sent'), // Track sent reminders
  rescheduledFrom: uuid('rescheduled_from'),
  cancelledBy: text('cancelled_by'), // patient, provider, system
  cancellationReason: text('cancellation_reason'),
  fee: decimal('fee', { precision: 10, scale: 2 }),
  paymentStatus: text('payment_status').default('pending'), // pending, paid, refunded
  paymentId: text('payment_id'), // Stripe payment intent ID
  confirmedAt: timestamp('confirmed_at'),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  cancelledAt: timestamp('cancelled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Consultation Notes
export const consultationNotes = pgTable('consultation_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  appointmentId: uuid('appointment_id').references(() => telemedicineAppointments.id, { onDelete: 'cascade' }).notNull(),
  providerId: uuid('provider_id').references(() => healthcareProviders.id, { onDelete: 'cascade' }).notNull(),
  patientId: text('patient_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  chiefComplaint: text('chief_complaint'),
  historyOfPresentIllness: text('history_of_present_illness'),
  physicalExamination: text('physical_examination'),
  vitalSigns: jsonb('vital_signs'), // Blood pressure, heart rate, etc.
  assessment: text('assessment'),
  diagnosis: jsonb('diagnosis'), // Array of diagnoses
  treatmentPlan: text('treatment_plan'),
  prescriptions: jsonb('prescriptions'), // Array of prescribed medications
  recommendations: jsonb('recommendations'), // Array of recommendations
  followUpInstructions: text('follow_up_instructions'),
  followUpDate: timestamp('follow_up_date'),
  referrals: jsonb('referrals'), // Array of specialist referrals
  labOrders: jsonb('lab_orders'), // Array of lab test orders
  imagingOrders: jsonb('imaging_orders'), // Array of imaging orders
  patientEducation: text('patient_education'),
  warningSignsDiscussed: text('warning_signs_discussed'),
  returnPrecautions: text('return_precautions'),
  isSharedWithPatient: boolean('is_shared_with_patient').default(false),
  sharedAt: timestamp('shared_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Provider Reviews
export const providerReviews = pgTable('provider_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  providerId: uuid('provider_id').references(() => healthcareProviders.id, { onDelete: 'cascade' }).notNull(),
  patientId: text('patient_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  appointmentId: uuid('appointment_id').references(() => telemedicineAppointments.id, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').notNull(), // 1-5 stars
  reviewText: text('review_text'),
  categories: jsonb('categories'), // Communication, punctuality, expertise, etc.
  isAnonymous: boolean('is_anonymous').default(false),
  isVerified: boolean('is_verified').default(true),
  isPublic: boolean('is_public').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Prescription Management
export const prescriptions = pgTable('prescriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  appointmentId: uuid('appointment_id').references(() => telemedicineAppointments.id, { onDelete: 'cascade' }).notNull(),
  providerId: uuid('provider_id').references(() => healthcareProviders.id, { onDelete: 'cascade' }).notNull(),
  patientId: text('patient_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  medicationName: text('medication_name').notNull(),
  dosage: text('dosage').notNull(),
  frequency: text('frequency').notNull(),
  duration: text('duration').notNull(),
  instructions: text('instructions'),
  refills: integer('refills').default(0),
  pharmacyInfo: jsonb('pharmacy_info'), // Preferred pharmacy details
  status: text('status').default('active'), // active, completed, cancelled, expired
  prescribedAt: timestamp('prescribed_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Zod schemas for telemedicine tables
export const insertHealthcareProviderSchema = createInsertSchema(healthcareProviders);
export const selectHealthcareProviderSchema = createSelectSchema(healthcareProviders);

export const insertProviderSpecialtySchema = createInsertSchema(providerSpecialties);
export const selectProviderSpecialtySchema = createSelectSchema(providerSpecialties);

export const insertProviderAvailabilitySchema = createInsertSchema(providerAvailability);
export const selectProviderAvailabilitySchema = createSelectSchema(providerAvailability);

export const insertTelemedicineAppointmentSchema = createInsertSchema(telemedicineAppointments);
export const selectTelemedicineAppointmentSchema = createSelectSchema(telemedicineAppointments);

export const insertConsultationNotesSchema = createInsertSchema(consultationNotes);
export const selectConsultationNotesSchema = createSelectSchema(consultationNotes);

export const insertProviderReviewSchema = createInsertSchema(providerReviews);
export const selectProviderReviewSchema = createSelectSchema(providerReviews);

export const insertPrescriptionSchema = createInsertSchema(prescriptions);
export const selectPrescriptionSchema = createSelectSchema(prescriptions);

// AI Provider Tables
export const aiProviders = pgTable('ai_providers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  specialty: text('specialty').notNull(),
  subSpecialty: text('sub_specialty'),
  bio: text('bio').notNull(),
  profileImageUrl: text('profile_image_url'),
  yearsOfExperience: integer('years_of_experience').notNull(),
  education: jsonb('education').notNull(),
  certifications: jsonb('certifications'),
  languages: jsonb('languages').notNull(),
  consultationFee: decimal('consultation_fee', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('5.00'),
  totalConsultations: integer('total_consultations').default(0),
  availability: jsonb('availability').notNull(), // 24/7 availability schedule
  responseTimeSeconds: integer('response_time_seconds').default(1),
  aiModel: text('ai_model').default('gpt-4'),
  personalityTraits: jsonb('personality_traits').notNull(),
  specializations: jsonb('specializations').notNull(), // specific areas within specialty
  consultationStyle: text('consultation_style').notNull(),
  isActive: boolean('is_active').default(true),
  isAvailable: boolean('is_available').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const aiConsultations = pgTable('ai_consultations', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: text('patient_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  aiProviderId: uuid('ai_provider_id').references(() => aiProviders.id, { onDelete: 'cascade' }).notNull(),
  sessionId: text('session_id').notNull().unique(),
  status: text('status').default('active'), // active, completed, transferred
  reasonForVisit: text('reason_for_visit').notNull(),
  symptoms: jsonb('symptoms'),
  urgencyLevel: integer('urgency_level').default(1),
  patientAge: integer('patient_age'),
  patientGender: text('patient_gender'),
  medicalHistory: jsonb('medical_history'),
  currentMedications: jsonb('current_medications'),
  allergies: jsonb('allergies'),
  aiAssessment: jsonb('ai_assessment'),
  recommendations: jsonb('recommendations'),
  referralSuggested: boolean('referral_suggested').default(false),
  referralReason: text('referral_reason'),
  handoffToHuman: boolean('handoff_to_human').default(false),
  handoffReason: text('handoff_reason'),
  handoffProviderId: uuid('handoff_provider_id').references(() => healthcareProviders.id),
  satisfactionRating: integer('satisfaction_rating'),
  feedback: text('feedback'),
  totalMessages: integer('total_messages').default(0),
  durationMinutes: integer('duration_minutes'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const consultationMessages = pgTable('consultation_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  consultationId: uuid('consultation_id').references(() => aiConsultations.id, { onDelete: 'cascade' }).notNull(),
  senderId: text('sender_id').notNull(), // user ID or 'ai'
  senderType: text('sender_type').notNull(), // 'patient' or 'ai'
  message: text('message').notNull(),
  messageType: text('message_type').default('text'), // text, image, file, assessment
  metadata: jsonb('metadata'), // additional data like AI confidence, processing time
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const providerHandoffs = pgTable('provider_handoffs', {
  id: uuid('id').defaultRandom().primaryKey(),
  aiConsultationId: uuid('ai_consultation_id').references(() => aiConsultations.id, { onDelete: 'cascade' }).notNull(),
  fromAiProviderId: uuid('from_ai_provider_id').references(() => aiProviders.id, { onDelete: 'cascade' }).notNull(),
  toHumanProviderId: uuid('to_human_provider_id').references(() => healthcareProviders.id, { onDelete: 'cascade' }).notNull(),
  reason: text('reason').notNull(),
  aiSummary: text('ai_summary').notNull(),
  patientConsent: boolean('patient_consent').default(false),
  status: text('status').default('pending'), // pending, accepted, declined, completed
  urgencyLevel: integer('urgency_level').default(1),
  scheduledAppointmentId: uuid('scheduled_appointment_id').references(() => telemedicineAppointments.id),
  handoffNotes: text('handoff_notes'),
  responseTime: integer('response_time'), // minutes to respond
  acceptedAt: timestamp('accepted_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for AI provider tables
export const insertAiProviderSchema = createInsertSchema(aiProviders);
export const selectAiProviderSchema = createSelectSchema(aiProviders);

export const insertAiConsultationSchema = createInsertSchema(aiConsultations);
export const selectAiConsultationSchema = createSelectSchema(aiConsultations);

export const insertConsultationMessageSchema = createInsertSchema(consultationMessages);
export const selectConsultationMessageSchema = createSelectSchema(consultationMessages);

export const insertProviderHandoffSchema = createInsertSchema(providerHandoffs);
export const selectProviderHandoffSchema = createSelectSchema(providerHandoffs);

// Health Calendar Tables (imported from drizzle schema)
export const dailyCheckins = pgTable('daily_checkins', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  checkinDate: timestamp('checkin_date').notNull(),
  moodRating: integer('mood_rating'), // 1-10 scale
  energyLevel: integer('energy_level'), // 1-10 scale
  sleepQuality: integer('sleep_quality'), // 1-10 scale
  sleepHours: decimal('sleep_hours', { precision: 3, scale: 1 }),
  stressLevel: integer('stress_level'), // 1-10 scale
  exerciseMinutes: integer('exercise_minutes'),
  waterIntake: decimal('water_intake', { precision: 4, scale: 1 }), // in liters
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const healthEvents = pgTable('health_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  eventType: text('event_type').notNull(), // symptom, medication, appointment, exercise, meal
  title: text('title').notNull(),
  description: text('description'),
  severity: integer('severity'), // 1-10 scale for symptoms
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  isOngoing: boolean('is_ongoing').default(false),
  frequency: text('frequency'), // daily, weekly, as-needed, etc.
  dosage: text('dosage'), // for medications
  unit: text('unit'), // mg, ml, etc.
  tags: jsonb('tags'),
  metadata: jsonb('metadata'), // additional event-specific data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const checkinSymptoms = pgTable('checkin_symptoms', {
  id: uuid('id').defaultRandom().primaryKey(),
  checkinId: uuid('checkin_id').references(() => dailyCheckins.id, { onDelete: 'cascade' }).notNull(),
  symptomName: text('symptom_name').notNull(),
  severity: integer('severity').notNull(), // 1-10 scale
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const checkinMedications = pgTable('checkin_medications', {
  id: uuid('id').defaultRandom().primaryKey(),
  checkinId: uuid('checkin_id').references(() => dailyCheckins.id, { onDelete: 'cascade' }).notNull(),
  medicationName: text('medication_name').notNull(),
  dosage: text('dosage').notNull(),
  taken: boolean('taken').default(false),
  timesTaken: integer('times_taken').default(0),
  timesScheduled: integer('times_scheduled').default(1),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const healthNotifications = pgTable('health_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  notificationType: text('notification_type').notNull(), // persistent_symptom, medication_reminder, streak_milestone
  title: text('title').notNull(),
  message: text('message').notNull(),
  relatedEventId: uuid('related_event_id').references(() => healthEvents.id),
  triggerCondition: jsonb('trigger_condition'), // conditions that triggered this notification
  status: text('status').default('pending'), // pending, sent, failed
  scheduledAt: timestamp('scheduled_at'),
  sentAt: timestamp('sent_at'),
  emailSent: boolean('email_sent').default(false),
  pushSent: boolean('push_sent').default(false),
  priority: text('priority').default('medium'), // low, medium, high, urgent
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const streakRecords = pgTable('streak_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  streakType: text('streak_type').notNull(), // daily_checkin, medication_adherence, exercise
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastActivityDate: timestamp('last_activity_date'),
  streakStartDate: timestamp('streak_start_date'),
  totalActivities: integer('total_activities').default(0),
  milestones: jsonb('milestones'), // achieved milestones
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const healthPatterns = pgTable('health_patterns', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  patternType: text('pattern_type').notNull(), // correlation, trend, anomaly
  title: text('title').notNull(),
  description: text('description').notNull(),
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
  dataPoints: jsonb('data_points'), // supporting data for the pattern
  correlations: jsonb('correlations'), // related health metrics
  insights: jsonb('insights'), // AI-generated insights
  recommendations: jsonb('recommendations'), // suggested actions
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for health calendar tables
export const insertDailyCheckinSchema = createInsertSchema(dailyCheckins);
export const selectDailyCheckinSchema = createSelectSchema(dailyCheckins);

export const insertHealthEventSchema = createInsertSchema(healthEvents);
export const selectHealthEventSchema = createSelectSchema(healthEvents);

export const insertCheckinSymptomSchema = createInsertSchema(checkinSymptoms);
export const selectCheckinSymptomSchema = createSelectSchema(checkinSymptoms);

export const insertCheckinMedicationSchema = createInsertSchema(checkinMedications);
export const selectCheckinMedicationSchema = createSelectSchema(checkinMedications);

export const insertHealthNotificationSchema = createInsertSchema(healthNotifications);
export const selectHealthNotificationSchema = createSelectSchema(healthNotifications);

export const insertStreakRecordSchema = createInsertSchema(streakRecords);
export const selectStreakRecordSchema = createSelectSchema(streakRecords);

export const insertHealthPatternSchema = createInsertSchema(healthPatterns);
export const selectHealthPatternSchema = createSelectSchema(healthPatterns);

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

// Real-time monitoring types
export type RealtimeHealthData = typeof realtimeHealthData.$inferSelect;
export type NewRealtimeHealthData = typeof realtimeHealthData.$inferInsert;

export type AlertThreshold = typeof alertThresholds.$inferSelect;
export type NewAlertThreshold = typeof alertThresholds.$inferInsert;

export type HealthAlert = typeof healthAlerts.$inferSelect;
export type NewHealthAlert = typeof healthAlerts.$inferInsert;

export type AnalysisJob = typeof analysisJobs.$inferSelect;
export type NewAnalysisJob = typeof analysisJobs.$inferInsert;

export type WebsocketConnection = typeof websocketConnections.$inferSelect;
export type NewWebsocketConnection = typeof websocketConnections.$inferInsert;

export type NotificationQueue = typeof notificationQueue.$inferSelect;
export type NewNotificationQueue = typeof notificationQueue.$inferInsert;

// Telemedicine types
export type HealthcareProvider = typeof healthcareProviders.$inferSelect;
export type NewHealthcareProvider = typeof healthcareProviders.$inferInsert;

export type ProviderSpecialty = typeof providerSpecialties.$inferSelect;
export type NewProviderSpecialty = typeof providerSpecialties.$inferInsert;

export type ProviderAvailability = typeof providerAvailability.$inferSelect;
export type NewProviderAvailability = typeof providerAvailability.$inferInsert;

export type TelemedicineAppointment = typeof telemedicineAppointments.$inferSelect;
export type NewTelemedicineAppointment = typeof telemedicineAppointments.$inferInsert;

export type ConsultationNotes = typeof consultationNotes.$inferSelect;
export type NewConsultationNotes = typeof consultationNotes.$inferInsert;

export type ProviderReview = typeof providerReviews.$inferSelect;
export type NewProviderReview = typeof providerReviews.$inferInsert;

export type Prescription = typeof prescriptions.$inferSelect;
export type NewPrescription = typeof prescriptions.$inferInsert;

// Health Calendar types
export type DailyCheckin = typeof dailyCheckins.$inferSelect;
export type NewDailyCheckin = typeof dailyCheckins.$inferInsert;

export type HealthEvent = typeof healthEvents.$inferSelect;
export type NewHealthEvent = typeof healthEvents.$inferInsert;

export type CheckinSymptom = typeof checkinSymptoms.$inferSelect;
export type NewCheckinSymptom = typeof checkinSymptoms.$inferInsert;

export type CheckinMedication = typeof checkinMedications.$inferSelect;
export type NewCheckinMedication = typeof checkinMedications.$inferInsert;

export type HealthNotification = typeof healthNotifications.$inferSelect;
export type NewHealthNotification = typeof healthNotifications.$inferInsert;

export type StreakRecord = typeof streakRecords.$inferSelect;
export type NewStreakRecord = typeof streakRecords.$inferInsert;

export type HealthPattern = typeof healthPatterns.$inferSelect;
export type NewHealthPattern = typeof healthPatterns.$inferInsert;