import { prisma } from "../../prisma.js"

type ConnectedRoleAction = "ADD_ON_GAIN" | "REMOVE_ON_LOSS"
import { getOrCreateGuildSettings } from "../../lib/guild-settings.js"

export async function setJoinRoles(guildId: string, roleIds: string[]) {
  const unique = [...new Set(roleIds)].slice(0, 7)
  await prisma.$transaction([
    prisma.discordJoinRole.deleteMany({ where: { guildId } }),
    ...unique.map((roleId) =>
      prisma.discordJoinRole.create({ data: { guildId, roleId } })
    ),
  ])
  return getOrCreateGuildSettings(guildId)
}

export async function addAgeRule(guildId: string, roleId: string, days: number) {
  await prisma.discordAgeRoleRule.upsert({
    where: { guildId_roleId: { guildId, roleId } },
    create: { guildId, roleId, days },
    update: { days },
  })
}

export async function removeAgeRule(guildId: string, roleId: string) {
  await prisma.discordAgeRoleRule.deleteMany({ where: { guildId, roleId } })
}

export async function resetAgeRules(guildId: string) {
  await prisma.discordAgeRoleRule.deleteMany({ where: { guildId } })
}

export async function addTimedRule(guildId: string, roleId: string, durationMinutes: number) {
  await prisma.discordTimedRoleRule.upsert({
    where: { guildId_roleId: { guildId, roleId } },
    create: { guildId, roleId, durationMinutes },
    update: { durationMinutes },
  })
}

export async function removeTimedRule(guildId: string, roleId: string) {
  await prisma.discordTimedRoleRule.deleteMany({ where: { guildId, roleId } })
}

export async function resetTimedRules(guildId: string) {
  await prisma.discordTimedRoleRule.deleteMany({ where: { guildId } })
}

export async function addConnectedRule(
  guildId: string,
  triggerRoleId: string,
  targetRoleId: string,
  action: ConnectedRoleAction
) {
  await prisma.discordConnectedRoleRule.upsert({
    where: {
      guildId_triggerRoleId_targetRoleId_action: {
        guildId,
        triggerRoleId,
        targetRoleId,
        action,
      },
    },
    create: { guildId, triggerRoleId, targetRoleId, action },
    update: {},
  })
}

export async function removeConnectedRule(guildId: string, ruleId: string) {
  await prisma.discordConnectedRoleRule.deleteMany({ where: { guildId, id: ruleId } })
}

export async function resetConnectedRules(guildId: string) {
  await prisma.discordConnectedRoleRule.deleteMany({ where: { guildId } })
}

export async function clearAllAutoRoles(guildId: string) {
  await prisma.$transaction([
    prisma.discordJoinRole.deleteMany({ where: { guildId } }),
    prisma.discordAgeRoleRule.deleteMany({ where: { guildId } }),
    prisma.discordTimedRoleRule.deleteMany({ where: { guildId } }),
    prisma.discordConnectedRoleRule.deleteMany({ where: { guildId } }),
    prisma.discordTimedRoleGrant.deleteMany({ where: { guildId } }),
  ])
}

export async function listAutoRolesSummary(guildId: string) {
  return getOrCreateGuildSettings(guildId)
}
