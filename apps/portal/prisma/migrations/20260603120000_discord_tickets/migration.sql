-- Discord support tickets

CREATE TYPE "DiscordTicketType" AS ENUM ('GENERAL_INQUIRY', 'CUSTOMER_SUPPORT', 'ORDER');

CREATE TABLE "DiscordTicketPanel" (
    "guildId" TEXT NOT NULL,
    "type" "DiscordTicketType" NOT NULL,
    "channelId" TEXT NOT NULL,
    "messageId" TEXT,
    "categoryId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordTicketPanel_pkey" PRIMARY KEY ("guildId","type")
);

CREATE TABLE "DiscordTicket" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "type" "DiscordTicketType" NOT NULL,
    "reason" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "extra" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "portalTicketId" TEXT,

    CONSTRAINT "DiscordTicket_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DiscordTicket_guildId_memberId_closedAt_idx" ON "DiscordTicket"("guildId", "memberId", "closedAt");
CREATE INDEX "DiscordTicket_channelId_idx" ON "DiscordTicket"("channelId");
