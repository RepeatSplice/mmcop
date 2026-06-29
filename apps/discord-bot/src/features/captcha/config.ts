import { prisma } from "../../prisma.js"
import { config } from "../../config.js"

export type CaptchaConfig = {
  guildId: string
  channelId: string
  panelMessageId: string | null
  unverifiedRoleId: string
  verifiedRoleId: string
  enabled: boolean
}

export async function getCaptchaConfig(guildId = config.guildId()): Promise<CaptchaConfig | null> {
  const row = await prisma.discordCaptchaConfig.findUnique({ where: { guildId } })
  if (!row || !row.enabled) return null

  const unverified = config.captchaUnverifiedRoleId() ?? row.unverifiedRoleId
  const verified = config.captchaVerifiedRoleId() ?? row.verifiedRoleId

  return {
    guildId: row.guildId,
    channelId: row.channelId,
    panelMessageId: row.panelMessageId,
    unverifiedRoleId: unverified,
    verifiedRoleId: verified,
    enabled: row.enabled,
  }
}

export async function isCaptchaActive(guildId: string): Promise<boolean> {
  const row = await getCaptchaConfig(guildId)
  return row !== null
}
