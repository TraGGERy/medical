-- Add multimedia support to chat messages
ALTER TABLE "chat_messages" ADD COLUMN "has_attachments" boolean DEFAULT false;

-- Create message attachments table
CREATE TABLE IF NOT EXISTS "message_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"original_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_url" text NOT NULL,
	"thumbnail_url" text,
	"upload_status" text DEFAULT 'completed',
	"analysis_status" text DEFAULT 'pending',
	"analysis_result" jsonb,
	"is_prescription" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_message_attachments_message_id" ON "message_attachments" ("message_id");
CREATE INDEX IF NOT EXISTS "idx_message_attachments_file_type" ON "message_attachments" ("file_type");
CREATE INDEX IF NOT EXISTS "idx_message_attachments_is_prescription" ON "message_attachments" ("is_prescription");
CREATE INDEX IF NOT EXISTS "idx_message_attachments_analysis_status" ON "message_attachments" ("analysis_status");

-- Update message_type enum to include multimedia
COMMENT ON COLUMN "chat_messages"."message_type" IS 'Message type: text, image, file, multimedia';
COMMENT ON COLUMN "chat_messages"."has_attachments" IS 'Whether this message has file attachments';

-- Add comments for new table
COMMENT ON TABLE "message_attachments" IS 'File attachments for chat messages including images and documents';
COMMENT ON COLUMN "message_attachments"."file_type" IS 'MIME type of the file (e.g., image/jpeg, application/pdf)';
COMMENT ON COLUMN "message_attachments"."upload_status" IS 'File upload status: uploading, completed, failed';
COMMENT ON COLUMN "message_attachments"."analysis_status" IS 'AI analysis status: pending, processing, completed, failed';
COMMENT ON COLUMN "message_attachments"."analysis_result" IS 'AI analysis results for prescription images and documents';
COMMENT ON COLUMN "message_attachments"."is_prescription" IS 'Flag indicating if this is a prescription image for medical analysis';
COMMENT ON COLUMN "message_attachments"."metadata" IS 'Additional file metadata like dimensions, compression info, etc.';