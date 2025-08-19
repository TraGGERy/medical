import { pgTable, foreignKey, uuid, text, jsonb, integer, timestamp, boolean, numeric, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const analysisJobs = pgTable("analysis_jobs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	jobType: text("job_type").notNull(),
	status: text().notNull(),
	inputData: jsonb("input_data").notNull(),
	outputData: jsonb("output_data"),
	errorMessage: text("error_message"),
	priority: integer().default(1),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "analysis_jobs_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const healthAlerts = pgTable("health_alerts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	alertType: text("alert_type").notNull(),
	severity: text().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	dataSnapshot: jsonb("data_snapshot"),
	thresholdId: uuid("threshold_id"),
	isRead: boolean("is_read").default(false),
	isResolved: boolean("is_resolved").default(false),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	notificationsSent: jsonb("notifications_sent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "health_alerts_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.thresholdId],
			foreignColumns: [alertThresholds.id],
			name: "health_alerts_threshold_id_alert_thresholds_id_fk"
		}),
]);

export const notificationQueue = pgTable("notification_queue", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	alertId: uuid("alert_id"),
	notificationType: text("notification_type").notNull(),
	recipient: text().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	payload: jsonb(),
	status: text().default('pending'),
	attempts: integer().default(0),
	maxAttempts: integer("max_attempts").default(3),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }).defaultNow(),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { mode: 'string' }),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notification_queue_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.alertId],
			foreignColumns: [healthAlerts.id],
			name: "notification_queue_alert_id_health_alerts_id_fk"
		}),
]);

export const alertThresholds = pgTable("alert_thresholds", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	dataType: text("data_type").notNull(),
	minValue: numeric("min_value", { precision: 10, scale:  2 }),
	maxValue: numeric("max_value", { precision: 10, scale:  2 }),
	severity: text().notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "alert_thresholds_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const providerReviews = pgTable("provider_reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	providerId: uuid("provider_id").notNull(),
	patientId: text("patient_id").notNull(),
	appointmentId: uuid("appointment_id").notNull(),
	rating: integer().notNull(),
	reviewText: text("review_text"),
	categories: jsonb(),
	isAnonymous: boolean("is_anonymous").default(false),
	isVerified: boolean("is_verified").default(true),
	isPublic: boolean("is_public").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.providerId],
			foreignColumns: [healthcareProviders.id],
			name: "provider_reviews_provider_id_healthcare_providers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [users.id],
			name: "provider_reviews_patient_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.appointmentId],
			foreignColumns: [telemedicineAppointments.id],
			name: "provider_reviews_appointment_id_telemedicine_appointments_id_fk"
		}).onDelete("cascade"),
]);

export const realtimeHealthData = pgTable("realtime_health_data", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	dataType: text("data_type").notNull(),
	value: jsonb().notNull(),
	unit: text(),
	source: text().notNull(),
	deviceId: text("device_id"),
	timestamp: timestamp({ mode: 'string' }).notNull(),
	isProcessed: boolean("is_processed").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "realtime_health_data_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const userPrivacySettings = pgTable("user_privacy_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	dataEncryption: boolean("data_encryption").default(true),
	shareWithDoctors: boolean("share_with_doctors").default(false),
	anonymousAnalytics: boolean("anonymous_analytics").default(true),
	emailNotifications: boolean("email_notifications").default(true),
	smsNotifications: boolean("sms_notifications").default(false),
	dataRetention: text("data_retention").default('2-years'),
	thirdPartySharing: boolean("third_party_sharing").default(false),
	twoFactorEnabled: boolean("two_factor_enabled").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_privacy_settings_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_privacy_settings_user_id_unique").on(table.userId),
]);

export const websocketConnections = pgTable("websocket_connections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	connectionId: text("connection_id").notNull(),
	deviceInfo: jsonb("device_info"),
	isActive: boolean("is_active").default(true),
	lastPing: timestamp("last_ping", { mode: 'string' }).defaultNow(),
	connectedAt: timestamp("connected_at", { mode: 'string' }).defaultNow().notNull(),
	disconnectedAt: timestamp("disconnected_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "websocket_connections_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("websocket_connections_connection_id_unique").on(table.connectionId),
]);

export const providerAvailability = pgTable("provider_availability", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	providerId: uuid("provider_id").notNull(),
	dayOfWeek: integer("day_of_week").notNull(),
	startTime: text("start_time").notNull(),
	endTime: text("end_time").notNull(),
	timezone: text().notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.providerId],
			foreignColumns: [healthcareProviders.id],
			name: "provider_availability_provider_id_healthcare_providers_id_fk"
		}).onDelete("cascade"),
]);

export const providerSpecialties = pgTable("provider_specialties", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	category: text().notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("provider_specialties_name_unique").on(table.name),
]);

export const healthcareProviders = pgTable("healthcare_providers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	licenseNumber: text("license_number").notNull(),
	specialty: text().notNull(),
	subSpecialty: text("sub_specialty"),
	verificationStatus: text("verification_status").default('pending'),
	practiceName: text("practice_name"),
	practiceAddress: jsonb("practice_address"),
	yearsOfExperience: integer("years_of_experience"),
	education: jsonb(),
	certifications: jsonb(),
	languages: jsonb(),
	bio: text(),
	consultationFee: numeric("consultation_fee", { precision: 10, scale:  2 }),
	currency: text().default('USD'),
	rating: numeric({ precision: 3, scale:  2 }).default('0.00'),
	totalReviews: integer("total_reviews").default(0),
	isActive: boolean("is_active").default(true),
	isAvailable: boolean("is_available").default(true),
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "healthcare_providers_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("healthcare_providers_license_number_unique").on(table.licenseNumber),
]);

export const prescriptions = pgTable("prescriptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	appointmentId: uuid("appointment_id").notNull(),
	providerId: uuid("provider_id").notNull(),
	patientId: text("patient_id").notNull(),
	medicationName: text("medication_name").notNull(),
	dosage: text().notNull(),
	frequency: text().notNull(),
	duration: text().notNull(),
	instructions: text(),
	refills: integer().default(0),
	pharmacyInfo: jsonb("pharmacy_info"),
	status: text().default('active'),
	prescribedAt: timestamp("prescribed_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.appointmentId],
			foreignColumns: [telemedicineAppointments.id],
			name: "prescriptions_appointment_id_telemedicine_appointments_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.providerId],
			foreignColumns: [healthcareProviders.id],
			name: "prescriptions_provider_id_healthcare_providers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [users.id],
			name: "prescriptions_patient_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const healthReports = pgTable("health_reports", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	title: text().notNull(),
	symptoms: jsonb().notNull(),
	aiAnalysis: jsonb("ai_analysis").notNull(),
	riskLevel: text("risk_level").notNull(),
	confidence: numeric({ precision: 5, scale:  2 }).notNull(),
	recommendations: jsonb().notNull(),
	urgencyLevel: integer("urgency_level").notNull(),
	followUpRequired: boolean("follow_up_required").default(false),
	doctorRecommended: boolean("doctor_recommended").default(false),
	status: text().default('completed'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "health_reports_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const userAnalytics = pgTable("user_analytics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	reportCount: integer("report_count").default(0),
	lastReportDate: timestamp("last_report_date", { mode: 'string' }),
	totalChatMessages: integer("total_chat_messages").default(0),
	averageRiskLevel: numeric("average_risk_level", { precision: 3, scale:  2 }),
	mostCommonSymptoms: jsonb("most_common_symptoms"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_analytics_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const medicalConditions = pgTable("medical_conditions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	category: text().notNull(),
	description: text(),
	symptoms: jsonb(),
	severity: text().notNull(),
	treatmentOptions: jsonb("treatment_options"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("medical_conditions_name_unique").on(table.name),
]);

export const symptoms = pgTable("symptoms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	category: text().notNull(),
	description: text(),
	commonCauses: jsonb("common_causes"),
	severity: integer().notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("symptoms_name_unique").on(table.name),
]);

export const userMedicalHistory = pgTable("user_medical_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	allergies: jsonb(),
	medications: jsonb(),
	chronicConditions: jsonb("chronic_conditions"),
	familyHistory: jsonb("family_history"),
	lifestyle: jsonb(),
	emergencyContact: jsonb("emergency_contact"),
	bloodType: text("blood_type"),
	height: numeric({ precision: 5, scale:  2 }),
	weight: numeric({ precision: 5, scale:  2 }),
	dateOfBirth: timestamp("date_of_birth", { mode: 'string' }),
	gender: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_medical_history_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const subscriptionPlans = pgTable("subscription_plans", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	currency: text().default('USD'),
	features: jsonb().notNull(),
	maxReports: integer("max_reports"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const chatSessions = pgTable("chat_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	title: text().notNull(),
	messages: jsonb().notNull(),
	relatedReportId: uuid("related_report_id"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chat_sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.relatedReportId],
			foreignColumns: [healthReports.id],
			name: "chat_sessions_related_report_id_health_reports_id_fk"
		}),
]);

export const userSubscriptions = pgTable("user_subscriptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	planId: text("plan_id").notNull(),
	stripeSubscriptionId: text("stripe_subscription_id"),
	stripeCustomerId: text("stripe_customer_id"),
	status: text().notNull(),
	currentPeriodStart: timestamp("current_period_start", { mode: 'string' }).notNull(),
	currentPeriodEnd: timestamp("current_period_end", { mode: 'string' }).notNull(),
	cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_subscriptions_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.planId],
			foreignColumns: [subscriptionPlans.id],
			name: "user_subscriptions_plan_id_subscription_plans_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	imageUrl: text("image_url"),
	subscriptionPlan: text("subscription_plan").default('free'),
	subscriptionStatus: text("subscription_status").default('active'),
	subscriptionExpiresAt: timestamp("subscription_expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	stripeCustomerId: text("stripe_customer_id"),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const consultationNotes = pgTable("consultation_notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	appointmentId: uuid("appointment_id").notNull(),
	providerId: uuid("provider_id").notNull(),
	patientId: text("patient_id").notNull(),
	chiefComplaint: text("chief_complaint"),
	historyOfPresentIllness: text("history_of_present_illness"),
	physicalExamination: text("physical_examination"),
	vitalSigns: jsonb("vital_signs"),
	assessment: text(),
	diagnosis: jsonb(),
	treatmentPlan: text("treatment_plan"),
	prescriptions: jsonb(),
	recommendations: jsonb(),
	followUpInstructions: text("follow_up_instructions"),
	followUpDate: timestamp("follow_up_date", { mode: 'string' }),
	referrals: jsonb(),
	labOrders: jsonb("lab_orders"),
	imagingOrders: jsonb("imaging_orders"),
	patientEducation: text("patient_education"),
	warningSignsDiscussed: text("warning_signs_discussed"),
	returnPrecautions: text("return_precautions"),
	isSharedWithPatient: boolean("is_shared_with_patient").default(false),
	sharedAt: timestamp("shared_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.appointmentId],
			foreignColumns: [telemedicineAppointments.id],
			name: "consultation_notes_appointment_id_telemedicine_appointments_id_"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.providerId],
			foreignColumns: [healthcareProviders.id],
			name: "consultation_notes_provider_id_healthcare_providers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [users.id],
			name: "consultation_notes_patient_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const telemedicineAppointments = pgTable("telemedicine_appointments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	patientId: text("patient_id").notNull(),
	providerId: uuid("provider_id").notNull(),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }).notNull(),
	durationMinutes: integer("duration_minutes").default(30),
	status: text().default('scheduled'),
	appointmentType: text("appointment_type").notNull(),
	meetingRoomId: text("meeting_room_id"),
	meetingUrl: text("meeting_url"),
	reasonForVisit: text("reason_for_visit"),
	symptoms: jsonb(),
	urgencyLevel: integer("urgency_level").default(1),
	patientNotes: text("patient_notes"),
	remindersSent: jsonb("reminders_sent"),
	rescheduledFrom: uuid("rescheduled_from"),
	cancelledBy: text("cancelled_by"),
	cancellationReason: text("cancellation_reason"),
	fee: numeric({ precision: 10, scale:  2 }),
	paymentStatus: text("payment_status").default('pending'),
	paymentId: text("payment_id"),
	confirmedAt: timestamp("confirmed_at", { mode: 'string' }),
	startedAt: timestamp("started_at", { mode: 'string' }),
	endedAt: timestamp("ended_at", { mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [users.id],
			name: "telemedicine_appointments_patient_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.providerId],
			foreignColumns: [healthcareProviders.id],
			name: "telemedicine_appointments_provider_id_healthcare_providers_id_f"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.rescheduledFrom],
			foreignColumns: [table.id],
			name: "telemedicine_appointments_rescheduled_from_telemedicine_appoint"
		}),
]);

// AI Provider Tables
export const aiProviders = pgTable("ai_providers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	specialty: text().notNull(),
	subSpecialty: text("sub_specialty"),
	bio: text().notNull(),
	profileImageUrl: text("profile_image_url"),
	yearsOfExperience: integer("years_of_experience").notNull(),
	education: jsonb().notNull(),
	certifications: jsonb(),
	languages: jsonb().notNull(),
	consultationFee: numeric("consultation_fee", { precision: 10, scale: 2 }).notNull(),
	currency: text().default('USD'),
	rating: numeric({ precision: 3, scale: 2 }).default('5.00'),
	totalConsultations: integer("total_consultations").default(0),
	availability: jsonb().notNull(), // 24/7 availability schedule
	responseTimeSeconds: integer("response_time_seconds").default(1),
	aiModel: text("ai_model").default('gpt-4'),
	personalityTraits: jsonb("personality_traits").notNull(),
	specializations: jsonb().notNull(), // specific areas within specialty
	consultationStyle: text("consultation_style").notNull(),
	isActive: boolean("is_active").default(true),
	isAvailable: boolean("is_available").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("ai_providers_name_unique").on(table.name),
]);

export const aiConsultations = pgTable("ai_consultations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	patientId: text("patient_id").notNull(),
	aiProviderId: uuid("ai_provider_id").notNull(),
	originalAiProviderId: uuid("original_ai_provider_id"),
	sessionId: text("session_id").notNull(),
	status: text().default('active'), // active, completed, transferred
	reasonForVisit: text("reason_for_visit").notNull(),
	symptoms: jsonb(),
	urgencyLevel: integer("urgency_level").default(1),
	patientAge: integer("patient_age"),
	patientGender: text("patient_gender"),
	medicalHistory: jsonb("medical_history"),
	currentMedications: jsonb("current_medications"),
	allergies: jsonb(),
	aiAssessment: jsonb("ai_assessment"),
	recommendations: jsonb(),
	referralSuggested: boolean("referral_suggested").default(false),
	referralReason: text("referral_reason"),
	handoffToHuman: boolean("handoff_to_human").default(false),
	handoffReason: text("handoff_reason"),
	handoffProviderId: uuid("handoff_provider_id"),
	handoffCount: integer("handoff_count").default(0),
	lastHandoffAt: timestamp("last_handoff_at", { mode: 'string' }),
	satisfactionRating: integer("satisfaction_rating"),
	feedback: text(),
	totalMessages: integer("total_messages").default(0),
	durationMinutes: integer("duration_minutes"),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow().notNull(),
	endedAt: timestamp("ended_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [users.id],
			name: "ai_consultations_patient_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.aiProviderId],
			foreignColumns: [aiProviders.id],
			name: "ai_consultations_ai_provider_id_ai_providers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.originalAiProviderId],
			foreignColumns: [aiProviders.id],
			name: "ai_consultations_original_ai_provider_id_ai_providers_id_fk"
		}),
	foreignKey({
			columns: [table.handoffProviderId],
			foreignColumns: [healthcareProviders.id],
			name: "ai_consultations_handoff_provider_id_healthcare_providers_id_fk"
		}),
	unique("ai_consultations_session_id_unique").on(table.sessionId),
]);

export const consultationMessages = pgTable("consultation_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	consultationId: uuid("consultation_id").notNull(),
	senderId: text("sender_id").notNull(), // user ID or 'ai'
	senderType: text("sender_type").notNull(), // 'patient' or 'ai'
	message: text().notNull(),
	messageType: text("message_type").default('text'), // text, image, file, assessment, referral
	metadata: jsonb(), // additional data like AI confidence, processing time
	referralMetadata: jsonb("referral_metadata"), // For storing referral-specific data
	handoffId: uuid("handoff_id"),
	isRead: boolean("is_read").default(false),
	readAt: timestamp("read_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.consultationId],
			foreignColumns: [aiConsultations.id],
			name: "consultation_messages_consultation_id_ai_consultations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.handoffId],
			foreignColumns: [aiDoctorHandoffs.id],
			name: "consultation_messages_handoff_id_ai_doctor_handoffs_id_fk"
		}),
]);

export const providerHandoffs = pgTable("provider_handoffs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	aiConsultationId: uuid("ai_consultation_id").notNull(),
	fromAiProviderId: uuid("from_ai_provider_id").notNull(),
	toHumanProviderId: uuid("to_human_provider_id").notNull(),
	reason: text().notNull(),
	aiSummary: text("ai_summary").notNull(),
	patientConsent: boolean("patient_consent").default(false),
	status: text().default('pending'), // pending, accepted, declined, completed
	urgencyLevel: integer("urgency_level").default(1),
	scheduledAppointmentId: uuid("scheduled_appointment_id"),
	handoffNotes: text("handoff_notes"),
	responseTime: integer("response_time"), // minutes to respond
	acceptedAt: timestamp("accepted_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.aiConsultationId],
			foreignColumns: [aiConsultations.id],
			name: "provider_handoffs_ai_consultation_id_ai_consultations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.fromAiProviderId],
			foreignColumns: [aiProviders.id],
			name: "provider_handoffs_from_ai_provider_id_ai_providers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.toHumanProviderId],
			foreignColumns: [healthcareProviders.id],
			name: "provider_handoffs_to_human_provider_id_healthcare_providers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.scheduledAppointmentId],
			foreignColumns: [telemedicineAppointments.id],
			name: "provider_handoffs_scheduled_appointment_id_telemedicine_appointments_id_fk"
		}),
]);

// AI Doctor Handoffs - for AI-to-AI specialist referrals
export const aiDoctorHandoffs = pgTable("ai_doctor_handoffs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	aiConsultationId: uuid("ai_consultation_id").notNull(),
	fromAiProviderId: uuid("from_ai_provider_id").notNull(),
	toAiProviderId: uuid("to_ai_provider_id").notNull(),
	reason: text().notNull(),
	recommendedSpecialty: text("recommended_specialty").notNull(),
	contextSummary: text("context_summary"),
	status: text().default('pending'), // pending, completed, failed
	handoffNotes: text("handoff_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.aiConsultationId],
			foreignColumns: [aiConsultations.id],
			name: "ai_doctor_handoffs_ai_consultation_id_ai_consultations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.fromAiProviderId],
			foreignColumns: [aiProviders.id],
			name: "ai_doctor_handoffs_from_ai_provider_id_ai_providers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.toAiProviderId],
			foreignColumns: [aiProviders.id],
			name: "ai_doctor_handoffs_to_ai_provider_id_ai_providers_id_fk"
		}).onDelete("cascade"),
]);

// Daily Health Calendar & Check-in System Tables
export const dailyCheckins = pgTable("daily_checkins", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	checkinDate: timestamp("checkin_date", { mode: 'string' }).notNull(),
	moodRating: integer("mood_rating"), // 1-10 scale
	energyLevel: integer("energy_level"), // 1-10 scale
	sleepQuality: integer("sleep_quality"), // 1-10 scale
	sleepHours: numeric("sleep_hours", { precision: 3, scale: 1 }),
	stressLevel: integer("stress_level"), // 1-10 scale
	exerciseMinutes: integer("exercise_minutes"),
	waterIntake: numeric("water_intake", { precision: 4, scale: 1 }), // in liters
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "daily_checkins_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("daily_checkins_user_id_date_unique").on(table.userId, table.checkinDate),
]);

export const healthEvents = pgTable("health_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	eventType: text("event_type").notNull(), // symptom, medication, appointment, exercise, meal
	title: text().notNull(),
	description: text(),
	severity: integer(), // 1-10 scale for symptoms
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }),
	isOngoing: boolean("is_ongoing").default(false),
	frequency: text(), // daily, weekly, as-needed, etc.
	dosage: text(), // for medications
	unit: text(), // mg, ml, etc.
	tags: jsonb(),
	metadata: jsonb(), // additional event-specific data
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "health_events_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const checkinSymptoms = pgTable("checkin_symptoms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	checkinId: uuid("checkin_id").notNull(),
	symptomName: text("symptom_name").notNull(),
	severity: integer().notNull(), // 1-10 scale
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.checkinId],
			foreignColumns: [dailyCheckins.id],
			name: "checkin_symptoms_checkin_id_daily_checkins_id_fk"
		}).onDelete("cascade"),
]);

export const checkinMedications = pgTable("checkin_medications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	checkinId: uuid("checkin_id").notNull(),
	medicationName: text("medication_name").notNull(),
	dosage: text().notNull(),
	taken: boolean().default(false),
	timesTaken: integer("times_taken").default(0),
	timesScheduled: integer("times_scheduled").default(1),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.checkinId],
			foreignColumns: [dailyCheckins.id],
			name: "checkin_medications_checkin_id_daily_checkins_id_fk"
		}).onDelete("cascade"),
]);

export const healthNotifications = pgTable("health_notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	notificationType: text("notification_type").notNull(), // persistent_symptom, medication_reminder, streak_milestone
	title: text().notNull(),
	message: text().notNull(),
	relatedEventId: uuid("related_event_id"),
	triggerCondition: jsonb("trigger_condition"), // conditions that triggered this notification
	status: text().default('pending'), // pending, sent, failed
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	emailSent: boolean("email_sent").default(false),
	pushSent: boolean("push_sent").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "health_notifications_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.relatedEventId],
			foreignColumns: [healthEvents.id],
			name: "health_notifications_related_event_id_health_events_id_fk"
		}),
]);

export const streakRecords = pgTable("streak_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	streakType: text("streak_type").notNull(), // daily_checkin, medication_adherence, exercise
	currentStreak: integer("current_streak").default(0),
	longestStreak: integer("longest_streak").default(0),
	lastActivityDate: timestamp("last_activity_date", { mode: 'string' }),
	streakStartDate: timestamp("streak_start_date", { mode: 'string' }),
	totalActivities: integer("total_activities").default(0),
	milestones: jsonb(), // achieved milestones
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "streak_records_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("streak_records_user_id_type_unique").on(table.userId, table.streakType),
]);

export const healthPatterns = pgTable("health_patterns", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	patternType: text("pattern_type").notNull(), // correlation, trend, anomaly
	title: text().notNull(),
	description: text().notNull(),
	confidenceScore: numeric("confidence_score", { precision: 3, scale: 2 }),
	dataPoints: jsonb("data_points"), // supporting data for the pattern
	correlations: jsonb(), // related health metrics
	insights: jsonb(), // AI-generated insights
	recommendations: jsonb(), // suggested actions
	periodStart: timestamp("period_start", { mode: 'string' }).notNull(),
	periodEnd: timestamp("period_end", { mode: 'string' }).notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "health_patterns_user_id_users_id_fk"
		}).onDelete("cascade"),
]);
