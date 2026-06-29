import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  RoleSelectMenuBuilder,
  type InteractionReplyOptions,
} from "discord.js"
import { panelSection } from "../../lib/embeds.js"
import type { getOrCreateGuildSettings } from "../../lib/guild-settings.js"

type GuildSettings = Awaited<ReturnType<typeof getOrCreateGuildSettings>>

const PREFIX = "autoroles"

export function buildAutorolesPanel(settings: GuildSettings): InteractionReplyOptions {
  const joinIds = settings.joinRoles.map((r) => r.roleId)

  const embeds = [
    panelSection(
      "Join Roles",
      "Roles automatically assigned when a user joins."
    ),
    panelSection(
      "Tag Role",
      settings.tagRoleId
        ? `Current tag role: <@&${settings.tagRoleId}>`
        : "Enable **Server Tags** in Server Settings to use this feature."
    ),
    panelSection(
      "Connected Roles",
      "Automatically add or remove a target role when members gain or lose eligible roles."
    ),
    panelSection(
      "Age Roles",
      "Roles assigned based on how long users have been in the server."
    ),
    panelSection(
      "Timed Roles",
      "Roles assigned on join and automatically removed after a duration."
    ),
  ]

  const joinSelect = new RoleSelectMenuBuilder()
    .setCustomId(`${PREFIX}:join:select`)
    .setPlaceholder("Select join roles (max 7)")
    .setMinValues(0)
    .setMaxValues(7)
  if (joinIds.length > 0) joinSelect.setDefaultRoles(joinIds)

  const row = (kind: "connected" | "age" | "timed") =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${PREFIX}:${kind}:add`)
        .setLabel("Add")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`${PREFIX}:${kind}:remove`)
        .setLabel("Remove")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`${PREFIX}:${kind}:reset`)
        .setLabel("Reset")
        .setStyle(ButtonStyle.Secondary)
    )

  const footer = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${PREFIX}:clear`)
      .setLabel("Clear All")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`${PREFIX}:list`)
      .setLabel("List")
      .setStyle(ButtonStyle.Primary)
  )

  return {
    embeds,
    components: [
      new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(joinSelect),
      row("connected"),
      row("age"),
      row("timed"),
      footer,
    ],
  }
}

export function formatAutorolesList(settings: GuildSettings): string {
  const lines: string[] = ["**Auto Role Configuration**", ""]

  lines.push(
    `**Join roles** (${settings.joinRoles.length})`,
    settings.joinRoles.length
      ? settings.joinRoles.map((r) => `• <@&${r.roleId}>`).join("\n")
      : "_None configured_",
    "",
    `**Age roles** (${settings.ageRoleRules.length})`,
    settings.ageRoleRules.length
      ? settings.ageRoleRules.map((r) => `• <@&${r.roleId}> — after **${r.days}** day(s)`).join("\n")
      : "_None configured_",
    "",
    `**Timed roles** (${settings.timedRoleRules.length})`,
    settings.timedRoleRules.length
      ? settings.timedRoleRules
          .map((r) => `• <@&${r.roleId}> — **${r.durationMinutes}** minute(s) on join`)
          .join("\n")
      : "_None configured_",
    "",
    `**Connected rules** (${settings.connectedRules.length})`,
    settings.connectedRules.length
      ? settings.connectedRules
          .map((r) => {
            const action =
              r.action === "ADD_ON_GAIN"
                ? "add on gain"
                : "remove on loss"
            return `• When <@&${r.triggerRoleId}> → ${action} <@&${r.targetRoleId}>`
          })
          .join("\n")
      : "_None configured_"
  )

  return lines.join("\n").slice(0, 4000)
}
