import type { APIEmbed } from "discord.js"
import { monarchEmbed } from "./embeds.js"

function ruleBlock(
  num: string,
  title: string,
  action: string,
  body: string
): string {
  return `**${num} — ${title}** · ${action}\n${body}`
}

const SERVER_RULES_BODY = [
  ruleBlock(
    "01",
    "No hate, harassment, or discrimination",
    "Instant ban",
    "Racism, sexism, homophobia, and all forms of targeted harassment are not tolerated. This applies to all channels, voice, and in-game."
  ),
  ruleBlock(
    "02",
    "No doxxing",
    "Instant ban",
    "Sharing or threatening to share anyone's personal information — name, address, accounts, or otherwise — will result in an immediate permanent ban."
  ),
  ruleBlock(
    "03",
    "No trash talking",
    "Moderated",
    "Keep competition respectful. Targeted insults directed at other players or communities will be actioned by staff."
  ),
  ruleBlock(
    "04",
    "No server advertising",
    "Moderated",
    "Promoting other servers or communities is not permitted without prior written approval from staff. This includes Discord invites and external links."
  ),
  ruleBlock(
    "05",
    "All purchases are final",
    "Policy",
    "We do not offer refunds or accept chargebacks. By completing a purchase you agree that the transaction is final. If you have an issue, contact staff before raising a dispute."
  ),
  ruleBlock(
    "06",
    "Do not ping the dev team",
    "Moderated",
    "Direct @mentions of developers are reserved for staff escalation only. Use the appropriate support channels for questions and bug reports."
  ),
  ruleBlock(
    "07",
    "No unsolicited Discord links",
    "Moderated",
    "Posting Discord invite links without staff approval is not allowed. This falls under the advertising rule and will be treated the same way."
  ),
  ruleBlock(
    "08",
    "No resale or modification of our content",
    "Policy",
    "Anything purchased or received from Monarch is licensed for your personal use only. You may not resell, redistribute, or modify our work without explicit written permission."
  ),
  ruleBlock(
    "09",
    "We do not offer open source access",
    "Policy",
    "Our source code, configs, and tooling are proprietary. Requests for open source access will not be granted."
  ),
].join("\n\n")

/** Single full-width embed — matches verification panel layout */
export function buildServerRulesEmbed(): APIEmbed {
  return monarchEmbed(
    "Server Rules",
    [
      "By remaining in this server you agree to the following rules and policies.",
      "",
      SERVER_RULES_BODY,
    ].join("\n")
  )
}
