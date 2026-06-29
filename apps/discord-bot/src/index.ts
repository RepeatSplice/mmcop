import { config as loadEnv } from "dotenv"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createDiscordClient } from "./client/create-client.js"
import { startBot } from "./bootstrap/startup.js"

loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") })

const client = createDiscordClient()

startBot(client).catch((e) => {
  console.error(e)
  process.exit(1)
})
