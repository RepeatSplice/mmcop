import { Events, type Client } from "discord.js"
import { registerOnce } from "../../lib/register-once.js"
import { config } from "../../config.js"
import { applyConnectedRoleChanges } from "../../features/auto-roles/apply.js"

const MEMBER_UPDATE_KEY = Symbol("guildMemberUpdate")

export function registerGuildMemberUpdateHandler(client: Client) {
  registerOnce(client, Events.GuildMemberUpdate, MEMBER_UPDATE_KEY, async (oldMember, newMember) => {
    if (newMember.guild.id !== config.guildId()) return

    const oldRoles = oldMember.roles.cache
    const newRoles = newMember.roles.cache

    const added = newRoles.filter((r) => !oldRoles.has(r.id)).map((r) => r.id)
    const removed = oldRoles.filter((r) => !newRoles.has(r.id)).map((r) => r.id)

    if (added.length === 0 && removed.length === 0) return

    try {
      await applyConnectedRoleChanges(newMember, added, removed)
    } catch (e) {
      console.error("[events] GuildMemberUpdate connected roles failed", newMember.id, e)
    }
  })
}
