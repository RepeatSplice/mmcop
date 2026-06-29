-- Add security and onboarding fields to Customer
ALTER TABLE "Customer" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "Customer" ADD COLUMN "totpSecretEnc" TEXT;
ALTER TABLE "Customer" ADD COLUMN "totpEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Customer" ADD COLUMN "backupCodesHash" TEXT;
-- Default true so existing customers are not forced through onboarding
ALTER TABLE "Customer" ADD COLUMN "onboardingComplete" BOOLEAN NOT NULL DEFAULT true;
