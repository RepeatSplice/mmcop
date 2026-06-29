import type { Client } from "discord.js"
import { registerGatewayHandlers } from "../gateway.js"
import { registerGuildMemberAddHandler } from "./guild-member-add.js"
import { registerGuildMemberUpdateHandler } from "./guild-member-update.js"
import { registerReadyHandler } from "./ready.js"

export function registerEventHandlers(client: Client) {
  registerReadyHandler(client)
  registerGatewayHandlers(client)
  registerGuildMemberAddHandler(client)
  registerGuildMemberUpdateHandler(client)
}
