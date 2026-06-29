import type { Client } from "discord.js"
import { registerEventHandlers } from "../discord/events/index.js"
import { registerInteractionRouter } from "../discord/interactions/router.js"
import { createHttpServer } from "../http/server.js"
import { config } from "../config.js"

export async function startBot(client: Client) {
  registerEventHandlers(client)
  registerInteractionRouter(client)

  const app = createHttpServer(client)
  const port = config.httpPort()

  app.listen(port, () => {
    console.log(`[discord-bot] HTTP listening on :${port}`)
  })

  await client.login(config.discordToken())
  console.log(`[discord-bot] Logged in as ${client.user?.tag}`)
}
