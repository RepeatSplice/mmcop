import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  type APIEmbed,
} from "discord.js"
import { monarchEmbed } from "../../lib/embeds.js"
import { CONNECT_PREFIX, CONNECT_SECTIONS, CONNECT_SERVICES_URL } from "./content.js"

export type ConnectPanelPayload = {
  embeds: APIEmbed[]
  components: (
    | ActionRowBuilder<StringSelectMenuBuilder>
    | ActionRowBuilder<ButtonBuilder>
  )[]
}

const INTRO = [
  "**Connect**",
  "",
  "Work with us — long-term partnerships for communities that run like studios. One-off commissions for everything else.",
  "",
  "Monarch works with DayZ server owners the way a studio works with a publisher: on a defined cadence, with named leads, and with enough context about your economy and player base that we do not need re-briefing every season.",
  "",
  "We cover weapons, gear, scripts, GFX, imports, and server branding. One place, one team, one standard from first brief to live on your server.",
  "",
  "Browse **retainer tiers** and **one-off commissions** below. When you are ready, start a conversation via a General Inquiry ticket or the full services page.",
].join("\n")

export function buildConnectPanel(): ConnectPanelPayload {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`${CONNECT_PREFIX}:browse`)
    .setPlaceholder("Browse services")
    .addOptions(
      CONNECT_SECTIONS.map((section) => ({
        label: section.label,
        value: section.value,
        description: section.description.slice(0, 100),
      }))
    )

  return {
    embeds: [monarchEmbed("Connect", INTRO)],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Full services page")
          .setStyle(ButtonStyle.Link)
          .setURL(CONNECT_SERVICES_URL)
      ),
    ],
  }
}
