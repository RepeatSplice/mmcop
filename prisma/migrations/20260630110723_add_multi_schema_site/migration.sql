-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "site";

-- CreateEnum
CREATE TYPE "site"."StaffRole" AS ENUM ('ADMIN', 'EDITOR', 'SHOP_MANAGER');

-- CreateEnum
CREATE TYPE "site"."NewsCategory" AS ENUM ('modding', 'servers', 'software', 'company');

-- CreateEnum
CREATE TYPE "site"."NewsStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "site"."JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "site"."ApplicationStatus" AS ENUM ('NEW', 'REVIEWED', 'SHORTLISTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "site"."ContactTopic" AS ENUM ('general', 'partnership', 'modding', 'servers', 'software', 'other');

-- CreateEnum
CREATE TYPE "site"."ContactEnquiryStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM');

-- CreateEnum
CREATE TYPE "site"."EmailDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "site"."OAuthProvider" AS ENUM ('steam', 'discord');

-- CreateEnum
CREATE TYPE "site"."ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'WAITLIST');

-- CreateEnum
CREATE TYPE "site"."ProductCategory" AS ENUM ('modding', 'software', 'hosting', 'bundle', 'other');

-- CreateEnum
CREATE TYPE "site"."OrderStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "site"."LicenseStatus" AS ENUM ('ACTIVE', 'GRACE', 'REVOKED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "site"."ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "site"."StaffUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "site"."StaffRole" NOT NULL DEFAULT 'EDITOR',
    "totpSecretEnc" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "backupCodesHash" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."Session" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."PendingTwoFactor" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingTwoFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."NewsPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" "site"."NewsCategory" NOT NULL,
    "status" "site"."NewsStatus" NOT NULL DEFAULT 'DRAFT',
    "bannerImageUrl" TEXT,
    "heroImageUrl" TEXT,
    "externalLink" TEXT,
    "ctaButtons" JSONB,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."Job" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "workType" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "applicationEmail" TEXT NOT NULL DEFAULT 'careers@monarch-modding.com',
    "status" "site"."JobStatus" NOT NULL DEFAULT 'DRAFT',
    "applyFormConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."JobApplication" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "site"."ApplicationStatus" NOT NULL DEFAULT 'NEW',
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "portfolioUrl" TEXT,
    "githubUrl" TEXT,
    "discord" TEXT,
    "coverLetter" TEXT NOT NULL,
    "staffNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."ApplicationFile" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,

    CONSTRAINT "ApplicationFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."ContactEnquiry" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "topic" "site"."ContactTopic" NOT NULL,
    "message" TEXT NOT NULL,
    "status" "site"."ContactEnquiryStatus" NOT NULL DEFAULT 'NEW',
    "customerAckStatus" "site"."EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "staffNotifyStatus" "site"."EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "staffNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."Customer" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "passwordHash" TEXT,
    "totpSecretEnc" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "backupCodesHash" TEXT,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "portalUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."ConnectedAccount" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "provider" "site"."OAuthProvider" NOT NULL,
    "providerId" TEXT NOT NULL,
    "username" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,

    CONSTRAINT "ConnectedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."CustomerSession" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "site"."ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "category" "site"."ProductCategory" NOT NULL,
    "imageUrl" TEXT,
    "previewImages" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceUsd" INTEGER NOT NULL,
    "stripePriceId" TEXT,
    "maxServers" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."ProductFile" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."ProductChangelog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductChangelog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."BundleItem" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "BundleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."Waitlist" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."CartItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."AffiliateCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "discountPct" INTEGER NOT NULL DEFAULT 0,
    "commissionPct" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."Order" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'gbp',
    "totalMinorUnits" INTEGER NOT NULL,
    "tosAcceptedAt" TIMESTAMP(3),
    "status" "site"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "affiliateCodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "priceMinorUnits" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'gbp',

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."ServerLicense" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "status" "site"."LicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "maxServers" INTEGER,
    "gracePeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."RegisteredServer" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "label" TEXT,
    "isTestServer" BOOLEAN NOT NULL DEFAULT false,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "RegisteredServer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."ProductReview" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "status" "site"."ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site"."SupportNote" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "customerId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_email_key" ON "site"."StaffUser"("email");

-- CreateIndex
CREATE INDEX "Session_staffId_idx" ON "site"."Session"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "PendingTwoFactor_staffId_key" ON "site"."PendingTwoFactor"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsPost_slug_key" ON "site"."NewsPost"("slug");

-- CreateIndex
CREATE INDEX "NewsPost_publishedAt_idx" ON "site"."NewsPost"("publishedAt");

-- CreateIndex
CREATE INDEX "NewsPost_status_idx" ON "site"."NewsPost"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Job_slug_key" ON "site"."Job"("slug");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "site"."Job"("status");

-- CreateIndex
CREATE INDEX "JobApplication_jobId_idx" ON "site"."JobApplication"("jobId");

-- CreateIndex
CREATE INDEX "JobApplication_status_idx" ON "site"."JobApplication"("status");

-- CreateIndex
CREATE INDEX "JobApplication_createdAt_idx" ON "site"."JobApplication"("createdAt");

-- CreateIndex
CREATE INDEX "ContactEnquiry_status_idx" ON "site"."ContactEnquiry"("status");

-- CreateIndex
CREATE INDEX "ContactEnquiry_createdAt_idx" ON "site"."ContactEnquiry"("createdAt");

-- CreateIndex
CREATE INDEX "ContactEnquiry_topic_idx" ON "site"."ContactEnquiry"("topic");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "site"."Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_portalUserId_key" ON "site"."Customer"("portalUserId");

-- CreateIndex
CREATE INDEX "ConnectedAccount_customerId_idx" ON "site"."ConnectedAccount"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectedAccount_provider_providerId_key" ON "site"."ConnectedAccount"("provider", "providerId");

-- CreateIndex
CREATE INDEX "CustomerSession_customerId_idx" ON "site"."CustomerSession"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "site"."Product"("slug");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "site"."ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductFile_productId_idx" ON "site"."ProductFile"("productId");

-- CreateIndex
CREATE INDEX "ProductFile_isLatest_idx" ON "site"."ProductFile"("isLatest");

-- CreateIndex
CREATE INDEX "ProductChangelog_productId_idx" ON "site"."ProductChangelog"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "BundleItem_bundleId_productId_key" ON "site"."BundleItem"("bundleId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_productId_email_key" ON "site"."Waitlist"("productId", "email");

-- CreateIndex
CREATE INDEX "CartItem_sessionId_idx" ON "site"."CartItem"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateCode_code_key" ON "site"."AffiliateCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "site"."Order"("stripeSessionId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "site"."OrderItem"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ServerLicense_orderItemId_key" ON "site"."ServerLicense"("orderItemId");

-- CreateIndex
CREATE INDEX "RegisteredServer_ipAddress_idx" ON "site"."RegisteredServer"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "RegisteredServer_licenseId_ipAddress_key" ON "site"."RegisteredServer"("licenseId", "ipAddress");

-- CreateIndex
CREATE INDEX "ProductReview_productId_status_idx" ON "site"."ProductReview"("productId", "status");

-- CreateIndex
CREATE INDEX "ProductReview_status_idx" ON "site"."ProductReview"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_productId_customerId_key" ON "site"."ProductReview"("productId", "customerId");

-- AddForeignKey
ALTER TABLE "site"."Session" ADD CONSTRAINT "Session_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "site"."StaffUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."PendingTwoFactor" ADD CONSTRAINT "PendingTwoFactor_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "site"."StaffUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."JobApplication" ADD CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "site"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."ApplicationFile" ADD CONSTRAINT "ApplicationFile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "site"."JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "site"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."CustomerSession" ADD CONSTRAINT "CustomerSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "site"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "site"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."ProductFile" ADD CONSTRAINT "ProductFile_productId_fkey" FOREIGN KEY ("productId") REFERENCES "site"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."ProductChangelog" ADD CONSTRAINT "ProductChangelog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "site"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."BundleItem" ADD CONSTRAINT "BundleItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "site"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."BundleItem" ADD CONSTRAINT "BundleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "site"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."Waitlist" ADD CONSTRAINT "Waitlist_productId_fkey" FOREIGN KEY ("productId") REFERENCES "site"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "site"."ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "site"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."Order" ADD CONSTRAINT "Order_affiliateCodeId_fkey" FOREIGN KEY ("affiliateCodeId") REFERENCES "site"."AffiliateCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "site"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "site"."ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."ServerLicense" ADD CONSTRAINT "ServerLicense_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "site"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."ServerLicense" ADD CONSTRAINT "ServerLicense_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "site"."OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."ServerLicense" ADD CONSTRAINT "ServerLicense_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "site"."ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."RegisteredServer" ADD CONSTRAINT "RegisteredServer_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "site"."ServerLicense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "site"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."ProductReview" ADD CONSTRAINT "ProductReview_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "site"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."SupportNote" ADD CONSTRAINT "SupportNote_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "site"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."SupportNote" ADD CONSTRAINT "SupportNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "site"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site"."SupportNote" ADD CONSTRAINT "SupportNote_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "site"."StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
