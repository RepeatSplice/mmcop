import { EmbedBuilder, type APIEmbed } from "discord.js"

/** Monarch embed accent — white sidebar on all bot embeds */
export const PANEL_COLOR = 0xffffff

const TITLE_PREFIX = "Monarch Modding"

/** Standard full-width panel embed — same layout as Server Verification */
export function monarchEmbed(titleSuffix: string, description: string): APIEmbed {
  const title = titleSuffix.startsWith(TITLE_PREFIX)
    ? titleSuffix
    : `${TITLE_PREFIX} — ${titleSuffix}`
  return new EmbedBuilder()
    .setColor(PANEL_COLOR)
    .setTitle(title)
    .setDescription(description)
    .toJSON()
}

export function panelSection(title: string, description: string): APIEmbed {
  return monarchEmbed(title, description)
}

export function panelHeader(title: string, description?: string): APIEmbed {
  return monarchEmbed(title, description ?? "")
}

/** @deprecated Prefer monarchEmbed for consistent panel width and title format */
export function infoEmbed(title: string, description: string, color = PANEL_COLOR): APIEmbed {
  return new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).toJSON()
}
