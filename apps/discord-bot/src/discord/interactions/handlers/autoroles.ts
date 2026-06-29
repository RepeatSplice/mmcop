import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type ModalSubmitInteraction,
  type RoleSelectMenuInteraction,
  type StringSelectMenuInteraction,
} from "discord.js"
import { requireStaff } from "../../../lib/staff.js"
import { getOrCreateGuildSettings } from "../../../lib/guild-settings.js"
import {
  addAgeRule,
  addConnectedRule,
  addTimedRule,
  clearAllAutoRoles,
  listAutoRolesSummary,
  removeAgeRule,
  removeConnectedRule,
  removeTimedRule,
  resetAgeRules,
  resetConnectedRules,
  resetTimedRules,
  setJoinRoles,
} from "../../../features/auto-roles/service.js"
import { buildAutorolesPanel, formatAutorolesList } from "../../../features/auto-roles/panel.js"

const PREFIX = "autoroles"

export async function handleAutorolesInteraction(
  interaction:
    | ButtonInteraction
    | RoleSelectMenuInteraction
    | StringSelectMenuInteraction
    | ModalSubmitInteraction
) {
  if (!interaction.inGuild() || !requireStaff(interaction)) {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "Staff only.", ephemeral: true }).catch(() => {})
    }
    return
  }

  const guildId = interaction.guildId!

  if (interaction.isRoleSelectMenu()) {
    await handleRoleSelect(interaction, guildId)
    return
  }

  if (interaction.isModalSubmit()) {
    await handleModal(interaction, guildId)
    return
  }

  if (interaction.isStringSelectMenu()) {
    await handleStringSelect(interaction, guildId)
    return
  }

  if (interaction.isButton()) {
    await handleButton(interaction, guildId)
  }
}

async function refreshPanel(interaction: ButtonInteraction | RoleSelectMenuInteraction, guildId: string) {
  const settings = await getOrCreateGuildSettings(guildId)
  const panel = buildAutorolesPanel(settings)
  if (interaction.message.editable) {
    await interaction.message.edit({
      embeds: panel.embeds,
      components: panel.components,
    })
  }
}

async function handleRoleSelect(interaction: RoleSelectMenuInteraction, guildId: string) {
  const id = interaction.customId

  if (id === `${PREFIX}:join:select`) {
    await setJoinRoles(
      guildId,
      interaction.roles.map((r) => r.id)
    )
    await interaction.reply({ content: "Join roles updated.", ephemeral: true })
    await refreshPanel(interaction, guildId)
    return
  }

  if (id === `${PREFIX}:age:role`) {
    const roleId = interaction.roles.first()?.id
    if (!roleId) {
      await interaction.reply({ content: "Pick a role.", ephemeral: true })
      return
    }
    const modal = new ModalBuilder()
      .setCustomId(`${PREFIX}:age:modal:${roleId}`)
      .setTitle("Age role — days in server")
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("days")
            .setLabel("Days in server before assigning")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder("e.g. 7")
        )
      )
    await interaction.showModal(modal)
    return
  }

  if (id === `${PREFIX}:timed:role`) {
    const roleId = interaction.roles.first()?.id
    if (!roleId) {
      await interaction.reply({ content: "Pick a role.", ephemeral: true })
      return
    }
    const modal = new ModalBuilder()
      .setCustomId(`${PREFIX}:timed:modal:${roleId}`)
      .setTitle("Timed role — duration")
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("minutes")
            .setLabel("Minutes before auto-removal")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder("e.g. 60")
        )
      )
    await interaction.showModal(modal)
    return
  }

  if (id === `${PREFIX}:connected:trigger`) {
    const triggerId = interaction.roles.first()?.id
    if (!triggerId) {
      await interaction.reply({ content: "Pick a trigger role.", ephemeral: true })
      return
    }
    const row = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId(`${PREFIX}:connected:target:${triggerId}`)
        .setPlaceholder("Select target role")
        .setMinValues(1)
        .setMaxValues(1)
    )
    await interaction.reply({
      content: "Select the **target** role for this connected rule.",
      components: [row],
      ephemeral: true,
    })
    return
  }

  if (id.startsWith(`${PREFIX}:connected:target:`)) {
    const triggerId = id.split(":").pop()!
    const targetId = interaction.roles.first()?.id
    if (!targetId) {
      await interaction.reply({ content: "Pick a target role.", ephemeral: true })
      return
    }
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${PREFIX}:connected:save:${triggerId}:${targetId}:gain`)
        .setLabel("Add target on gain")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`${PREFIX}:connected:save:${triggerId}:${targetId}:loss`)
        .setLabel("Remove target on loss")
        .setStyle(ButtonStyle.Danger)
    )
    await interaction.update({
      content: `Trigger <@&${triggerId}> → target <@&${targetId}>. Choose the rule action:`,
      components: [row],
    })
    return
  }

  if (id === `${PREFIX}:age:remove:pick`) {
    const roleId = interaction.roles.first()?.id
    if (!roleId) return
    await removeAgeRule(guildId, roleId)
    await interaction.reply({ content: `Removed age rule for <@&${roleId}>.`, ephemeral: true })
    return
  }

  if (id === `${PREFIX}:timed:remove:pick`) {
    const roleId = interaction.roles.first()?.id
    if (!roleId) return
    await removeTimedRule(guildId, roleId)
    await interaction.reply({ content: `Removed timed rule for <@&${roleId}>.`, ephemeral: true })
    return
  }
}

async function handleModal(interaction: ModalSubmitInteraction, guildId: string) {
  const id = interaction.customId

  if (id.startsWith(`${PREFIX}:age:modal:`)) {
    const roleId = id.slice(`${PREFIX}:age:modal:`.length)
    const days = Number.parseInt(interaction.fields.getTextInputValue("days"), 10)
    if (!Number.isFinite(days) || days < 1) {
      await interaction.reply({ content: "Enter a valid number of days (1+).", ephemeral: true })
      return
    }
    await addAgeRule(guildId, roleId, days)
    await interaction.reply({
      content: `Age rule saved: <@&${roleId}> after **${days}** day(s).`,
      ephemeral: true,
    })
    return
  }

  if (id.startsWith(`${PREFIX}:timed:modal:`)) {
    const roleId = id.slice(`${PREFIX}:timed:modal:`.length)
    const minutes = Number.parseInt(interaction.fields.getTextInputValue("minutes"), 10)
    if (!Number.isFinite(minutes) || minutes < 1) {
      await interaction.reply({ content: "Enter valid minutes (1+).", ephemeral: true })
      return
    }
    await addTimedRule(guildId, roleId, minutes)
    await interaction.reply({
      content: `Timed rule saved: <@&${roleId}> for **${minutes}** minute(s) on join.`,
      ephemeral: true,
    })
  }
}

async function handleStringSelect(interaction: StringSelectMenuInteraction, guildId: string) {
  if (interaction.customId === `${PREFIX}:connected:remove:pick`) {
    const ruleId = interaction.values[0]
    await removeConnectedRule(guildId, ruleId)
    await interaction.reply({ content: "Connected rule removed.", ephemeral: true })
  }
}

async function handleButton(interaction: ButtonInteraction, guildId: string) {
  const id = interaction.customId

  if (id === `${PREFIX}:list`) {
    const settings = await listAutoRolesSummary(guildId)
    await interaction.reply({ content: formatAutorolesList(settings), ephemeral: true })
    return
  }

  if (id === `${PREFIX}:clear`) {
    await clearAllAutoRoles(guildId)
    await interaction.reply({ content: "All auto-role rules cleared.", ephemeral: true })
    await refreshPanel(interaction, guildId)
    return
  }

  if (id.startsWith(`${PREFIX}:connected:save:`)) {
    const parts = id.split(":")
    const triggerId = parts[3]
    const targetId = parts[4]
    const mode = parts[5]
    await addConnectedRule(
      guildId,
      triggerId,
      targetId,
      mode === "gain" ? "ADD_ON_GAIN" : "REMOVE_ON_LOSS"
    )
    await interaction.update({
      content: "Connected rule saved.",
      components: [],
    })
    return
  }

  const [kind, action] = id.replace(`${PREFIX}:`, "").split(":") as [string, string]
  if (!["connected", "age", "timed"].includes(kind)) return

  if (action === "reset") {
    if (kind === "connected") await resetConnectedRules(guildId)
    if (kind === "age") await resetAgeRules(guildId)
    if (kind === "timed") await resetTimedRules(guildId)
    await interaction.reply({ content: `${kind} rules reset.`, ephemeral: true })
    return
  }

  if (action === "add") {
    const customId =
      kind === "connected"
        ? `${PREFIX}:connected:trigger`
        : `${PREFIX}:${kind}:role`
    const row = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(`Select role for ${kind} rule`)
        .setMinValues(1)
        .setMaxValues(1)
    )
    await interaction.reply({
      content: `Choose a role to add to **${kind}** rules.`,
      components: [row],
      ephemeral: true,
    })
    return
  }

  if (action === "remove") {
    const settings = await getOrCreateGuildSettings(guildId)

    if (kind === "connected") {
      if (settings.connectedRules.length === 0) {
        await interaction.reply({ content: "No connected rules to remove.", ephemeral: true })
        return
      }
      const menu = new StringSelectMenuBuilder()
        .setCustomId(`${PREFIX}:connected:remove:pick`)
        .setPlaceholder("Select rule to remove")
        .addOptions(
          settings.connectedRules.slice(0, 25).map((r) => ({
            label: `${r.action === "ADD_ON_GAIN" ? "Gain" : "Loss"}: ${r.triggerRoleId.slice(-6)}`,
            description: `Target ${r.targetRoleId}`,
            value: r.id,
          }))
        )
      await interaction.reply({
        content: "Select a connected rule to remove.",
        components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)],
        ephemeral: true,
      })
      return
    }

    const customId = `${PREFIX}:${kind}:remove:pick`
    const row = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(`Select ${kind} role to remove`)
        .setMinValues(1)
        .setMaxValues(1)
    )
    await interaction.reply({
      content: `Choose a **${kind}** role to remove.`,
      components: [row],
      ephemeral: true,
    })
  }
}

export function isAutorolesInteraction(customId: string): boolean {
  return customId.startsWith(`${PREFIX}:`)
}
