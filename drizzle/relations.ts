import { relations } from "drizzle-orm/relations";
import { users, analysisJobs, healthAlerts, alertThresholds, notificationQueue, userPrivacySettings, websocketConnections, healthReports, userAnalytics, userMedicalHistory, chatSessions, userSubscriptions, subscriptionPlans, doctors, conversations, chatMessages } from "./schema";

export const analysisJobsRelations = relations(analysisJobs, ({one}) => ({
	user: one(users, {
		fields: [analysisJobs.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	analysisJobs: many(analysisJobs),
	healthAlerts: many(healthAlerts),
	notificationQueues: many(notificationQueue),
	alertThresholds: many(alertThresholds),
	userPrivacySettings: many(userPrivacySettings),
	websocketConnections: many(websocketConnections),
	healthReports: many(healthReports),
	userAnalytics: many(userAnalytics),
	userMedicalHistories: many(userMedicalHistory),
	chatSessions: many(chatSessions),
	userSubscriptions: many(userSubscriptions),
	conversations: many(conversations),
}));

export const healthAlertsRelations = relations(healthAlerts, ({one, many}) => ({
	user: one(users, {
		fields: [healthAlerts.userId],
		references: [users.id]
	}),
	alertThreshold: one(alertThresholds, {
		fields: [healthAlerts.thresholdId],
		references: [alertThresholds.id]
	}),
	notificationQueues: many(notificationQueue),
}));

export const alertThresholdsRelations = relations(alertThresholds, ({one, many}) => ({
	healthAlerts: many(healthAlerts),
	user: one(users, {
		fields: [alertThresholds.userId],
		references: [users.id]
	}),
}));

export const notificationQueueRelations = relations(notificationQueue, ({one}) => ({
	user: one(users, {
		fields: [notificationQueue.userId],
		references: [users.id]
	}),
	healthAlert: one(healthAlerts, {
		fields: [notificationQueue.alertId],
		references: [healthAlerts.id]
	}),
}));

// Removed provider reviews relations as the table was deleted

// Removed healthcare providers relations as the table was deleted

// Removed telemedicine appointments relations as the table was deleted

// Removed realtime health data relations as the table was deleted

export const userPrivacySettingsRelations = relations(userPrivacySettings, ({one}) => ({
	user: one(users, {
		fields: [userPrivacySettings.userId],
		references: [users.id]
	}),
}));

export const websocketConnectionsRelations = relations(websocketConnections, ({one}) => ({
	user: one(users, {
		fields: [websocketConnections.userId],
		references: [users.id]
	}),
}));

// Removed provider availability relations as the table was deleted

// Removed prescriptions relations as the table was deleted

export const healthReportsRelations = relations(healthReports, ({one, many}) => ({
	user: one(users, {
		fields: [healthReports.userId],
		references: [users.id]
	}),
	chatSessions: many(chatSessions),
}));

export const userAnalyticsRelations = relations(userAnalytics, ({one}) => ({
	user: one(users, {
		fields: [userAnalytics.userId],
		references: [users.id]
	}),
}));

export const userMedicalHistoryRelations = relations(userMedicalHistory, ({one}) => ({
	user: one(users, {
		fields: [userMedicalHistory.userId],
		references: [users.id]
	}),
}));

export const chatSessionsRelations = relations(chatSessions, ({one}) => ({
	user: one(users, {
		fields: [chatSessions.userId],
		references: [users.id]
	}),
	healthReport: one(healthReports, {
		fields: [chatSessions.relatedReportId],
		references: [healthReports.id]
	}),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({one}) => ({
	user: one(users, {
		fields: [userSubscriptions.userId],
		references: [users.id]
	}),
	subscriptionPlan: one(subscriptionPlans, {
		fields: [userSubscriptions.planId],
		references: [subscriptionPlans.id]
	}),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({many}) => ({
	userSubscriptions: many(userSubscriptions),
}));

// Removed consultation notes relations as the table was deleted

// Chat Feature Relations
export const doctorsRelations = relations(doctors, ({many}) => ({
	conversations: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	user: one(users, {
		fields: [conversations.userId],
		references: [users.id]
	}),
	doctor: one(doctors, {
		fields: [conversations.doctorId],
		references: [doctors.id]
	}),
	chatMessages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	conversation: one(conversations, {
		fields: [chatMessages.conversationId],
		references: [conversations.id]
	}),
}));