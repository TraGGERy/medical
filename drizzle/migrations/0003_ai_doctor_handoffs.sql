-- Migration: Add AI Doctor Handoffs Support
-- Description: Adds support for AI-to-AI specialist referrals and handoffs

-- Create ai_doctor_handoffs table only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_doctor_handoffs') THEN
        CREATE TABLE "ai_doctor_handoffs" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "ai_consultation_id" uuid NOT NULL,
            "from_ai_provider_id" uuid NOT NULL,
            "to_ai_provider_id" uuid NOT NULL,
            "reason" text NOT NULL,
            "recommended_specialty" text NOT NULL,
            "context_summary" text,
            "status" text DEFAULT 'pending' NOT NULL,
            "handoff_notes" text,
            "created_at" timestamp DEFAULT now() NOT NULL,
            "updated_at" timestamp DEFAULT now() NOT NULL
        );
    END IF;
END $$;

-- Add foreign key constraints for ai_doctor_handoffs
DO $$ BEGIN
 ALTER TABLE "ai_doctor_handoffs" ADD CONSTRAINT "ai_doctor_handoffs_ai_consultation_id_ai_consultations_id_fk" FOREIGN KEY ("ai_consultation_id") REFERENCES "ai_consultations"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_doctor_handoffs" ADD CONSTRAINT "ai_doctor_handoffs_from_ai_provider_id_ai_providers_id_fk" FOREIGN KEY ("from_ai_provider_id") REFERENCES "ai_providers"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_doctor_handoffs" ADD CONSTRAINT "ai_doctor_handoffs_to_ai_provider_id_ai_providers_id_fk" FOREIGN KEY ("to_ai_provider_id") REFERENCES "ai_providers"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add new columns to consultation_messages
ALTER TABLE "consultation_messages" ADD COLUMN IF NOT EXISTS "referral_metadata" jsonb;
ALTER TABLE "consultation_messages" ADD COLUMN IF NOT EXISTS "handoff_id" uuid;
ALTER TABLE "consultation_messages" ALTER COLUMN "message_type" SET DEFAULT 'text';

-- Add foreign key for handoff_id in consultation_messages
DO $$ BEGIN
 ALTER TABLE "consultation_messages" ADD CONSTRAINT "consultation_messages_handoff_id_ai_doctor_handoffs_id_fk" FOREIGN KEY ("handoff_id") REFERENCES "ai_doctor_handoffs"("id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add new columns to ai_consultations
ALTER TABLE "ai_consultations" ADD COLUMN IF NOT EXISTS "original_ai_provider_id" uuid;
ALTER TABLE "ai_consultations" ADD COLUMN IF NOT EXISTS "handoff_count" integer DEFAULT 0;
ALTER TABLE "ai_consultations" ADD COLUMN IF NOT EXISTS "last_handoff_at" timestamp;

-- Add foreign key for original_ai_provider_id in ai_consultations
DO $$ BEGIN
 ALTER TABLE "ai_consultations" ADD CONSTRAINT "ai_consultations_original_ai_provider_id_ai_providers_id_fk" FOREIGN KEY ("original_ai_provider_id") REFERENCES "ai_providers"("id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_ai_doctor_handoffs_consultation_id" ON "ai_doctor_handoffs" ("ai_consultation_id");
CREATE INDEX IF NOT EXISTS "idx_ai_doctor_handoffs_from_provider" ON "ai_doctor_handoffs" ("from_ai_provider_id");
CREATE INDEX IF NOT EXISTS "idx_ai_doctor_handoffs_to_provider" ON "ai_doctor_handoffs" ("to_ai_provider_id");
CREATE INDEX IF NOT EXISTS "idx_ai_doctor_handoffs_status" ON "ai_doctor_handoffs" ("status");
CREATE INDEX IF NOT EXISTS "idx_consultation_messages_handoff_id" ON "consultation_messages" ("handoff_id");
CREATE INDEX IF NOT EXISTS "idx_ai_consultations_original_provider" ON "ai_consultations" ("original_ai_provider_id");

-- Update message_type enum to include 'referral' and 'system'
COMMENT ON COLUMN "consultation_messages"."message_type" IS 'Message types: text, image, file, assessment, referral';
COMMENT ON COLUMN "consultation_messages"."sender_type" IS 'Sender types: patient, ai, system';

-- Add comments for new tables and columns
COMMENT ON TABLE "ai_doctor_handoffs" IS 'Tracks AI-to-AI specialist referrals and handoffs';
COMMENT ON COLUMN "ai_doctor_handoffs"."status" IS 'Handoff status: pending, completed, failed';
COMMENT ON COLUMN "consultation_messages"."referral_metadata" IS 'JSON metadata for referral messages including specialty, provider info';
COMMENT ON COLUMN "ai_consultations"."handoff_count" IS 'Number of times this consultation has been handed off between AI providers';
COMMENT ON COLUMN "ai_consultations"."original_ai_provider_id" IS 'The original AI provider who started this consultation';