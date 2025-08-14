import { relations } from "drizzle-orm/relations";
import { users, analysisJobs, healthAlerts, alertThresholds, notificationQueue, healthcareProviders, providerReviews, telemedicineAppointments, realtimeHealthData, userPrivacySettings, websocketConnections, providerAvailability, prescriptions, healthReports, userAnalytics, userMedicalHistory, chatSessions, userSubscriptions, subscriptionPlans, consultationNotes } from "./schema";

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
	providerReviews: many(providerReviews),
	realtimeHealthData: many(realtimeHealthData),
	userPrivacySettings: many(userPrivacySettings),
	websocketConnections: many(websocketConnections),
	healthcareProviders: many(healthcareProviders),
	prescriptions: many(prescriptions),
	healthReports: many(healthReports),
	userAnalytics: many(userAnalytics),
	userMedicalHistories: many(userMedicalHistory),
	chatSessions: many(chatSessions),
	userSubscriptions: many(userSubscriptions),
	consultationNotes: many(consultationNotes),
	telemedicineAppointments: many(telemedicineAppointments),
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

export const providerReviewsRelations = relations(providerReviews, ({one}) => ({
	healthcareProvider: one(healthcareProviders, {
		fields: [providerReviews.providerId],
		references: [healthcareProviders.id]
	}),
	user: one(users, {
		fields: [providerReviews.patientId],
		references: [users.id]
	}),
	telemedicineAppointment: one(telemedicineAppointments, {
		fields: [providerReviews.appointmentId],
		references: [telemedicineAppointments.id]
	}),
}));

export const healthcareProvidersRelations = relations(healthcareProviders, ({one, many}) => ({
	providerReviews: many(providerReviews),
	providerAvailabilities: many(providerAvailability),
	user: one(users, {
		fields: [healthcareProviders.userId],
		references: [users.id]
	}),
	prescriptions: many(prescriptions),
	consultationNotes: many(consultationNotes),
	telemedicineAppointments: many(telemedicineAppointments),
}));

export const telemedicineAppointmentsRelations = relations(telemedicineAppointments, ({one, many}) => ({
	providerReviews: many(providerReviews),
	prescriptions: many(prescriptions),
	consultationNotes: many(consultationNotes),
	user: one(users, {
		fields: [telemedicineAppointments.patientId],
		references: [users.id]
	}),
	healthcareProvider: one(healthcareProviders, {
		fields: [telemedicineAppointments.providerId],
		references: [healthcareProviders.id]
	}),
	telemedicineAppointment: one(telemedicineAppointments, {
		fields: [telemedicineAppointments.rescheduledFrom],
		references: [telemedicineAppointments.id],
		relationName: "telemedicineAppointments_rescheduledFrom_telemedicineAppointments_id"
	}),
	telemedicineAppointments: many(telemedicineAppointments, {
		relationName: "telemedicineAppointments_rescheduledFrom_telemedicineAppointments_id"
	}),
}));

export const realtimeHealthDataRelations = relations(realtimeHealthData, ({one}) => ({
	user: one(users, {
		fields: [realtimeHealthData.userId],
		references: [users.id]
	}),
}));

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

export const providerAvailabilityRelations = relations(providerAvailability, ({one}) => ({
	healthcareProvider: one(healthcareProviders, {
		fields: [providerAvailability.providerId],
		references: [healthcareProviders.id]
	}),
}));

export const prescriptionsRelations = relations(prescriptions, ({one}) => ({
	telemedicineAppointment: one(telemedicineAppointments, {
		fields: [prescriptions.appointmentId],
		references: [telemedicineAppointments.id]
	}),
	healthcareProvider: one(healthcareProviders, {
		fields: [prescriptions.providerId],
		references: [healthcareProviders.id]
	}),
	user: one(users, {
		fields: [prescriptions.patientId],
		references: [users.id]
	}),
}));

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

export const consultationNotesRelations = relations(consultationNotes, ({one}) => ({
	telemedicineAppointment: one(telemedicineAppointments, {
		fields: [consultationNotes.appointmentId],
		references: [telemedicineAppointments.id]
	}),
	healthcareProvider: one(healthcareProviders, {
		fields: [consultationNotes.providerId],
		references: [healthcareProviders.id]
	}),
	user: one(users, {
		fields: [consultationNotes.patientId],
		references: [users.id]
	}),
}));