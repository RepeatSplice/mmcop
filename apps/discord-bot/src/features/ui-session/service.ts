import {
  ChannelType,
  PermissionFlagsBits,
  type Guild,
  type GuildMember,
  type TextChannel,
} from "discord.js"
import { prisma } from "../../prisma.js"
import { config } from "../../config.js"
import { resolveUiRoleId } from "../../lib/guild-settings.js"
import { monarchEmbed } from "../../lib/embeds.js"

async function getOrCreateUiCategory(guild: Guild): Promise<string> {
  const settings = await prisma.discordGuildSettings.upsert({
    where: { guildId: guild.id },
    create: { guildId: guild.id },
    update: {},
  })

  if (settings.uiCategoryId) {
    const existing = await guild.channels.fetch(settings.uiCategoryId).catch(() => null)
    if (existing) return existing.id
  }

  const category = await guild.channels.create({
    name: "User Intervention",
    type: ChannelType.GuildCategory,
    reason: "Monarch UI sessions",
  })

  await prisma.discordGuildSettings.update({
    where: { guildId: guild.id },
    data: { uiCategoryId: category.id },
  })

  return category.id
}

function savedRoleIds(member: GuildMember): string[] {
  return member.roles.cache
    .filter((r) => r.id !== member.guild.id && !r.managed)
    .map((r) => r.id)
}

export async function openUiSession(input: {
  guild: Guild
  target: GuildMember
  staff: GuildMember
  reason: string
}): Promise<{ channel: TextChannel; sessionId: string }> {
  const { guild, target, staff, reason } = input

  const active = await prisma.discordUiSession.findFirst({
    where: { guildId: guild.id, memberId: target.id, closedAt: null },
  })
  if (active) {
    throw new Error(`<@${target.id}> already has an open UI session in <#${active.channelId}>.`)
  }

  const uiRoleId = await resolveUiRoleId(guild.id)
  if (!uiRoleId) {
    throw new Error("UI role is not configured. Set `DISCORD_UI_ROLE_ID` in the bot `.env`.")
  }

  const uiRole = guild.roles.cache.get(uiRoleId)
  if (!uiRole) throw new Error(`UI role \`${uiRoleId}\` was not found in this server.`)

  const categoryId = await getOrCreateUiCategory(guild)
  const staffRoleId = config.staffRoleId()

  const overwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: target.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: staff.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles,
      ],
    },
  ]

  if (staffRoleId) {
    overwrites.push({
      id: staffRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles,
      ],
    })
  }

  const slug = target.user.username.replace(/[^a-z0-9-]/gi, "-").slice(0, 20) || target.id.slice(-6)
  const channel = await guild.channels.create({
    name: `ui-${slug}`,
    type: ChannelType.GuildText,
    parent: categoryId,
    topic: `User intervention — ${target.user.tag}`,
    permissionOverwrites: overwrites,
    reason: `UI session opened by ${staff.user.tag}: ${reason}`,
  })

  const previousRoles = savedRoleIds(target)
  await target.roles.set([uiRoleId], "UI session opened")

  const session = await prisma.discordUiSession.create({
    data: {
      guildId: guild.id,
      memberId: target.id,
      channelId: channel.id,
      reason,
      savedRoleIds: previousRoles,
      openedById: staff.id,
    },
  })

  const textChannel = channel as TextChannel
  await textChannel.send({
    embeds: [
      monarchEmbed(
        "User Intervention",
        [
          `**Member:** <@${target.id}> (${target.user.tag})`,
          `**Opened by:** <@${staff.id}>`,
          `**Reason:** ${reason}`,
          "",
          "This is a private 1:1 channel between the member and staff.",
          "All other roles have been temporarily removed and the **UI** role applied.",
          "",
          "Staff: use `/ui close member:@user` when the session is complete to restore roles and remove this channel.",
        ].join("\n")
      ),
    ],
  })

  return { channel: textChannel, sessionId: session.id }
}

export async function closeUiSession(input: {
  guild: Guild
  target: GuildMember
  staff: GuildMember
}): Promise<void> {
  const { guild, target, staff } = input

  const session = await prisma.discordUiSession.findFirst({
    where: { guildId: guild.id, memberId: target.id, closedAt: null },
    orderBy: { createdAt: "desc" },
  })
  if (!session) {
    throw new Error(`<@${target.id}> has no open UI session.`)
  }

  const uiRoleId = await resolveUiRoleId(guild.id)
  const restoreIds = session.savedRoleIds.filter((id) => guild.roles.cache.has(id))

  await target.roles.set(restoreIds, `UI session closed by ${staff.user.tag}`)

  const channel = await guild.channels.fetch(session.channelId).catch(() => null)
  if (channel) {
    await channel.delete(`UI session closed by ${staff.user.tag}`)
  }

  await prisma.discordUiSession.update({
    where: { id: session.id },
    data: { closedAt: new Date() },
  })

  if (uiRoleId && target.roles.cache.has(uiRoleId) && !restoreIds.includes(uiRoleId)) {
    await target.roles.remove(uiRoleId, "UI session cleanup").catch(() => {})
  }
}
