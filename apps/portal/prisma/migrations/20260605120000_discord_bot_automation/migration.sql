-- Discord bot guild automation (auto-roles, UI sessions)

CREATE TYPE "DiscordConnectedRoleAction" AS ENUM ('ADD_ON_GAIN', 'REMOVE_ON_LOSS');

CREATE TABLE "DiscordGuildSettings" (
    "guildId" TEXT NOT NULL,
    "tagRoleId" TEXT,
    "uiRoleId" TEXT,
    "uiCategoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordGuildSettings_pkey" PRIMARY KEY ("guildId")
);

CREATE TABLE "DiscordJoinRole" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "DiscordJoinRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscordAgeRoleRule" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "days" INTEGER NOT NULL,

    CONSTRAINT "DiscordAgeRoleRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscordTimedRoleRule" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,

    CONSTRAINT "DiscordTimedRoleRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscordConnectedRoleRule" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "triggerRoleId" TEXT NOT NULL,
    "targetRoleId" TEXT NOT NULL,
    "action" "DiscordConnectedRoleAction" NOT NULL DEFAULT 'ADD_ON_GAIN',

    CONSTRAINT "DiscordConnectedRoleRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscordTimedRoleGrant" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscordTimedRoleGrant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscordUiSession" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "savedRoleIds" TEXT[],
    "openedById" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscordUiSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DiscordJoinRole_guildId_roleId_key" ON "DiscordJoinRole"("guildId", "roleId");
CREATE UNIQUE INDEX "DiscordAgeRoleRule_guildId_roleId_key" ON "DiscordAgeRoleRule"("guildId", "roleId");
CREATE UNIQUE INDEX "DiscordTimedRoleRule_guildId_roleId_key" ON "DiscordTimedRoleRule"("guildId", "roleId");
CREATE UNIQUE INDEX "DiscordConnectedRoleRule_guildId_triggerRoleId_targetRoleId_action_key" ON "DiscordConnectedRoleRule"("guildId", "triggerRoleId", "targetRoleId", "action");
CREATE INDEX "DiscordTimedRoleGrant_expiresAt_idx" ON "DiscordTimedRoleGrant"("expiresAt");
CREATE INDEX "DiscordTimedRoleGrant_guildId_memberId_idx" ON "DiscordTimedRoleGrant"("guildId", "memberId");
CREATE INDEX "DiscordUiSession_guildId_memberId_closedAt_idx" ON "DiscordUiSession"("guildId", "memberId", "closedAt");
CREATE INDEX "DiscordUiSession_channelId_idx" ON "DiscordUiSession"("channelId");

ALTER TABLE "DiscordJoinRole" ADD CONSTRAINT "DiscordJoinRole_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "DiscordGuildSettings"("guildId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscordAgeRoleRule" ADD CONSTRAINT "DiscordAgeRoleRule_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "DiscordGuildSettings"("guildId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscordTimedRoleRule" ADD CONSTRAINT "DiscordTimedRoleRule_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "DiscordGuildSettings"("guildId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscordConnectedRoleRule" ADD CONSTRAINT "DiscordConnectedRoleRule_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "DiscordGuildSettings"("guildId") ON DELETE CASCADE ON UPDATE CASCADE;
