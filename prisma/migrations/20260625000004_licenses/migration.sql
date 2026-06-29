-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('ACTIVE', 'GRACE', 'REVOKED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "ServerLicense" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "status" "LicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "maxServers" INTEGER,
    "gracePeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegisteredServer" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "label" TEXT,
    "isTestServer" BOOLEAN NOT NULL DEFAULT false,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "RegisteredServer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServerLicense_orderItemId_key" ON "ServerLicense"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "RegisteredServer_licenseId_ipAddress_key" ON "RegisteredServer"("licenseId", "ipAddress");

-- CreateIndex
CREATE INDEX "RegisteredServer_ipAddress_idx" ON "RegisteredServer"("ipAddress");

-- AddForeignKey
ALTER TABLE "ServerLicense" ADD CONSTRAINT "ServerLicense_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerLicense" ADD CONSTRAINT "ServerLicense_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerLicense" ADD CONSTRAINT "ServerLicense_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisteredServer" ADD CONSTRAINT "RegisteredServer_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "ServerLicense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
