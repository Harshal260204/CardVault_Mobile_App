/*
  Warnings:

  - You are about to drop the column `organization_id` on the `audit_events` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `card_images` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `contact_encounters` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `contact_merge_history` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `contacts` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `event_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `exports` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `ocr_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `relationship_matches` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `session_members` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `sync_queue` table. All the data in the column will be lost.
  - You are about to drop the column `invited_by` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `organizations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `plans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_permissions` table. If the table is not empty, all the data it contains will be lost.

*/
-- Drop policies
DROP POLICY IF EXISTS "tenant_select_policy" ON "audit_events" CASCADE;
DROP POLICY IF EXISTS "tenant_insert_policy" ON "audit_events" CASCADE;
DROP POLICY IF EXISTS "tenant_update_policy" ON "audit_events" CASCADE;
DROP POLICY IF EXISTS "tenant_delete_policy" ON "audit_events" CASCADE;
DROP POLICY IF EXISTS "tenant_policy" ON "audit_events" CASCADE;

DROP POLICY IF EXISTS "tenant_select_policy" ON "card_images" CASCADE;
DROP POLICY IF EXISTS "tenant_insert_policy" ON "card_images" CASCADE;
DROP POLICY IF EXISTS "tenant_update_policy" ON "card_images" CASCADE;
DROP POLICY IF EXISTS "tenant_delete_policy" ON "card_images" CASCADE;
DROP POLICY IF EXISTS "tenant_policy" ON "card_images" CASCADE;

DROP POLICY IF EXISTS "tenant_select_policy" ON "contact_encounters" CASCADE;
DROP POLICY IF EXISTS "tenant_insert_policy" ON "contact_encounters" CASCADE;
DROP POLICY IF EXISTS "tenant_update_policy" ON "contact_encounters" CASCADE;
DROP POLICY IF EXISTS "tenant_delete_policy" ON "contact_encounters" CASCADE;
DROP POLICY IF EXISTS "tenant_policy" ON "contact_encounters" CASCADE;

DROP POLICY IF EXISTS "tenant_select_policy" ON "contact_encounters" CASCADE;
DROP POLICY IF EXISTS "tenant_insert_policy" ON "contact_encounters" CASCADE;
DROP POLICY IF EXISTS "tenant_update_policy" ON "contact_encounters" CASCADE;
DROP POLICY IF EXISTS "tenant_delete_policy" ON "contact_encounters" CASCADE;

DROP POLICY IF EXISTS "tenant_select_policy" ON "contact_merge_history" CASCADE;
DROP POLICY IF EXISTS "tenant_insert_policy" ON "contact_merge_history" CASCADE;
DROP POLICY IF EXISTS "tenant_update_policy" ON "contact_merge_history" CASCADE;
DROP POLICY IF EXISTS "tenant_delete_policy" ON "contact_merge_history" CASCADE;
DROP POLICY IF EXISTS "tenant_policy" ON "contact_merge_history" CASCADE;

DROP POLICY IF EXISTS "tenant_select_policy" ON "contacts" CASCADE;
DROP POLICY IF EXISTS "tenant_insert_policy" ON "contacts" CASCADE;
DROP POLICY IF EXISTS "tenant_update_policy" ON "contacts" CASCADE;
DROP POLICY IF EXISTS "tenant_delete_policy" ON "contacts" CASCADE;
DROP POLICY IF EXISTS "tenant_policy" ON "contacts" CASCADE;

DROP POLICY IF EXISTS "tenant_select_policy" ON "event_sessions" CASCADE;
DROP POLICY IF EXISTS "tenant_insert_policy" ON "event_sessions" CASCADE;
DROP POLICY IF EXISTS "tenant_update_policy" ON "event_sessions" CASCADE;
DROP POLICY IF EXISTS "tenant_delete_policy" ON "event_sessions" CASCADE;
DROP POLICY IF EXISTS "tenant_policy" ON "event_sessions" CASCADE;

DROP POLICY IF EXISTS "tenant_select_policy" ON "exports" CASCADE;
DROP POLICY IF EXISTS "tenant_insert_policy" ON "exports" CASCADE;
DROP POLICY IF EXISTS "tenant_update_policy" ON "exports" CASCADE;
DROP POLICY IF EXISTS "tenant_delete_policy" ON "exports" CASCADE;
DROP POLICY IF EXISTS "tenant_policy" ON "exports" CASCADE;

DROP POLICY IF EXISTS "tenant_select_policy" ON "notifications" CASCADE;
DROP POLICY IF EXISTS "tenant_insert_policy" ON "notifications" CASCADE;
DROP POLICY IF EXISTS "tenant_update_policy" ON "notifications" CASCADE;
DROP POLICY IF EXISTS "tenant_delete_policy" ON "notifications" CASCADE;
DROP POLICY IF EXISTS "tenant_policy" ON "notifications" CASCADE;

DROP POLICY IF EXISTS "tenant_select_policy" ON "ocr_jobs" CASCADE;
DROP POLICY IF EXISTS "tenant_insert_policy" ON "ocr_jobs" CASCADE;
DROP POLICY IF EXISTS "tenant_update_policy" ON "ocr_jobs" CASCADE;
DROP POLICY IF EXISTS "tenant_delete_policy" ON "ocr_jobs" CASCADE;
DROP POLICY IF EXISTS "tenant_policy" ON "ocr_jobs" CASCADE;

DROP POLICY IF EXISTS "tenant_select_policy" ON "relationship_matches" CASCADE;
DROP POLICY IF EXISTS "tenant_insert_policy" ON "relationship_matches" CASCADE;
DROP POLICY IF EXISTS "tenant_update_policy" ON "relationship_matches" CASCADE;
DROP POLICY IF EXISTS "tenant_delete_policy" ON "relationship_matches" CASCADE;
DROP POLICY IF EXISTS "tenant_policy" ON "relationship_matches" CASCADE;

DROP POLICY IF EXISTS "tenant_select_policy" ON "session_members" CASCADE;
DROP POLICY IF EXISTS "tenant_insert_policy" ON "session_members" CASCADE;
DROP POLICY IF EXISTS "tenant_update_policy" ON "session_members" CASCADE;
DROP POLICY IF EXISTS "tenant_delete_policy" ON "session_members" CASCADE;
DROP POLICY IF EXISTS "tenant_policy" ON "session_members" CASCADE;

DROP POLICY IF EXISTS "tenant_select_policy" ON "sync_queue" CASCADE;
DROP POLICY IF EXISTS "tenant_insert_policy" ON "sync_queue" CASCADE;
DROP POLICY IF EXISTS "tenant_update_policy" ON "sync_queue" CASCADE;
DROP POLICY IF EXISTS "tenant_delete_policy" ON "sync_queue" CASCADE;
DROP POLICY IF EXISTS "tenant_policy" ON "sync_queue" CASCADE;

DROP POLICY IF EXISTS "tenant_select_policy" ON "users" CASCADE;
DROP POLICY IF EXISTS "tenant_insert_policy" ON "users" CASCADE;
DROP POLICY IF EXISTS "tenant_update_policy" ON "users" CASCADE;
DROP POLICY IF EXISTS "tenant_delete_policy" ON "users" CASCADE;
DROP POLICY IF EXISTS "tenant_policy" ON "users" CASCADE;

-- DropForeignKey
ALTER TABLE "audit_events" DROP CONSTRAINT "audit_events_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "card_images" DROP CONSTRAINT "card_images_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "contact_encounters" DROP CONSTRAINT "contact_encounters_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "contact_merge_history" DROP CONSTRAINT "contact_merge_history_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "event_sessions" DROP CONSTRAINT "event_sessions_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "exports" DROP CONSTRAINT "exports_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "ocr_jobs" DROP CONSTRAINT "ocr_jobs_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_plan_fkey";

-- DropForeignKey
ALTER TABLE "relationship_matches" DROP CONSTRAINT "relationship_matches_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "session_members" DROP CONSTRAINT "session_members_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "sync_queue" DROP CONSTRAINT "sync_queue_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_invited_by_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_organization_id_fkey";

-- DropIndex
DROP INDEX "audit_events_organization_id_created_at_idx";

-- DropIndex
DROP INDEX "contacts_organization_id_capture_mode_idx";

-- DropIndex
DROP INDEX "contacts_organization_id_idx";

-- DropIndex
DROP INDEX "event_sessions_organization_id_status_idx";

-- DropIndex
DROP INDEX "ocr_jobs_organization_id_status_created_at_idx";

-- DropIndex
DROP INDEX "users_organization_id_idx";

-- AlterTable
ALTER TABLE "audit_events" DROP COLUMN "organization_id";

-- AlterTable
ALTER TABLE "card_images" DROP COLUMN "organization_id";

-- AlterTable
ALTER TABLE "contact_encounters" DROP COLUMN "organization_id";

-- AlterTable
ALTER TABLE "contact_merge_history" DROP COLUMN "organization_id";

-- AlterTable
ALTER TABLE "contacts" DROP COLUMN "organization_id";

-- AlterTable
ALTER TABLE "event_sessions" DROP COLUMN "organization_id";

-- AlterTable
ALTER TABLE "exports" DROP COLUMN "organization_id";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "organization_id";

-- AlterTable
ALTER TABLE "ocr_jobs" DROP COLUMN "organization_id";

-- AlterTable
ALTER TABLE "relationship_matches" DROP COLUMN "organization_id";

-- AlterTable
ALTER TABLE "session_members" DROP COLUMN "organization_id";

-- AlterTable
ALTER TABLE "sync_queue" DROP COLUMN "organization_id";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "invited_by",
DROP COLUMN "organization_id";

-- DropTable
DROP TABLE "organizations";

-- DropTable
DROP TABLE "plans";

-- DropTable
DROP TABLE "role_permissions";

-- CreateIndex
CREATE INDEX "audit_events_created_at_idx" ON "audit_events"("created_at" DESC);

-- CreateIndex
CREATE INDEX "card_images_uploaded_by_idx" ON "card_images"("uploaded_by");

-- CreateIndex
CREATE INDEX "card_images_contact_id_idx" ON "card_images"("contact_id");

-- CreateIndex
CREATE INDEX "contact_encounters_captured_by_idx" ON "contact_encounters"("captured_by");

-- CreateIndex
CREATE INDEX "contact_encounters_card_image_id_idx" ON "contact_encounters"("card_image_id");

-- CreateIndex
CREATE INDEX "contact_encounters_ocr_job_id_idx" ON "contact_encounters"("ocr_job_id");

-- CreateIndex
CREATE INDEX "contact_merge_history_source_contact_id_idx" ON "contact_merge_history"("source_contact_id");

-- CreateIndex
CREATE INDEX "contact_merge_history_target_contact_id_idx" ON "contact_merge_history"("target_contact_id");

-- CreateIndex
CREATE INDEX "contact_merge_history_merged_by_idx" ON "contact_merge_history"("merged_by");

-- CreateIndex
CREATE INDEX "contact_merge_history_reversed_by_idx" ON "contact_merge_history"("reversed_by");

-- CreateIndex
CREATE INDEX "contacts_created_by_idx" ON "contacts"("created_by");

-- CreateIndex
CREATE INDEX "contacts_card_image_id_idx" ON "contacts"("card_image_id");

-- CreateIndex
CREATE INDEX "contacts_merged_into_id_idx" ON "contacts"("merged_into_id");

-- CreateIndex
CREATE INDEX "event_sessions_status_idx" ON "event_sessions"("status");

-- CreateIndex
CREATE INDEX "event_sessions_created_by_idx" ON "event_sessions"("created_by");

-- CreateIndex
CREATE INDEX "exports_requested_by_idx" ON "exports"("requested_by");

-- CreateIndex
CREATE INDEX "exports_session_id_idx" ON "exports"("session_id");

-- CreateIndex
CREATE INDEX "ocr_jobs_status_created_at_idx" ON "ocr_jobs"("status", "created_at");

-- CreateIndex
CREATE INDEX "ocr_jobs_submitted_by_idx" ON "ocr_jobs"("submitted_by");

-- CreateIndex
CREATE INDEX "ocr_jobs_contact_id_idx" ON "ocr_jobs"("contact_id");

-- CreateIndex
CREATE INDEX "ocr_jobs_card_image_id_idx" ON "ocr_jobs"("card_image_id");

-- CreateIndex
CREATE INDEX "ocr_jobs_session_id_idx" ON "ocr_jobs"("session_id");

-- CreateIndex
CREATE INDEX "relationship_matches_incoming_ocr_job_id_idx" ON "relationship_matches"("incoming_ocr_job_id");

-- CreateIndex
CREATE INDEX "relationship_matches_matched_contact_id_idx" ON "relationship_matches"("matched_contact_id");

-- CreateIndex
CREATE INDEX "relationship_matches_decided_by_idx" ON "relationship_matches"("decided_by");

-- CreateIndex
CREATE INDEX "session_members_user_id_idx" ON "session_members"("user_id");
