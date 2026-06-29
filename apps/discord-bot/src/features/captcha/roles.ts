import { type Guild } from "discord.js"
import { config } from "../../config.js"

export type CaptchaRoleIds = {
  unverifiedRoleId: string
  verifiedRoleId: string
  memberRoleId: string
}

export function resolveCaptchaRoleIds(): CaptchaRoleIds | null {
  const unverifiedRoleId = config.captchaUnverifiedRoleId()
  const verifiedRoleId = config.captchaVerifiedRoleId()
  const memberRoleId = config.captchaMemberRoleId()
  if (!unverifiedRoleId || !verifiedRoleId || !memberRoleId) return null
  return { unverifiedRoleId, verifiedRoleId, memberRoleId }
}

export function requireCaptchaRoleIds(): CaptchaRoleIds {
  const ids = resolveCaptchaRoleIds()
  if (!ids) {
    throw new Error(
      "Set `DISCORD_CAPTCHA_UNVERIFIED_ROLE_ID`, `DISCORD_CAPTCHA_VERIFIED_ROLE_ID`, and `DISCORD_CAPTCHA_MEMBER_ROLE_ID` in the bot `.env`."
    )
  }
  return ids
}

export async function assertCaptchaRolesExist(guild: Guild, ids: CaptchaRoleIds) {
  await guild.roles.fetch()
  for (const [label, roleId] of [
    ["Unverified", ids.unverifiedRoleId],
    ["Verified", ids.verifiedRoleId],
    ["Member", ids.memberRoleId],
  ] as const) {
    if (!guild.roles.cache.has(roleId)) {
      throw new Error(`Captcha ${label} role \`${roleId}\` was not found in this server.`)
    }
  }
}

export async function grantVerifiedRoles(
  member: import("discord.js").GuildMember,
  ids: CaptchaRoleIds,
  reason: string
) {
  await member.roles.remove(ids.unverifiedRoleId, reason).catch(() => {})
  await member.roles.add([ids.verifiedRoleId, ids.memberRoleId], reason).catch(() => {})
}
