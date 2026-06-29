import { PermissionFlagsBits, type Guild, type TextChannel } from "discord.js"
import { prisma } from "../../prisma.js"
import { config } from "../../config.js"
import { applyCaptchaPermissions } from "./permissions.js"
import { buildCaptchaSetupPanel } from "./panel.js"
import {
  assertCaptchaRolesExist,
  grantVerifiedRoles,
  requireCaptchaRoleIds,
} from "./roles.js"

export async function setupCaptcha(input: {
  guild: Guild
  channel: TextChannel
}): Promise<{ unverifiedRoleId: string; verifiedRoleId: string; memberRoleId: string; panelMessageId: string }> {
  const { guild, channel } = input
  const guildId = guild.id
  const roleIds = requireCaptchaRoleIds()

  const me = guild.members.me
  if (!me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new Error("I need **Manage Roles** to set up verification.")
  }
  if (!me.permissions.has(PermissionFlagsBits.ManageChannels)) {
    throw new Error("I need **Manage Channels** to lock down channel permissions.")
  }

  await assertCaptchaRolesExist(guild, roleIds)

  const managed = [roleIds.unverifiedRoleId, roleIds.verifiedRoleId, roleIds.memberRoleId]
    .map((id) => guild.roles.cache.get(id))
    .filter(Boolean)

  for (const role of managed) {
    if (role!.position >= me.roles.highest.position) {
      throw new Error(
        `Drag my bot role **above** ${role!.name} in Server Settings → Roles.`
      )
    }
  }

  const panel = buildCaptchaSetupPanel()
  const message = await channel.send(panel)

  const cfg = await prisma.discordCaptchaConfig.upsert({
    where: { guildId },
    create: {
      guildId,
      channelId: channel.id,
      panelMessageId: message.id,
      unverifiedRoleId: roleIds.unverifiedRoleId,
      verifiedRoleId: roleIds.verifiedRoleId,
      enabled: true,
    },
    update: {
      channelId: channel.id,
      panelMessageId: message.id,
      unverifiedRoleId: roleIds.unverifiedRoleId,
      verifiedRoleId: roleIds.verifiedRoleId,
      enabled: true,
    },
  })

  await applyCaptchaPermissions(guild, cfg)

  // Existing members without unverified: grant verified + member so they're not locked out
  const members = await guild.members.fetch()
  for (const member of members.values()) {
    if (member.user.bot) continue
    const hasVerified = member.roles.cache.has(roleIds.verifiedRoleId)
    const hasUnverified = member.roles.cache.has(roleIds.unverifiedRoleId)
    if (!hasVerified && !hasUnverified) {
      await grantVerifiedRoles(member, roleIds, "Captcha setup: existing member")
    }
  }

  return {
    unverifiedRoleId: roleIds.unverifiedRoleId,
    verifiedRoleId: roleIds.verifiedRoleId,
    memberRoleId: roleIds.memberRoleId,
    panelMessageId: message.id,
  }
}

export async function disableCaptcha(guildId: string) {
  await prisma.discordCaptchaConfig.updateMany({
    where: { guildId },
    data: { enabled: false },
  })
}

export function isCaptchaExempt(
  member: {
    roles: { cache: { has: (id: string) => boolean } }
    permissions: { has: (p: bigint) => boolean }
  },
  cfg: { verifiedRoleId: string; unverifiedRoleId: string }
): boolean {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true
  if (member.roles.cache.has(cfg.verifiedRoleId)) return true
  const memberRoleId = config.captchaMemberRoleId()
  if (memberRoleId && member.roles.cache.has(memberRoleId)) return true
  const staffRoleId = config.staffRoleId()
  if (staffRoleId && member.roles.cache.has(staffRoleId)) return true
  return false
}
