CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" text NOT NULL,
	"sender_type" text NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'text',
	"metadata" jsonb,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"doctor_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'active',
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"gender" text NOT NULL,
	"specialization" text NOT NULL,
	"avatar" text,
	"bio" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "ai_consultations" CASCADE;--> statement-breakpoint
DROP TABLE "ai_providers" CASCADE;--> statement-breakpoint
DROP TABLE "alert_thresholds" CASCADE;--> statement-breakpoint
DROP TABLE "analysis_jobs" CASCADE;--> statement-breakpoint
DROP TABLE "consultation_messages" CASCADE;--> statement-breakpoint
DROP TABLE "consultation_notes" CASCADE;--> statement-breakpoint
DROP TABLE "health_alerts" CASCADE;--> statement-breakpoint
DROP TABLE "healthcare_providers" CASCADE;--> statement-breakpoint
DROP TABLE "notification_queue" CASCADE;--> statement-breakpoint
DROP TABLE "prescriptions" CASCADE;--> statement-breakpoint
DROP TABLE "provider_availability" CASCADE;--> statement-breakpoint
DROP TABLE "provider_handoffs" CASCADE;--> statement-breakpoint
DROP TABLE "provider_reviews" CASCADE;--> statement-breakpoint
DROP TABLE "provider_specialties" CASCADE;--> statement-breakpoint
DROP TABLE "realtime_health_data" CASCADE;--> statement-breakpoint
DROP TABLE "telemedicine_appointments" CASCADE;--> statement-breakpoint
DROP TABLE "websocket_connections" CASCADE;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;