import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  type Guild,
  type GuildMember,
  type TextChannel,
} from "discord.js"
import { prisma } from "../../prisma.js"
import { config } from "../../config.js"
import { monarchEmbed } from "../../lib/embeds.js"
import {
  getReasonLabel,
  getTicketTypeConfig,
  TICKET_PREFIX,
  type DiscordTicketType,
} from "./types.js"

const TICKET_CATEGORY_NAME = "Support Tickets"

export async function getOrCreateTicketCategory(guild: Guild): Promise<string> {
  const existing = await prisma.discordTicketPanel.findFirst({
    where: { guildId: guild.id, categoryId: { not: null } },
    select: { categoryId: true },
  })

  if (existing?.categoryId) {
    const channel = await guild.channels.fetch(existing.categoryId).catch(() => null)
    if (channel) return channel.id
  }

  const category = await guild.channels.create({
    name: TICKET_CATEGORY_NAME,
    type: ChannelType.GuildCategory,
    reason: "Monarch support tickets",
  })

  await prisma.discordTicketPanel.updateMany({
    where: { guildId: guild.id },
    data: { categoryId: category.id },
  })

  return category.id
}

function channelSlug(member: GuildMember, prefix: string): string {
  const base = member.user.username.replace(/[^a-z0-9-]/gi, "-").toLowerCase().slice(0, 20)
  return `${prefix}-${base || member.id.slice(-6)}`
}

async function uniqueChannelName(guild: Guild, prefix: string, member: GuildMember): Promise<string> {
  let name = channelSlug(member, prefix)
  let suffix = 1
  while (guild.channels.cache.some((c) => c.name === name)) {
    name = `${channelSlug(member, prefix)}-${suffix}`
    suffix += 1
  }
  return name
}

export async function getOpenTicket(guildId: string, memberId: string) {
  return prisma.discordTicket.findFirst({
    where: { guildId, memberId, closedAt: null },
    orderBy: { createdAt: "desc" },
  })
}

export async function openTicket(input: {
  guild: Guild
  member: GuildMember
  type: DiscordTicketType
  reasonSlug: string
  subject: string
  details: string
  extra?: Record<string, string>
}): Promise<{ channel: TextChannel; ticketId: string }> {
  const { guild, member, type, reasonSlug, subject, details, extra } = input

  const active = await getOpenTicket(guild.id, member.id)
  if (active) {
    throw new Error(
      `You already have an open ticket in <#${active.channelId}>. Please use that channel or ask staff to close it before opening another.`
    )
  }

  const categoryId = await getOrCreateTicketCategory(guild)
  const typeCfg = getTicketTypeConfig(type)
  const reasonLabel = getReasonLabel(type, reasonSlug)
  const staffRoleId = config.staffRoleId()

  const overwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: member.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: guild.members.me!.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
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

  const channelName = await uniqueChannelName(guild, typeCfg.channelPrefix, member)
  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: categoryId,
    topic: `${typeCfg.titleSuffix} — ${member.user.tag}`,
    permissionOverwrites: overwrites,
    reason: `Support ticket opened by ${member.user.tag}: ${reasonLabel}`,
  })

  const ticket = await prisma.discordTicket.create({
    data: {
      guildId: guild.id,
      memberId: member.id,
      channelId: channel.id,
      type,
      reason: reasonLabel,
      subject,
      details,
      extra: extra && Object.keys(extra).length > 0 ? JSON.stringify(extra) : null,
    },
  })

  const textChannel = channel as TextChannel
  const extraLines: string[] = []
  if (extra?.account_name) {
    extraLines.push(`**Account / in-game name:** ${extra.account_name}`)
  }
  if (extra?.order_ref) {
    extraLines.push(`**Order reference or email:** ${extra.order_ref}`)
  }

  const staffPing = staffRoleId ? `<@&${staffRoleId}>` : null
  await textChannel.send({
    content: staffPing ?? undefined,
    embeds: [
      monarchEmbed(
        typeCfg.titleSuffix,
        [
          `**Opened by:** <@${member.id}> (${member.user.tag})`,
          `**Reason:** ${reasonLabel}`,
          `**Subject:** ${subject}`,
          ...extraLines,
          "",
          `**Details:**`,
          details,
        ].join("\n")
      ),
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`${TICKET_PREFIX}:close:${ticket.id}`)
          .setLabel("Close ticket")
          .setStyle(ButtonStyle.Danger)
      ),
    ],
  })

  return { channel: textChannel, ticketId: ticket.id }
}

export async function closeTicket(input: {
  guild: Guild
  ticketId: string
  closedById: string
}): Promise<void> {
  const { guild, ticketId, closedById } = input

  const ticket = await prisma.discordTicket.findUnique({ where: { id: ticketId } })
  if (!ticket || ticket.guildId !== guild.id) {
    throw new Error("Ticket not found.")
  }
  if (ticket.closedAt) {
    throw new Error("This ticket is already closed.")
  }

  const channel = await guild.channels.fetch(ticket.channelId).catch(() => null)
  if (channel) {
    await channel.delete("Support ticket closed")
  }

  await prisma.discordTicket.update({
    where: { id: ticket.id },
    data: { closedAt: new Date(), closedById },
  })
}
