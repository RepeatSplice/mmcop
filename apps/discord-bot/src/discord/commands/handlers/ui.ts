import type { ChatInputCommandInteraction, GuildMember } from "discord.js"
import { requireStaff } from "../../../lib/staff.js"
import { closeUiSession, openUiSession } from "../../../features/ui-session/service.js"

export async function handleUiCommand(interaction: ChatInputCommandInteraction) {
  if (!requireStaff(interaction)) {
    await interaction.reply({
      content: "You need **Manage Roles** or the configured staff role to use this command.",
      ephemeral: true,
    })
    return
  }

  const sub = interaction.options.getSubcommand(true)
  const targetUser = interaction.options.getUser("member", true)
  const staff = interaction.member as GuildMember
  const guild = interaction.guild!

  await interaction.deferReply({ ephemeral: true })

  const target = await guild.members.fetch(targetUser.id).catch(() => null)
  if (!target) {
    await interaction.editReply("That user is not in this server.")
    return
  }

  try {
    if (sub === "member") {
      const reason = interaction.options.getString("reason", true).trim()
      if (!reason) {
        await interaction.editReply("A reason is required.")
        return
      }

      const { channel } = await openUiSession({ guild, target, staff, reason })
      await interaction.editReply(
        `Opened UI session for <@${target.id}> in ${channel}. Their previous roles were saved and will be restored when you run \`/ui close\`.`
      )
      return
    }

    if (sub === "close") {
      await closeUiSession({ guild, target, staff })
      await interaction.editReply(
        `Closed UI session for <@${target.id}> and restored their previous roles.`
      )
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UI command failed"
    await interaction.editReply(msg)
  }
}
