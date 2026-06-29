import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  type APIEmbed,
} from "discord.js"
import { monarchEmbed } from "../../lib/embeds.js"
import { getTicketTypeConfig, TICKET_PREFIX, type DiscordTicketType } from "./types.js"

export type TicketPanelPayload = {
  embeds: APIEmbed[]
  components: ActionRowBuilder<StringSelectMenuBuilder>[]
}

export function buildTicketPanel(type: DiscordTicketType): TicketPanelPayload {
  const cfg = getTicketTypeConfig(type)

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`${TICKET_PREFIX}:reason:${cfg.slug}`)
    .setPlaceholder("Select a reason")
    .addOptions(
      cfg.reasons.map((reason) => ({
        label: reason.label,
        value: reason.slug,
      }))
    )

  return {
    embeds: [monarchEmbed(cfg.titleSuffix, cfg.intro)],
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)],
  }
}
