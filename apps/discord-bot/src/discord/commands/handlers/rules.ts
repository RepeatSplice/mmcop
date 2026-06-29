import type { ChatInputCommandInteraction, TextChannel } from "discord.js"
import { requireStaff } from "../../../lib/staff.js"
import { buildRulesPanel } from "../../../features/rules/panel.js"
import { buildServerRulesEmbed } from "../../../lib/server-rules.js"

export async function handleRulesCommand(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand()

  if (sub === "view") {
    await interaction.reply({
      embeds: [buildServerRulesEmbed()],
      ephemeral: true,
    })
    return
  }

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

  if (sub === "post" || sub === "refresh") {
    await interaction.deferReply({ ephemeral: true })

    const panel = buildRulesPanel()
    const message = await (channel as TextChannel).send(panel)

    const note =
      sub === "post"
        ? `Posted **Monarch Modding — Server Rules** in ${channel} (${message.url}).`
        : `Posted a fresh rules panel in ${channel}.`

    await interaction.editReply(note)
  }
}
