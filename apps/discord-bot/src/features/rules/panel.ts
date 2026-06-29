import type { APIEmbed } from "discord.js"
import { buildServerRulesEmbed } from "../../lib/server-rules.js"

export type RulesPanelPayload = {
  embeds: APIEmbed[]
}

export function buildRulesPanel(): RulesPanelPayload {
  return {
    embeds: [buildServerRulesEmbed()],
  }
}
