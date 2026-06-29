import type { Guild, GuildMember } from "discord.js"
import { prisma } from "../../prisma.js"
import { config } from "../../config.js"
import { getOrCreateGuildSettings } from "../../lib/guild-settings.js"

function manageableRoleIds(member: GuildMember, roleIds: string[]): string[] {
  const me = member.guild.members.me
  if (!me) return []
  const myTop = me.roles.highest.position
  return roleIds.filter((id) => {
    const role = member.guild.roles.cache.get(id)
    return role && !role.managed && role.position < myTop
  })
}

export async function applyJoinRoles(member: GuildMember) {
  const settings = await getOrCreateGuildSettings(member.guild.id)
  const roleIds = manageableRoleIds(
    member,
    settings.joinRoles.map((r) => r.roleId)
  )
  if (roleIds.length === 0) return
  await member.roles.add(roleIds, "Auto role: join").catch(() => {})
}

export async function applyTimedRolesOnJoin(member: GuildMember) {
  const settings = await getOrCreateGuildSettings(member.guild.id)
  const rules = settings.timedRoleRules
  if (rules.length === 0) return

  const roleIds = manageableRoleIds(
    member,
    rules.map((r) => r.roleId)
  )
  if (roleIds.length === 0) return

  await member.roles.add(roleIds, "Auto role: timed (join)").catch(() => {})

  const now = Date.now()
  for (const rule of rules) {
    if (!roleIds.includes(rule.roleId)) continue
    const expiresAt = new Date(now + rule.durationMinutes * 60_000)
    await prisma.discordTimedRoleGrant.create({
      data: {
        guildId: member.guild.id,
        memberId: member.id,
        roleId: rule.roleId,
        expiresAt,
      },
    })
  }
}

export async function applyAgeRolesForMember(member: GuildMember) {
  const settings = await getOrCreateGuildSettings(member.guild.id)
  if (settings.ageRoleRules.length === 0) return

  const joinedAt = member.joinedAt
  if (!joinedAt) return

  const daysInServer = Math.floor((Date.now() - joinedAt.getTime()) / 86_400_000)
  const eligible = settings.ageRoleRules
    .filter((r) => daysInServer >= r.days)
    .map((r) => r.roleId)

  const roleIds = manageableRoleIds(member, eligible)
  if (roleIds.length === 0) return
  await member.roles.add(roleIds, "Auto role: age").catch(() => {})
}

export async function applyConnectedRoleChanges(
  member: GuildMember,
  addedRoleIds: string[],
  removedRoleIds: string[]
) {
  const settings = await getOrCreateGuildSettings(member.guild.id)
  if (settings.connectedRules.length === 0) return

  const toAdd = new Set<string>()
  const toRemove = new Set<string>()

  for (const rule of settings.connectedRules) {
    if (rule.action === "ADD_ON_GAIN" && addedRoleIds.includes(rule.triggerRoleId)) {
      toAdd.add(rule.targetRoleId)
    }
    if (rule.action === "REMOVE_ON_LOSS" && removedRoleIds.includes(rule.triggerRoleId)) {
      toRemove.add(rule.targetRoleId)
    }
  }

  const addIds = manageableRoleIds(member, [...toAdd])
  const removeIds = manageableRoleIds(member, [...toRemove])

  if (addIds.length > 0) {
    await member.roles.add(addIds, "Auto role: connected").catch(() => {})
  }
  if (removeIds.length > 0) {
    await member.roles.remove(removeIds, "Auto role: connected").catch(() => {})
  }
}

export async function processExpiredTimedRoles(guild: Guild) {
  if (guild.id !== config.guildId()) return

  const expired = await prisma.discordTimedRoleGrant.findMany({
    where: { guildId: guild.id, expiresAt: { lte: new Date() } },
    take: 100,
  })
  if (expired.length === 0) return

  for (const grant of expired) {
    const member = await guild.members.fetch(grant.memberId).catch(() => null)
    if (member) {
      await member.roles.remove(grant.roleId, "Auto role: timed (expired)").catch(() => {})
    }
    await prisma.discordTimedRoleGrant.delete({ where: { id: grant.id } })
  }
}

export async function scanAgeRoles(guild: Guild) {
  if (guild.id !== config.guildId()) return
  const members = await guild.members.fetch()
  for (const member of members.values()) {
    await applyAgeRolesForMember(member)
  }
}
