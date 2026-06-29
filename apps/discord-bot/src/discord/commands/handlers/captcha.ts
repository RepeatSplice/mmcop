import type { ChatInputCommandInteraction, TextChannel } from "discord.js"
import { requireStaff } from "../../../lib/staff.js"
import { setupCaptcha, disableCaptcha } from "../../../features/captcha/setup.js"
import { applyCaptchaPermissions } from "../../../features/captcha/permissions.js"
import { getCaptchaConfig } from "../../../features/captcha/config.js"
import { prisma } from "../../../prisma.js"
import { buildCaptchaSetupPanel } from "../../../features/captcha/panel.js"

export async function handleCaptchaCommand(interaction: ChatInputCommandInteraction) {
  if (!requireStaff(interaction)) {
    await interaction.reply({
      content: "You need **Manage Roles** or the configured staff role.",
      ephemeral: true,
    })
    return
  }

  const sub = interaction.options.getSubcommand(true)

  if (sub === "setup") {
    const channel = interaction.channel
    if (!channel?.isTextBased() || channel.isDMBased()) {
      await interaction.reply({ content: "Run this command in the verification text channel.", ephemeral: true })
      return
    }

    await interaction.deferReply({ ephemeral: true })

    try {
      const result = await setupCaptcha({
        guild: interaction.guild!,
        channel: channel as TextChannel,
      })

      await interaction.editReply(
        [
          "Verification captcha is live in this channel.",
          "",
          `• Unverified: <@&${result.unverifiedRoleId}>`,
          `• Verified: <@&${result.verifiedRoleId}>`,
          `• Member (on pass): <@&${result.memberRoleId}>`,
          "",
          "New members will only see this channel until they pass the captcha. Existing members were granted **Verified** + **Member**.",
        ].join("\n")
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Setup failed"
      await interaction.editReply(msg)
    }
    return
  }

  if (sub === "refresh") {
    const cfg = await getCaptchaConfig(interaction.guildId!)
    if (!cfg) {
      await interaction.reply({ content: "Captcha is not set up. Run `/captcha setup` first.", ephemeral: true })
      return
    }

    const channel = await interaction.guild!.channels.fetch(cfg.channelId)
    if (!channel?.isTextBased()) {
      await interaction.reply({ content: "Verification channel not found.", ephemeral: true })
      return
    }

    const panel = buildCaptchaSetupPanel()
    const msg = await (channel as TextChannel).send(panel)
    await prisma.discordCaptchaConfig.update({
      where: { guildId: interaction.guildId! },
      data: { panelMessageId: msg.id },
    })

    await interaction.reply({ content: `Posted a fresh verification panel in ${channel}.`, ephemeral: true })
    return
  }

  if (sub === "resync") {
    const cfg = await getCaptchaConfig(interaction.guildId!)
    if (!cfg) {
      await interaction.reply({ content: "Captcha is not set up.", ephemeral: true })
      return
    }

    await interaction.deferReply({ ephemeral: true })
    await applyCaptchaPermissions(interaction.guild!, cfg)
    await interaction.editReply("Channel permissions re-synced for captcha roles.")
    return
  }

  if (sub === "disable") {
    await disableCaptcha(interaction.guildId!)
    await interaction.reply({
      content: "Captcha disabled. Existing role locks are unchanged — run `/captcha resync` after re-enabling or adjust roles manually.",
      ephemeral: true,
    })
  }
}
