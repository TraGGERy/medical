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

// Removed provider reviews table as it was related to telemedicine appointments

// Removed realtime health data table as it was related to real-time monitoring

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

// Removed provider availability table as it was related to telemedicine appointments

// Removed provider specialties table as it was related to telemedicine

// Removed healthcare providers table as it was related to telemedicine

// Removed prescriptions table as it was related to telemedicine appointments and providers

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

// Removed consultation notes table as it was related to telemedicine appointments

// Removed telemedicine appointments table as it was the main telemedicine feature

// Removed AI providers table as it was related to AI consultations

// Removed AI consultations table as it was the main AI consultation feature

// Removed consultation messages table as it was related to AI consultations

// Removed provider handoffs table as it was related to AI consultations and telemedicine

// Removed AI doctor handoffs table as it was related to AI consultations

// Removed health calendar tables

// Removed healthEvents table

// Removed remaining health calendar tables

// Chat feature tables
export const doctors = pgTable("doctors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	gender: text().notNull(), // 'male' or 'female'
	specialization: text().notNull(),
	avatar: text(), // URL to doctor's avatar image
	bio: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	doctorId: uuid("doctor_id").notNull(),
	title: text().notNull(),
	status: text().default('active'), // active, closed, archived
	lastMessageAt: timestamp("last_message_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "conversations_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.doctorId],
			foreignColumns: [doctors.id],
			name: "conversations_doctor_id_doctors_id_fk"
		}),
]);

export const chatMessages = pgTable("chat_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	conversationId: uuid("conversation_id").notNull(),
	senderId: text("sender_id").notNull(), // user ID or doctor ID
	senderType: text("sender_type").notNull(), // 'user' or 'doctor'
	content: text().notNull(),
	messageType: text("message_type").default('text'), // text, image, file
	metadata: jsonb(),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversations.id],
			name: "chat_messages_conversation_id_conversations_id_fk"
		}).onDelete("cascade"),
]);
