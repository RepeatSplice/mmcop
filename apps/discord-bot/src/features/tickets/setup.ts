import { PermissionFlagsBits, type Guild, type TextChannel } from "discord.js"
import { prisma } from "../../prisma.js"
import type { DiscordTicketType } from "./types.js"
import { buildTicketPanel } from "./panel.js"
import { getOrCreateTicketCategory } from "./service.js"

export async function setupTicketPanel(input: {
  guild: Guild
  channel: TextChannel
  type: DiscordTicketType
}): Promise<{ panelMessageId: string; categoryId: string }> {
  const { guild, channel, type } = input
  const guildId = guild.id

  const me = guild.members.me
  if (!me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
    throw new Error("I need **Manage Channels** to set up ticket panels.")
  }

  const categoryId = await getOrCreateTicketCategory(guild)
  const panel = buildTicketPanel(type)
  const message = await channel.send(panel)

  await prisma.discordTicketPanel.upsert({
    where: { guildId_type: { guildId, type } },
    create: {
      guildId,
      type,
      channelId: channel.id,
      messageId: message.id,
      categoryId,
      enabled: true,
    },
    update: {
      channelId: channel.id,
      messageId: message.id,
      categoryId,
      enabled: true,
    },
  })

  return { panelMessageId: message.id, categoryId }
}
