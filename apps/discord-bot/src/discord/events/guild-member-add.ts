import { Events, type Client } from "discord.js"
import { registerOnce } from "../../lib/register-once.js"
import { config } from "../../config.js"
import { getCaptchaConfig } from "../../features/captcha/config.js"
import { assignUnverifiedRole } from "../../features/captcha/verify.js"
import {
  applyJoinRoles,
  applyTimedRolesOnJoin,
  applyAgeRolesForMember,
} from "../../features/auto-roles/apply.js"

const MEMBER_ADD_KEY = Symbol("guildMemberAdd")

export function registerGuildMemberAddHandler(client: Client) {
  registerOnce(client, Events.GuildMemberAdd, MEMBER_ADD_KEY, async (member) => {
    if (member.guild.id !== config.guildId()) return
    if (member.user.bot) return

    try {
      const captcha = await getCaptchaConfig(member.guild.id)
      if (captcha) {
        await assignUnverifiedRole(member)
        return
      }

      await applyJoinRoles(member)
      await applyTimedRolesOnJoin(member)
      await applyAgeRolesForMember(member)
    } catch (e) {
      console.error("[events] GuildMemberAdd onboarding failed", member.id, e)
    }
  })
}
