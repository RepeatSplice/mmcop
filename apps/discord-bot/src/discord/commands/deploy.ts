import { REST, Routes, type Client } from "discord.js"
import { config } from "../../config.js"
import { commandDefinitions } from "./definitions.js"

export async function deployCommands(client: Client<true>) {
  const rest = new REST({ version: "10" }).setToken(config.discordToken())
  const body = commandDefinitions.map((cmd) => cmd.toJSON())

  await rest.put(Routes.applicationGuildCommands(client.user.id, config.guildId()), { body })
  console.log(`[commands] Deployed ${body.length} guild slash command(s)`)
}
