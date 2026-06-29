import { Events, type Client } from "discord.js"
import { handleAutorolesCommand } from "../commands/handlers/autoroles.js"
import { handleUiCommand } from "../commands/handlers/ui.js"
import { handleCaptchaCommand } from "../commands/handlers/captcha.js"
import { handleRulesCommand } from "../commands/handlers/rules.js"
import { handleTicketSetupCommand } from "../commands/handlers/tickets.js"
import { handleConnectCommand } from "../commands/handlers/connect.js"
import {
  handleAutorolesInteraction,
  isAutorolesInteraction,
} from "./handlers/autoroles.js"
import {
  handleCaptchaInteraction,
  isCaptchaInteraction,
} from "./handlers/captcha.js"
import {
  handleTicketInteraction,
  isTicketInteraction,
} from "./handlers/tickets.js"
import {
  handleConnectInteraction,
  isConnectInteraction,
} from "./handlers/connect.js"
import { registerOnce } from "../../lib/register-once.js"
import { isDuplicateInteraction } from "../../lib/interaction-dedupe.js"

const ROUTER_KEY = Symbol("interactionRouter")

export function registerInteractionRouter(client: Client) {
  registerOnce(client, Events.InteractionCreate, ROUTER_KEY, async (interaction) => {
    if (isDuplicateInteraction(interaction.id)) return

    try {
      if (interaction.isChatInputCommand()) {
        switch (interaction.commandName) {
          case "autoroles":
            await handleAutorolesCommand(interaction)
            break
          case "ui":
            await handleUiCommand(interaction)
            break
          case "captcha":
            await handleCaptchaCommand(interaction)
            break
          case "rules":
            await handleRulesCommand(interaction)
            break
          case "general-inquiry":
          case "customer-support":
          case "order-ticket":
            await handleTicketSetupCommand(interaction)
            break
          case "connect":
            await handleConnectCommand(interaction)
            break
        }
        return
      }

      if (interaction.isStringSelectMenu() && isConnectInteraction(interaction.customId)) {
        await handleConnectInteraction(interaction)
        return
      }

      if (
        (interaction.isButton() ||
          interaction.isStringSelectMenu() ||
          interaction.isModalSubmit()) &&
        isTicketInteraction(interaction.customId)
      ) {
        await handleTicketInteraction(interaction)
        return
      }

      if (
        (interaction.isButton() || interaction.isModalSubmit()) &&
        isCaptchaInteraction(interaction.customId)
      ) {
        await handleCaptchaInteraction(interaction)
        return
      }

      if (
        (interaction.isButton() ||
          interaction.isRoleSelectMenu() ||
          interaction.isStringSelectMenu() ||
          interaction.isModalSubmit()) &&
        isAutorolesInteraction(interaction.customId)
      ) {
        await handleAutorolesInteraction(interaction)
      }
    } catch (e) {
      console.error("[interactions] handler error", e)
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "Something went wrong.", ephemeral: true }).catch(() => {})
      }
    }
  })
}
