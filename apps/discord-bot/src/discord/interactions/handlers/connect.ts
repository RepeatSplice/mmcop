import type { StringSelectMenuInteraction } from "discord.js"
import { buildConnectSectionEmbeds, CONNECT_PREFIX } from "../../../features/connect/content.js"

export function isConnectInteraction(customId: string): boolean {
  return customId.startsWith(`${CONNECT_PREFIX}:`)
}

export async function handleConnectInteraction(interaction: StringSelectMenuInteraction) {
  if (!interaction.inGuild()) return
  if (!interaction.isStringSelectMenu() || interaction.customId !== `${CONNECT_PREFIX}:browse`) return

  const section = interaction.values[0]
  if (!section) return

  const embeds = buildConnectSectionEmbeds(section)
  await interaction.reply({ embeds, ephemeral: true })
}
