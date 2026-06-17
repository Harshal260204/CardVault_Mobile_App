-- DropForeignKey
ALTER TABLE "relationship_matches" DROP CONSTRAINT "relationship_matches_incoming_ocr_job_id_fkey";

-- DropForeignKey
ALTER TABLE "relationship_matches" DROP CONSTRAINT "relationship_matches_matched_contact_id_fkey";

-- DropIndex
DROP INDEX "relationship_matches_incoming_ocr_job_id_idx";

-- DropIndex
DROP INDEX "relationship_matches_matched_contact_id_idx";
