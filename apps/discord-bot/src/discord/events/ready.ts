import { Events, type Client } from "discord.js"
import { deployCommands } from "../commands/deploy.js"
import { config } from "../../config.js"
import { processExpiredTimedRoles, scanAgeRoles } from "../../features/auto-roles/apply.js"

const ROLE_JOB_MS = 15 * 60_000

export function registerReadyHandler(client: Client) {
  client.once(Events.ClientReady, async (readyClient) => {
    await deployCommands(readyClient)

    const guild = await readyClient.guilds.fetch(config.guildId()).catch(() => null)
    if (guild) {
      await scanAgeRoles(guild).catch((e) => console.warn("[ready] age role scan failed", e))
      await processExpiredTimedRoles(guild).catch((e) =>
        console.warn("[ready] timed role sweep failed", e)
      )
    }

    setInterval(async () => {
      const g = await readyClient.guilds.fetch(config.guildId()).catch(() => null)
      if (!g) return
      await processExpiredTimedRoles(g).catch(() => {})
    }, ROLE_JOB_MS)

    console.log(`[discord-bot] Ready — commands deployed, role jobs scheduled`)
  })
}
