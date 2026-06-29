-- CreateEnum
CREATE TYPE "NewsStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "NewsPost" ADD COLUMN "status" "NewsStatus";
ALTER TABLE "NewsPost" ADD COLUMN "bannerImageUrl" TEXT;
ALTER TABLE "NewsPost" ADD COLUMN "heroImageUrl" TEXT;
ALTER TABLE "NewsPost" ADD COLUMN "ctaButtons" JSONB;

-- Migrate imageUrl -> bannerImageUrl, isDraft -> status
UPDATE "NewsPost" SET "bannerImageUrl" = "imageUrl" WHERE "imageUrl" IS NOT NULL;
UPDATE "NewsPost" SET "status" = CASE WHEN "isDraft" = true THEN 'DRAFT'::"NewsStatus" ELSE 'PUBLISHED'::"NewsStatus" END;

ALTER TABLE "NewsPost" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "NewsPost" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

ALTER TABLE "NewsPost" DROP COLUMN "imageUrl";
ALTER TABLE "NewsPost" DROP COLUMN "isDraft";

DROP INDEX IF EXISTS "NewsPost_isDraft_idx";
CREATE INDEX "NewsPost_status_idx" ON "NewsPost"("status");
