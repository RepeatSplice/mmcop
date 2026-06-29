import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type ModalSubmitInteraction,
} from "discord.js"
import { CAPTCHA_PREFIX, buildCaptchaChallengePanel } from "../../../features/captcha/panel.js"
import { getCaptchaConfig } from "../../../features/captcha/config.js"
import { beginVerification, submitVerification } from "../../../features/captcha/verify.js"
import { monarchEmbed } from "../../../lib/embeds.js"

export function isCaptchaInteraction(customId: string): boolean {
  return customId.startsWith(`${CAPTCHA_PREFIX}:`)
}

export async function handleCaptchaInteraction(
  interaction: ButtonInteraction | ModalSubmitInteraction
) {
  if (!interaction.inGuild()) return

  const cfg = await getCaptchaConfig(interaction.guildId!)
  if (!cfg) {
    await interaction.reply({
      content: "Verification is not active on this server.",
      ephemeral: true,
    })
    return
  }

  if (interaction.isButton() && interaction.customId === `${CAPTCHA_PREFIX}:start`) {
    if (interaction.channelId !== cfg.channelId) {
      await interaction.reply({
        content: `Please verify in <#${cfg.channelId}>.`,
        ephemeral: true,
      })
      return
    }

    const rawMember = interaction.member
    if (!rawMember || Array.isArray(rawMember)) return
    const member =
      rawMember instanceof GuildMember
        ? rawMember
        : await interaction.guild!.members.fetch(rawMember.user.id)
    if (member.user.bot) return

    if (member.roles.cache.has(cfg.verifiedRoleId)) {
      await interaction.reply({ content: "You're already verified.", ephemeral: true })
      return
    }

    const { visual } = beginVerification(interaction.guildId!, member.id)

    await interaction.reply({
      ...buildCaptchaChallengePanel(visual),
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`${CAPTCHA_PREFIX}:open`)
            .setLabel("Enter code")
            .setStyle(ButtonStyle.Primary)
        ),
      ],
      ephemeral: true,
    })
    return
  }

  if (interaction.isButton() && interaction.customId === `${CAPTCHA_PREFIX}:open`) {
    const modal = new ModalBuilder()
      .setCustomId(`${CAPTCHA_PREFIX}:submit`)
      .setTitle("Enter captcha code")
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("code")
            .setLabel("Letters and numbers only")
            .setStyle(TextInputStyle.Short)
            .setMinLength(4)
            .setMaxLength(12)
            .setRequired(true)
            .setPlaceholder("e.g. A7K9M2")
        )
      )
    await interaction.showModal(modal)
    return
  }

  if (interaction.isModalSubmit() && interaction.customId === `${CAPTCHA_PREFIX}:submit`) {
    const rawMember = interaction.member
    if (!rawMember || Array.isArray(rawMember)) return
    const member =
      rawMember instanceof GuildMember
        ? rawMember
        : await interaction.guild!.members.fetch(rawMember.user.id)

    const code = interaction.fields.getTextInputValue("code")
    const result = await submitVerification(member, code)

    if (result.ok) {
      await interaction.reply({
        embeds: [
          monarchEmbed(
            "Verified",
            [
              "You're verified and have full access to the Monarch Modding server.",
              "",
              "Monarch ships weapon packs, configs, workshop releases, and software that links DayZ communities to the web — built for real server rulesets, not stock assets and copy-pasted setups.",
              "",
              "Welcome. Pick the right channel for modding, live gameplay, tooling, or infrastructure — same team and standards behind all of it.",
            ].join("\n")
          ),
        ],
        ephemeral: true,
      })
      return
    }

    const embed = monarchEmbed("Verification failed", result.message)
    if (result.visual) {
      await interaction.reply({
        embeds: [embed],
        content: result.visual,
        ephemeral: true,
      })
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true })
    }
  }
}
