import { prisma } from "../prisma.js"
import { config } from "../config.js"

export async function getOrCreateGuildSettings(guildId = config.guildId()) {
  return prisma.discordGuildSettings.upsert({
    where: { guildId },
    create: { guildId },
    update: {},
    include: {
      joinRoles: true,
      ageRoleRules: true,
      timedRoleRules: true,
      connectedRules: true,
    },
  })
}

export async function resolveUiRoleId(guildId: string): Promise<string | null> {
  const fromEnv = config.uiRoleId()
  if (fromEnv) return fromEnv
  const row = await prisma.discordGuildSettings.findUnique({ where: { guildId } })
  return row?.uiRoleId ?? null
}
