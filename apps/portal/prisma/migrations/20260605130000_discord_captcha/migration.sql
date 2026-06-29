-- Discord verification captcha

CREATE TABLE "DiscordCaptchaConfig" (
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "panelMessageId" TEXT,
    "unverifiedRoleId" TEXT NOT NULL,
    "verifiedRoleId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordCaptchaConfig_pkey" PRIMARY KEY ("guildId")
);
