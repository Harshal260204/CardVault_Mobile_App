-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('employee', 'manager', 'tenant_admin', 'platform_support', 'platform_super_admin', 'user', 'super_admin');

-- CreateEnum
CREATE TYPE "CaptureMode" AS ENUM ('visitor', 'exhibitor', 'quick_capture', 'legacy');

-- CreateEnum
CREATE TYPE "LeadQualifier" AS ENUM ('hot', 'warm', 'cold');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('active', 'closed', 'archived');

-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'manual_fallback');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('pending', 'processing', 'ready', 'failed', 'expired');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('pending', 'processing', 'synced', 'conflict', 'dead_letter');

-- CreateEnum
CREATE TYPE "CardImageStatus" AS ENUM ('pending', 'confirmed', 'processing', 'ready', 'failed');

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_inr" INTEGER NOT NULL DEFAULT 0,
    "billing_interval" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "max_users" INTEGER NOT NULL DEFAULT 50,
    "storage_quota_gb" INTEGER NOT NULL DEFAULT 10,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "supabase_uid" UUID,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "password_hash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_active_at" TIMESTAMP(3),
    "expo_push_token" TEXT,
    "invited_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_refresh_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_jti" UUID NOT NULL,
    "parent_jti" UUID,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_refresh_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revoked_tokens" (
    "jti" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revoked_tokens_pkey" PRIMARY KEY ("jti")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "company" TEXT,
    "title" TEXT,
    "emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "phones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "website" TEXT,
    "address" TEXT,
    "linkedin_url" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "capture_mode" "CaptureMode" DEFAULT 'legacy',
    "event_session_id" UUID,
    "encounter_type" TEXT,
    "lead_qualifier" "LeadQualifier",
    "lead_note" TEXT,
    "follow_up_date" DATE,
    "card_image_id" UUID,
    "ocr_confidence" DECIMAL(4,3),
    "is_merged" BOOLEAN NOT NULL DEFAULT false,
    "merged_into_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_encounters" (
    "id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "session_id" UUID,
    "captured_by" UUID NOT NULL,
    "capture_mode" "CaptureMode" NOT NULL,
    "encounter_type" TEXT,
    "encounter_label" TEXT,
    "lead_qualifier" "LeadQualifier",
    "lead_note" TEXT,
    "follow_up_date" DATE,
    "notes" TEXT,
    "card_image_id" UUID,
    "ocr_job_id" UUID,
    "client_idempotency_key" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_encounters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_sessions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "mode" "CaptureMode" NOT NULL,
    "event_type" TEXT,
    "location" TEXT,
    "start_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATE,
    "status" "SessionStatus" NOT NULL DEFAULT 'active',
    "scan_count" INTEGER NOT NULL DEFAULT 0,
    "hot_count" INTEGER NOT NULL DEFAULT 0,
    "warm_count" INTEGER NOT NULL DEFAULT 0,
    "cold_count" INTEGER NOT NULL DEFAULT 0,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "event_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_members" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_jobs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "contact_id" UUID,
    "card_image_id" UUID NOT NULL,
    "session_id" UUID,
    "capture_mode" "CaptureMode",
    "submitted_by" UUID NOT NULL,
    "status" "OcrStatus" NOT NULL DEFAULT 'pending',
    "raw_text" TEXT,
    "extracted_fields" JSONB NOT NULL DEFAULT '{}',
    "confidence_scores" JSONB NOT NULL DEFAULT '{}',
    "mean_confidence" DECIMAL(4,3),
    "ocr_provider" TEXT,
    "processing_time_ms" INTEGER,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "client_idempotency_key" UUID NOT NULL,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocr_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_images" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "contact_id" UUID,
    "uploaded_by" UUID NOT NULL,
    "storage_path" TEXT NOT NULL,
    "thumbnail_path" TEXT,
    "file_size_bytes" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL DEFAULT 'image/jpeg',
    "width_px" INTEGER,
    "height_px" INTEGER,
    "status" "CardImageStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "actor_id" UUID,
    "actor_role" "UserRole",
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "event_data" JSONB NOT NULL DEFAULT '{}',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "correlation_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exports" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "requested_by" UUID NOT NULL,
    "export_type" TEXT NOT NULL,
    "session_id" UUID,
    "filter_criteria" JSONB NOT NULL DEFAULT '{}',
    "status" "ExportStatus" NOT NULL DEFAULT 'pending',
    "record_count" INTEGER,
    "storage_path" TEXT,
    "signed_url" TEXT,
    "signed_url_expires_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_queue" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "client_idempotency_key" UUID NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "archived_payload" JSONB,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "scheduled_for" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationship_matches" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "incoming_ocr_job_id" UUID NOT NULL,
    "matched_contact_id" UUID NOT NULL,
    "match_confidence" DECIMAL(4,3) NOT NULL,
    "match_signals" JSONB NOT NULL DEFAULT '{}',
    "user_decision" TEXT,
    "decided_by" UUID,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relationship_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_merge_history" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "source_contact_id" UUID NOT NULL,
    "target_contact_id" UUID NOT NULL,
    "source_snapshot" JSONB NOT NULL,
    "merged_by" UUID NOT NULL,
    "merge_reason" TEXT,
    "is_reversed" BOOLEAN NOT NULL DEFAULT false,
    "reversed_by" UUID,
    "reversed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_merge_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "role" "UserRole" NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_stripe_customer_id_key" ON "organizations"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_supabase_uid_key" ON "users"("supabase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_refresh_sessions_refresh_jti_key" ON "auth_refresh_sessions"("refresh_jti");

-- CreateIndex
CREATE INDEX "auth_refresh_sessions_user_id_idx" ON "auth_refresh_sessions"("user_id");

-- CreateIndex
CREATE INDEX "contacts_organization_id_idx" ON "contacts"("organization_id");

-- CreateIndex
CREATE INDEX "contacts_organization_id_capture_mode_idx" ON "contacts"("organization_id", "capture_mode");

-- CreateIndex
CREATE INDEX "contacts_event_session_id_idx" ON "contacts"("event_session_id");

-- CreateIndex
CREATE INDEX "contacts_event_session_id_lead_qualifier_idx" ON "contacts"("event_session_id", "lead_qualifier");

-- CreateIndex
CREATE UNIQUE INDEX "contact_encounters_client_idempotency_key_key" ON "contact_encounters"("client_idempotency_key");

-- CreateIndex
CREATE INDEX "contact_encounters_contact_id_created_at_idx" ON "contact_encounters"("contact_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "contact_encounters_session_id_idx" ON "contact_encounters"("session_id");

-- CreateIndex
CREATE INDEX "event_sessions_organization_id_status_idx" ON "event_sessions"("organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "session_members_session_id_user_id_key" ON "session_members"("session_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ocr_jobs_client_idempotency_key_key" ON "ocr_jobs"("client_idempotency_key");

-- CreateIndex
CREATE INDEX "ocr_jobs_organization_id_status_created_at_idx" ON "ocr_jobs"("organization_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "audit_events_organization_id_created_at_idx" ON "audit_events"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sync_queue_client_idempotency_key_key" ON "sync_queue"("client_idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_organization_id_role_resource_action_key" ON "role_permissions"("organization_id", "role", "resource", "action");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_plan_fkey" FOREIGN KEY ("plan") REFERENCES "plans"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_refresh_sessions" ADD CONSTRAINT "auth_refresh_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_event_session_id_fkey" FOREIGN KEY ("event_session_id") REFERENCES "event_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_card_image_id_fkey" FOREIGN KEY ("card_image_id") REFERENCES "card_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_merged_into_id_fkey" FOREIGN KEY ("merged_into_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_encounters" ADD CONSTRAINT "contact_encounters_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_encounters" ADD CONSTRAINT "contact_encounters_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_encounters" ADD CONSTRAINT "contact_encounters_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "event_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_encounters" ADD CONSTRAINT "contact_encounters_captured_by_fkey" FOREIGN KEY ("captured_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_encounters" ADD CONSTRAINT "contact_encounters_card_image_id_fkey" FOREIGN KEY ("card_image_id") REFERENCES "card_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_encounters" ADD CONSTRAINT "contact_encounters_ocr_job_id_fkey" FOREIGN KEY ("ocr_job_id") REFERENCES "ocr_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sessions" ADD CONSTRAINT "event_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sessions" ADD CONSTRAINT "event_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_members" ADD CONSTRAINT "session_members_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "event_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_members" ADD CONSTRAINT "session_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_members" ADD CONSTRAINT "session_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_jobs" ADD CONSTRAINT "ocr_jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_jobs" ADD CONSTRAINT "ocr_jobs_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_jobs" ADD CONSTRAINT "ocr_jobs_card_image_id_fkey" FOREIGN KEY ("card_image_id") REFERENCES "card_images"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_jobs" ADD CONSTRAINT "ocr_jobs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "event_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_jobs" ADD CONSTRAINT "ocr_jobs_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_images" ADD CONSTRAINT "card_images_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_images" ADD CONSTRAINT "card_images_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_images" ADD CONSTRAINT "card_images_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "event_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationship_matches" ADD CONSTRAINT "relationship_matches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationship_matches" ADD CONSTRAINT "relationship_matches_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_merge_history" ADD CONSTRAINT "contact_merge_history_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_merge_history" ADD CONSTRAINT "contact_merge_history_merged_by_fkey" FOREIGN KEY ("merged_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_merge_history" ADD CONSTRAINT "contact_merge_history_reversed_by_fkey" FOREIGN KEY ("reversed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Extensions, seeds, RLS, and manual FKs not generated from Prisma schema
-- ---------------------------------------------------------------------------

-- Relationship match FKs to ocr_jobs / contacts
ALTER TABLE "relationship_matches" ADD CONSTRAINT "relationship_matches_incoming_ocr_job_id_fkey" FOREIGN KEY ("incoming_ocr_job_id") REFERENCES "ocr_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relationship_matches" ADD CONSTRAINT "relationship_matches_matched_contact_id_fkey" FOREIGN KEY ("matched_contact_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "relationship_matches_incoming_ocr_job_id_idx" ON "relationship_matches"("incoming_ocr_job_id");
CREATE INDEX "relationship_matches_matched_contact_id_idx" ON "relationship_matches"("matched_contact_id");

-- Fuzzy name/company search (pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "idx_contacts_name_company_trgm" ON "contacts" USING GIN (
  (coalesce("full_name", '') || ' ' || coalesce("company", '')) gin_trgm_ops
);

-- Seed default plans
INSERT INTO "plans" (
    "id",
    "code",
    "name",
    "price_inr",
    "billing_interval",
    "description",
    "is_active",
    "updated_at"
) VALUES
    (
        '00000000-0000-4000-9000-000000000001',
        'free',
        'Free',
        0,
        NULL,
        'Free plan for the entire CardVault product.',
        true,
        CURRENT_TIMESTAMP
    ),
    (
        '00000000-0000-4000-9000-000000000002',
        'pro',
        'Pro',
        99,
        'monthly',
        'Paid CardVault plan billed at 99 Rs per month.',
        true,
        CURRENT_TIMESTAMP
    )
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "price_inr" = EXCLUDED."price_inr",
    "billing_interval" = EXCLUDED."billing_interval",
    "description" = EXCLUDED."description",
    "is_active" = EXCLUDED."is_active",
    "updated_at" = CURRENT_TIMESTAMP;

-- Row Level Security
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'organizations', 'users', 'contacts', 'contact_encounters', 'event_sessions',
    'session_members', 'ocr_jobs', 'card_images', 'audit_events', 'exports',
    'sync_queue', 'notifications', 'relationship_matches', 'contact_merge_history'
  ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION current_org_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_org_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION platform_bypass_rls() RETURNS boolean AS $$
  SELECT COALESCE(current_setting('app.platform_bypass_rls', true), '') = 'true';
$$ LANGUAGE sql STABLE;

DROP POLICY IF EXISTS tenant_policy ON organizations;
CREATE POLICY tenant_policy ON organizations FOR ALL
  USING (platform_bypass_rls() OR id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON users;
CREATE POLICY tenant_policy ON users FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON contacts;
CREATE POLICY tenant_policy ON contacts FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON contact_encounters;
CREATE POLICY tenant_policy ON contact_encounters FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON event_sessions;
CREATE POLICY tenant_policy ON event_sessions FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON session_members;
CREATE POLICY tenant_policy ON session_members FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON ocr_jobs;
CREATE POLICY tenant_policy ON ocr_jobs FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON card_images;
CREATE POLICY tenant_policy ON card_images FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_select_policy ON audit_events;
CREATE POLICY tenant_select_policy ON audit_events FOR SELECT
  USING (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_insert_policy ON audit_events;
CREATE POLICY tenant_insert_policy ON audit_events FOR INSERT
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON exports;
CREATE POLICY tenant_policy ON exports FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON sync_queue;
CREATE POLICY tenant_policy ON sync_queue FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON notifications;
CREATE POLICY tenant_policy ON notifications FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON relationship_matches;
CREATE POLICY tenant_policy ON relationship_matches FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON contact_merge_history;
CREATE POLICY tenant_policy ON contact_merge_history FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());
