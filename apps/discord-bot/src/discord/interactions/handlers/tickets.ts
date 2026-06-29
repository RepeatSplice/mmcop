import {
  GuildMember,
  type ButtonInteraction,
  type ModalSubmitInteraction,
  type StringSelectMenuInteraction,
} from "discord.js"
import { getTicketPanel } from "../../../features/tickets/config.js"
import { buildTicketModal } from "../../../features/tickets/modal.js"
import { closeTicket, getOpenTicket, openTicket } from "../../../features/tickets/service.js"
import {
  DiscordTicketType,
  TICKET_PREFIX,
  getReasonLabel,
  ticketTypeFromSlug,
} from "../../../features/tickets/types.js"
import { requireStaff } from "../../../lib/staff.js"

export function isTicketInteraction(customId: string): boolean {
  return customId.startsWith(`${TICKET_PREFIX}:`)
}

async function resolveMember(
  interaction: StringSelectMenuInteraction | ModalSubmitInteraction | ButtonInteraction
): Promise<GuildMember | null> {
  const rawMember = interaction.member
  if (!rawMember || Array.isArray(rawMember)) return null
  if (rawMember instanceof GuildMember) return rawMember
  return interaction.guild!.members.fetch(rawMember.user.id).catch(() => null)
}

export async function handleTicketInteraction(
  interaction: StringSelectMenuInteraction | ModalSubmitInteraction | ButtonInteraction
) {
  if (!interaction.inGuild()) return

  if (interaction.isStringSelectMenu()) {
    await handleReasonSelect(interaction)
    return
  }

  if (interaction.isModalSubmit()) {
    await handleModalSubmit(interaction)
    return
  }

  if (interaction.isButton()) {
    await handleCloseButton(interaction)
  }
}

async function handleReasonSelect(interaction: StringSelectMenuInteraction) {
  const parts = interaction.customId.split(":")
  if (parts.length < 3 || parts[1] !== "reason") return

  const typeSlug = parts[2]
  const type = ticketTypeFromSlug(typeSlug)
  if (!type) return

  const panel = await getTicketPanel(interaction.guildId!, type)
  if (!panel?.enabled || panel.channelId !== interaction.channelId) {
    await interaction.reply({
      content: "This ticket panel is no longer active. Ask staff to post a new one.",
      ephemeral: true,
    })
    return
  }

  const member = await resolveMember(interaction)
  if (!member || member.user.bot) return

  const active = await getOpenTicket(interaction.guildId!, member.id)
  if (active) {
    await interaction.reply({
      content: `You already have an open ticket in <#${active.channelId}>.`,
      ephemeral: true,
    })
    return
  }

  const reasonSlug = interaction.values[0]
  if (!reasonSlug) return

  const modal = buildTicketModal(type, reasonSlug)
  await interaction.showModal(modal)
}

async function handleModalSubmit(interaction: ModalSubmitInteraction) {
  const parts = interaction.customId.split(":")
  if (parts.length < 4 || parts[1] !== "submit") return

  const type = ticketTypeFromSlug(parts[2])
  const reasonSlug = parts[3]
  if (!type || !reasonSlug) return

  const member = await resolveMember(interaction)
  if (!member || member.user.bot) return

  const subject = interaction.fields.getTextInputValue("subject").trim()
  const details = interaction.fields.getTextInputValue("details").trim()

  const extra: Record<string, string> = {}
  if (type === DiscordTicketType.CUSTOMER_SUPPORT) {
    const accountName = interaction.fields.getTextInputValue("account_name")?.trim()
    if (accountName) extra.account_name = accountName
  }
  if (type === DiscordTicketType.ORDER) {
    const orderRef = interaction.fields.getTextInputValue("order_ref").trim()
    if (!orderRef) {
      await interaction.reply({
        content: "Order reference or email is required for order tickets.",
        ephemeral: true,
      })
      return
    }
    extra.order_ref = orderRef
  }

  await interaction.deferReply({ ephemeral: true })

  try {
    const { channel } = await openTicket({
      guild: interaction.guild!,
      member,
      type,
      reasonSlug,
      subject,
      details,
      extra,
    })
    const reasonLabel = getReasonLabel(type, reasonSlug)
    await interaction.editReply(
      `Your **${reasonLabel}** ticket has been opened: ${channel}`
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to open ticket."
    await interaction.editReply(message)
  }
}

async function handleCloseButton(interaction: ButtonInteraction) {
  const parts = interaction.customId.split(":")
  if (parts.length < 3 || parts[1] !== "close") return

  if (!requireStaff(interaction)) {
    await interaction.reply({ content: "Only staff can close tickets.", ephemeral: true })
    return
  }

  const ticketId = parts[2]
  if (!ticketId) return

  await interaction.deferReply({ ephemeral: true })

  try {
    await closeTicket({
      guild: interaction.guild!,
      ticketId,
      closedById: interaction.user.id,
    })
    await interaction.editReply("Ticket closed and channel removed.")
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to close ticket."
    await interaction.editReply(message)
  }
}
