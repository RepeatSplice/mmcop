-- CreateEnum
CREATE TYPE "ContactTopic" AS ENUM ('general', 'partnership', 'modding', 'servers', 'software', 'other');

-- CreateEnum
CREATE TYPE "ContactEnquiryStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM');

-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'SKIPPED', 'FAILED');

-- CreateTable
CREATE TABLE "ContactEnquiry" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "topic" "ContactTopic" NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactEnquiryStatus" NOT NULL DEFAULT 'NEW',
    "customerAckStatus" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "staffNotifyStatus" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "staffNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactEnquiry_status_idx" ON "ContactEnquiry"("status");

-- CreateIndex
CREATE INDEX "ContactEnquiry_createdAt_idx" ON "ContactEnquiry"("createdAt");

-- CreateIndex
CREATE INDEX "ContactEnquiry_topic_idx" ON "ContactEnquiry"("topic");
