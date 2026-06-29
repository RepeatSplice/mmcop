-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "status" "JobStatus";
ALTER TABLE "Job" ADD COLUMN "applyFormConfig" JSONB;

UPDATE "Job" SET "status" = CASE WHEN "isPublished" = true THEN 'PUBLISHED'::"JobStatus" ELSE 'DRAFT'::"JobStatus" END;

ALTER TABLE "Job" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Job" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

ALTER TABLE "Job" DROP COLUMN "isPublished";

DROP INDEX IF EXISTS "Job_isPublished_idx";
CREATE INDEX "Job_status_idx" ON "Job"("status");
