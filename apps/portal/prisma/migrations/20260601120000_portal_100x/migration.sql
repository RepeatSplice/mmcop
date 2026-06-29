-- AlterEnum
ALTER TYPE "portal"."TicketStatus" ADD VALUE IF NOT EXISTS 'AWAITING_CLIENT';

-- AlterTable
ALTER TABLE "portal"."Workspace" ADD COLUMN IF NOT EXISTS "medusaCustomerId" TEXT;
ALTER TABLE "portal"."Workspace" ADD COLUMN IF NOT EXISTS "calBookingUrl" TEXT;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "portal"."ServerMonitorProvider" AS ENUM ('MANUAL', 'BATTLEMETRICS', 'CFTOOLS', 'CUSTOM_WEBHOOK');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "portal"."WorkspaceChatRead" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkspaceChatRead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "portal"."WorkspaceServer" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "provider" "portal"."ServerMonitorProvider" NOT NULL DEFAULT 'MANUAL',
    "externalId" TEXT,
    "displayName" TEXT,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "playerCount" INTEGER NOT NULL DEFAULT 0,
    "maxPlayers" INTEGER NOT NULL DEFAULT 0,
    "mapName" TEXT,
    "version" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "lastRestartAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkspaceServer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "portal"."WorkspacePinnedUpdate" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "pinnedById" TEXT,
    "pinnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "WorkspacePinnedUpdate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceChatRead_workspaceId_userId_key" ON "portal"."WorkspaceChatRead"("workspaceId", "userId");
CREATE INDEX IF NOT EXISTS "WorkspaceChatRead_userId_idx" ON "portal"."WorkspaceChatRead"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceServer_workspaceId_key" ON "portal"."WorkspaceServer"("workspaceId");
CREATE INDEX IF NOT EXISTS "WorkspaceServer_provider_idx" ON "portal"."WorkspaceServer"("provider");
CREATE INDEX IF NOT EXISTS "WorkspacePinnedUpdate_workspaceId_active_pinnedAt_idx" ON "portal"."WorkspacePinnedUpdate"("workspaceId", "active", "pinnedAt");

DO $$ BEGIN
  ALTER TABLE "portal"."WorkspaceChatRead" ADD CONSTRAINT "WorkspaceChatRead_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "portal"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "portal"."WorkspaceServer" ADD CONSTRAINT "WorkspaceServer_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "portal"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "portal"."WorkspacePinnedUpdate" ADD CONSTRAINT "WorkspacePinnedUpdate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "portal"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
