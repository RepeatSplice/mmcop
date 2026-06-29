import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js"
import { DiscordTicketType, getTicketTypeConfig, TICKET_PREFIX } from "./types.js"

export function buildTicketModal(type: DiscordTicketType, reasonSlug: string): ModalBuilder {
  const cfg = getTicketTypeConfig(type)
  const reasonLabel = cfg.reasons.find((r) => r.slug === reasonSlug)?.label ?? reasonSlug

  const modal = new ModalBuilder()
    .setCustomId(`${TICKET_PREFIX}:submit:${cfg.slug}:${reasonSlug}`)
    .setTitle(`${cfg.titleSuffix} — ${reasonLabel}`)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("subject")
          .setLabel("Subject")
          .setStyle(TextInputStyle.Short)
          .setMinLength(3)
          .setMaxLength(100)
          .setRequired(true)
          .setPlaceholder("Short summary of your inquiry")
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("details")
          .setLabel("Details")
          .setStyle(TextInputStyle.Paragraph)
          .setMinLength(10)
          .setMaxLength(1000)
          .setRequired(true)
          .setPlaceholder("Describe your inquiry in detail")
      )
    )

  if (type === DiscordTicketType.CUSTOMER_SUPPORT) {
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("account_name")
          .setLabel("Account / in-game name")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(64)
          .setRequired(false)
          .setPlaceholder("Optional")
      )
    )
  }

  if (type === DiscordTicketType.ORDER) {
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("order_ref")
          .setLabel("Order reference or email")
          .setStyle(TextInputStyle.Short)
          .setMinLength(3)
          .setMaxLength(128)
          .setRequired(true)
          .setPlaceholder("Order ID or email used at checkout")
      )
    )
  }

  return modal
}
