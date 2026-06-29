-- AlterTable
ALTER TABLE "portal"."User" ADD COLUMN IF NOT EXISTS "discordUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_discordUserId_key" ON "portal"."User"("discordUserId");

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "portal"."ChatChannel" AS ENUM ('CHAT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "portal"."ChatMessageSource" AS ENUM ('PORTAL', 'DISCORD');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "portal"."WorkspaceDiscord" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "chatChannelId" TEXT NOT NULL,
    "announcementsChannelId" TEXT NOT NULL,
    "logsChannelId" TEXT NOT NULL,
    "infoChannelId" TEXT NOT NULL,
    "provisionedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceDiscord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "portal"."WorkspaceChatMessage" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "channel" "portal"."ChatChannel" NOT NULL DEFAULT 'CHAT',
    "body" TEXT NOT NULL,
    "authorUserId" TEXT,
    "authorDiscordId" TEXT,
    "authorDisplayName" TEXT NOT NULL,
    "source" "portal"."ChatMessageSource" NOT NULL,
    "discordMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceDiscord_workspaceId_key" ON "portal"."WorkspaceDiscord"("workspaceId");
CREATE INDEX IF NOT EXISTS "WorkspaceDiscord_guildId_idx" ON "portal"."WorkspaceDiscord"("guildId");
CREATE INDEX IF NOT EXISTS "WorkspaceDiscord_chatChannelId_idx" ON "portal"."WorkspaceDiscord"("chatChannelId");

CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceChatMessage_discordMessageId_key" ON "portal"."WorkspaceChatMessage"("discordMessageId");
CREATE INDEX IF NOT EXISTS "WorkspaceChatMessage_workspaceId_createdAt_idx" ON "portal"."WorkspaceChatMessage"("workspaceId", "createdAt");
CREATE INDEX IF NOT EXISTS "WorkspaceChatMessage_workspaceId_channel_createdAt_idx" ON "portal"."WorkspaceChatMessage"("workspaceId", "channel", "createdAt");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "portal"."WorkspaceDiscord" ADD CONSTRAINT "WorkspaceDiscord_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "portal"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "portal"."WorkspaceChatMessage" ADD CONSTRAINT "WorkspaceChatMessage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "portal"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "portal"."WorkspaceChatMessage" ADD CONSTRAINT "WorkspaceChatMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "portal"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Backfill discordUserId from Discord OAuth accounts
UPDATE "portal"."User" u
SET "discordUserId" = a."providerAccountId"
FROM "portal"."Account" a
WHERE a."userId" = u.id
  AND a."provider" = 'discord'
  AND u."discordUserId" IS NULL;
