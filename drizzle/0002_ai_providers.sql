CREATE TABLE "ai_consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" text NOT NULL,
	"ai_provider_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"status" text DEFAULT 'active',
	"reason_for_visit" text NOT NULL,
	"symptoms" jsonb,
	"urgency_level" integer DEFAULT 1,
	"patient_age" integer,
	"patient_gender" text,
	"medical_history" jsonb,
	"current_medications" jsonb,
	"allergies" jsonb,
	"ai_assessment" jsonb,
	"recommendations" jsonb,
	"referral_suggested" boolean DEFAULT false,
	"referral_reason" text,
	"handoff_to_human" boolean DEFAULT false,
	"handoff_reason" text,
	"handoff_provider_id" uuid,
	"satisfaction_rating" integer,
	"feedback" text,
	"total_messages" integer DEFAULT 0,
	"duration_minutes" integer,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_consultations_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "ai_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"specialty" text NOT NULL,
	"sub_specialty" text,
	"bio" text NOT NULL,
	"profile_image_url" text,
	"years_of_experience" integer NOT NULL,
	"education" jsonb NOT NULL,
	"certifications" jsonb,
	"languages" jsonb NOT NULL,
	"consultation_fee" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"rating" numeric(3, 2) DEFAULT '5.00',
	"total_consultations" integer DEFAULT 0,
	"availability" jsonb NOT NULL,
	"response_time_seconds" integer DEFAULT 1,
	"ai_model" text DEFAULT 'gpt-4',
	"personality_traits" jsonb NOT NULL,
	"specializations" jsonb NOT NULL,
	"consultation_style" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_available" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_providers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "consultation_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultation_id" uuid NOT NULL,
	"sender_id" text NOT NULL,
	"sender_type" text NOT NULL,
	"message" text NOT NULL,
	"message_type" text DEFAULT 'text',
	"metadata" jsonb,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_handoffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ai_consultation_id" uuid NOT NULL,
	"from_ai_provider_id" uuid NOT NULL,
	"to_human_provider_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"ai_summary" text NOT NULL,
	"patient_consent" boolean DEFAULT false,
	"status" text DEFAULT 'pending',
	"urgency_level" integer DEFAULT 1,
	"scheduled_appointment_id" uuid,
	"handoff_notes" text,
	"response_time" integer,
	"accepted_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_consultations" ADD CONSTRAINT "ai_consultations_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_consultations" ADD CONSTRAINT "ai_consultations_ai_provider_id_ai_providers_id_fk" FOREIGN KEY ("ai_provider_id") REFERENCES "public"."ai_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_consultations" ADD CONSTRAINT "ai_consultations_handoff_provider_id_healthcare_providers_id_fk" FOREIGN KEY ("handoff_provider_id") REFERENCES "public"."healthcare_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_messages" ADD CONSTRAINT "consultation_messages_consultation_id_ai_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."ai_consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_handoffs" ADD CONSTRAINT "provider_handoffs_ai_consultation_id_ai_consultations_id_fk" FOREIGN KEY ("ai_consultation_id") REFERENCES "public"."ai_consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_handoffs" ADD CONSTRAINT "provider_handoffs_from_ai_provider_id_ai_providers_id_fk" FOREIGN KEY ("from_ai_provider_id") REFERENCES "public"."ai_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_handoffs" ADD CONSTRAINT "provider_handoffs_to_human_provider_id_healthcare_providers_id_fk" FOREIGN KEY ("to_human_provider_id") REFERENCES "public"."healthcare_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_handoffs" ADD CONSTRAINT "provider_handoffs_scheduled_appointment_id_telemedicine_appointments_id_fk" FOREIGN KEY ("scheduled_appointment_id") REFERENCES "public"."telemedicine_appointments"("id") ON DELETE no action ON UPDATE no action;