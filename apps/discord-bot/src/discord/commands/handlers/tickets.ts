import type { ChatInputCommandInteraction, TextChannel } from "discord.js"
import { requireStaff } from "../../../lib/staff.js"
import { setupTicketPanel } from "../../../features/tickets/setup.js"
import { ticketTypeFromCommand, getTicketTypeConfig } from "../../../features/tickets/types.js"

export async function handleTicketSetupCommand(interaction: ChatInputCommandInteraction) {
  if (!requireStaff(interaction)) {
    await interaction.reply({
      content: "You need **Manage Roles** or the configured staff role.",
      ephemeral: true,
    })
    return
  }

  const type = ticketTypeFromCommand(interaction.commandName)
  if (!type) return

  const channel = interaction.channel
  if (!channel?.isTextBased() || channel.isDMBased()) {
    await interaction.reply({ content: "Run this command in a text channel.", ephemeral: true })
    return
  }

  await interaction.deferReply({ ephemeral: true })

  try {
    const { panelMessageId } = await setupTicketPanel({
      guild: interaction.guild!,
      channel: channel as TextChannel,
      type,
    })
    const cfg = getTicketTypeConfig(type)
    await interaction.editReply(
      `Posted **Monarch Modding — ${cfg.titleSuffix}** panel in ${channel} (message \`${panelMessageId}\`).`
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to set up ticket panel."
    await interaction.editReply(message)
  }
}
