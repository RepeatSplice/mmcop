import type { ChatInputCommandInteraction } from "discord.js"
import { requireStaff } from "../../../lib/staff.js"
import { getOrCreateGuildSettings } from "../../../lib/guild-settings.js"
import { buildAutorolesPanel } from "../../../features/auto-roles/panel.js"

export async function handleAutorolesCommand(interaction: ChatInputCommandInteraction) {
  if (!requireStaff(interaction)) {
    await interaction.reply({
      content: "You need **Manage Roles** or the configured staff role to use this command.",
      ephemeral: true,
    })
    return
  }

  const settings = await getOrCreateGuildSettings(interaction.guildId!)
  const panel = buildAutorolesPanel(settings)
  await interaction.reply(panel)
}
