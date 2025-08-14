-- Migration for AI Doctor Handoffs and Specialist Recommendations
-- This migration adds support for AI-to-AI doctor switching and referrals

-- Create AI doctor handoffs table
CREATE TABLE "ai_doctor_handoffs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "consultation_id" uuid NOT NULL,
  "from_ai_provider_id" uuid NOT NULL,
  "to_ai_provider_id" uuid NOT NULL,
  "reason" text NOT NULL,
  "recommended_specialty" text NOT NULL,
  "handoff_summary" text,
  "patient_consent" boolean DEFAULT true,
  "status" text DEFAULT 'completed', -- completed, pending, failed
  "handoff_type" text DEFAULT 'specialty_referral', -- specialty_referral, escalation, patient_request
  "context_transferred" boolean DEFAULT true,
  "original_issue_category" text,
  "new_issue_category" text,
  "confidence_score" decimal(3,2),
  "handoff_notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "ai_doctor_handoffs" ADD CONSTRAINT "ai_doctor_handoffs_consultation_id_ai_consultations_id_fk" 
  FOREIGN KEY ("consultation_id") REFERENCES "public"."ai_consultations"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "ai_doctor_handoffs" ADD CONSTRAINT "ai_doctor_handoffs_from_ai_provider_id_ai_providers_id_fk" 
  FOREIGN KEY ("from_ai_provider_id") REFERENCES "public"."ai_providers"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "ai_doctor_handoffs" ADD CONSTRAINT "ai_doctor_handoffs_to_ai_provider_id_ai_providers_id_fk" 
  FOREIGN KEY ("to_ai_provider_id") REFERENCES "public"."ai_providers"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes for better performance
CREATE INDEX "ai_doctor_handoffs_consultation_id_idx" ON "ai_doctor_handoffs" ("consultation_id");
CREATE INDEX "ai_doctor_handoffs_from_provider_idx" ON "ai_doctor_handoffs" ("from_ai_provider_id");
CREATE INDEX "ai_doctor_handoffs_to_provider_idx" ON "ai_doctor_handoffs" ("to_ai_provider_id");
CREATE INDEX "ai_doctor_handoffs_created_at_idx" ON "ai_doctor_handoffs" ("created_at");

-- Add new columns to consultation_messages for better referral tracking
ALTER TABLE "consultation_messages" ADD COLUMN "referral_metadata" jsonb;
ALTER TABLE "consultation_messages" ADD COLUMN "handoff_id" uuid;

-- Add foreign key for handoff reference in messages
ALTER TABLE "consultation_messages" ADD CONSTRAINT "consultation_messages_handoff_id_ai_doctor_handoffs_id_fk" 
  FOREIGN KEY ("handoff_id") REFERENCES "public"."ai_doctor_handoffs"("id") ON DELETE set null ON UPDATE no action;

-- Update ai_consultations table to track current and previous providers
ALTER TABLE "ai_consultations" ADD COLUMN "original_ai_provider_id" uuid;
ALTER TABLE "ai_consultations" ADD COLUMN "handoff_count" integer DEFAULT 0;
ALTER TABLE "ai_consultations" ADD COLUMN "last_handoff_at" timestamp;

-- Add foreign key for original provider tracking
ALTER TABLE "ai_consultations" ADD CONSTRAINT "ai_consultations_original_ai_provider_id_ai_providers_id_fk" 
  FOREIGN KEY ("original_ai_provider_id") REFERENCES "public"."ai_providers"("id") ON DELETE set null ON UPDATE no action;

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE ON "ai_doctor_handoffs" TO anon;
GRANT SELECT, INSERT, UPDATE ON "ai_doctor_handoffs" TO authenticated;

-- Enable RLS on the new table
ALTER TABLE "ai_doctor_handoffs" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_doctor_handoffs
CREATE POLICY "Users can view their own consultation handoffs" ON "ai_doctor_handoffs"
  FOR SELECT USING (
    consultation_id IN (
      SELECT id FROM ai_consultations WHERE patient_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create handoffs for their consultations" ON "ai_doctor_handoffs"
  FOR INSERT WITH CHECK (
    consultation_id IN (
      SELECT id FROM ai_consultations WHERE patient_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update handoffs for their consultations" ON "ai_doctor_handoffs"
  FOR UPDATE USING (
    consultation_id IN (
      SELECT id FROM ai_consultations WHERE patient_id = auth.uid()::text
    )
  );