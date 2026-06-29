import { PermissionFlagsBits, type Guild, type GuildChannel, type OverwriteResolvable } from "discord.js"
import { config } from "../config.js"
import { prisma } from "../prisma.js"
import { resolveDiscordUserId } from "./discord-user.js"
import { applyMemberPermissions } from "./member-permissions.js"
import {
  type WorkspaceDiscordChannels,
  workspaceChannelIds,
} from "./workspace-discord-channels.js"

export type { WorkspaceDiscordChannels } from "./workspace-discord-channels.js"

/** Hide workspace category/channels from the whole server; staff role + portal members get explicit allows. */
export function privateVisibilityOverwrites(guild: Guild): OverwriteResolvable[] {
  const overwrites: OverwriteResolvable[] = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
  ]

  const staffRoleId = config.staffRoleId()
  if (staffRoleId) {
    overwrites.push({
      id: staffRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.SendMessages,
      ],
    })
  }

  const botId = guild.members.me?.id
  if (botId) {
    overwrites.push({
      id: botId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
      ],
    })
  }

  return overwrites
}

async function applyPrivateOverwritesToChannel(channel: GuildChannel, guild: Guild) {
  await channel.permissionOverwrites.edit(guild.roles.everyone.id, {
    ViewChannel: false,
  })

  const staffRoleId = config.staffRoleId()
  if (staffRoleId) {
    await channel.permissionOverwrites.edit(staffRoleId, {
      ViewChannel: true,
      ReadMessageHistory: true,
      SendMessages: true,
    })
  }

  const botId = guild.members.me?.id
  if (botId) {
    await channel.permissionOverwrites.edit(botId, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      EmbedLinks: true,
      AttachFiles: true,
    })
  }
}

export async function lockWorkspaceVisibility(guild: Guild, discord: WorkspaceDiscordChannels) {
  for (const channelId of workspaceChannelIds(discord)) {
    const ch = await guild.channels.fetch(channelId)
    if (!ch || !("permissionOverwrites" in ch)) continue
    await applyPrivateOverwritesToChannel(ch as GuildChannel, guild)
  }
}

export async function resyncAllWorkspaceMembers(
  guild: Guild,
  workspaceId: string,
  discord: WorkspaceDiscordChannels
) {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { userId: true },
  })

  for (const { userId } of members) {
    const discordUserId = await resolveDiscordUserId(userId)
    if (discordUserId) {
      await applyMemberPermissions(guild, discord, discordUserId, "add")
    }
  }
}

export async function repairWorkspacePermissions(guild: Guild, workspaceId: string) {
  const row = await prisma.workspaceDiscord.findUnique({ where: { workspaceId } })
  if (!row?.provisionedAt) {
    throw new Error("Discord not provisioned")
  }

  const discord: WorkspaceDiscordChannels = {
    categoryId: row.categoryId,
    chatChannelId: row.chatChannelId,
    announcementsChannelId: row.announcementsChannelId,
    logsChannelId: row.logsChannelId,
    infoChannelId: row.infoChannelId,
  }

  await lockWorkspaceVisibility(guild, discord)
  await resyncAllWorkspaceMembers(guild, workspaceId, discord)
}
