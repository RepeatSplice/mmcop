import type { ChatInputCommandInteraction, TextChannel } from "discord.js"
import { requireStaff } from "../../../lib/staff.js"
import { buildConnectPanel } from "../../../features/connect/panel.js"

export async function handleConnectCommand(interaction: ChatInputCommandInteraction) {
  if (!requireStaff(interaction)) {
    await interaction.reply({
      content: "You need **Manage Roles** or the configured staff role.",
      ephemeral: true,
    })
    return
  }

  const channel = interaction.channel
  if (!channel?.isTextBased() || channel.isDMBased()) {
    await interaction.reply({ content: "Run this command in a text channel.", ephemeral: true })
    return
  }

  await interaction.deferReply({ ephemeral: true })

  const panel = buildConnectPanel()
  const message = await (channel as TextChannel).send(panel)

  await interaction.editReply(
    `Posted **Monarch Modding — Connect** services panel in ${channel} (${message.url}).`
  )
}
