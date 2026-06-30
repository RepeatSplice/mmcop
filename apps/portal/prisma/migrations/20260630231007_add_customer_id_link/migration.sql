-- AlterTable: add customerId link to site.Customer for the same Discord identity
ALTER TABLE "User" ADD COLUMN "customerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_customerId_key" ON "User"("customerId");
