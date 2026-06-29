import type { GuildMember } from "discord.js"
import { prisma } from "../../prisma.js"
import { getCaptchaConfig } from "./config.js"
import {
  clearChallenge,
  createChallenge,
  getChallenge,
  normalizeAnswer,
  recordFailedAttempt,
  renderCaptchaVisual,
} from "./challenge.js"
import {
  applyAgeRolesForMember,
  applyJoinRoles,
  applyTimedRolesOnJoin,
} from "../auto-roles/apply.js"
import { isCaptchaExempt } from "./setup.js"
import { grantVerifiedRoles, requireCaptchaRoleIds } from "./roles.js"

export async function assignUnverifiedRole(member: GuildMember) {
  const cfg = await getCaptchaConfig(member.guild.id)
  if (!cfg) return

  if (isCaptchaExempt(member, cfg)) return
  if (member.roles.cache.has(cfg.unverifiedRoleId)) return

  await member.roles.add(cfg.unverifiedRoleId, "Captcha: awaiting verification").catch(() => {})
}

export function beginVerification(guildId: string, memberId: string) {
  const challenge = createChallenge(guildId, memberId)
  return {
    challenge,
    visual: renderCaptchaVisual(challenge.code),
  }
}

export async function submitVerification(
  member: GuildMember,
  answer: string
): Promise<{ ok: true } | { ok: false; message: string; visual?: string }> {
  const cfg = await getCaptchaConfig(member.guild.id)
  if (!cfg) {
    return { ok: false, message: "Verification is not enabled on this server." }
  }

  if (member.roles.cache.has(cfg.verifiedRoleId)) {
    clearChallenge(member.guild.id, member.id)
    return { ok: false, message: "You're already verified." }
  }

  const pending = getChallenge(member.guild.id, member.id)
  if (!pending) {
    return {
      ok: false,
      message: "Your captcha expired or was not started. Click **Verify I'm Human** again.",
    }
  }

  const normalized = normalizeAnswer(answer)
  if (normalized !== pending.code) {
    const after = recordFailedAttempt(member.guild.id, member.id)
    if (!after) {
      clearChallenge(member.guild.id, member.id)
      return {
        ok: false,
        message: "Too many wrong attempts. Click **Verify I'm Human** to get a new captcha.",
      }
    }
    return {
      ok: false,
      message: `Incorrect code. **${MAX_ATTEMPTS_LEFT(after.attempts)}** attempt(s) left.`,
      visual: renderCaptchaVisual(after.code),
    }
  }

  clearChallenge(member.guild.id, member.id)
  const roleIds = requireCaptchaRoleIds()
  await grantVerifiedRoles(member, roleIds, "Captcha passed")

  // Apply deferred auto-roles now that they're verified
  await applyJoinRoles(member)
  await applyTimedRolesOnJoin(member)
  await applyAgeRolesForMember(member)

  return { ok: true }
}

function MAX_ATTEMPTS_LEFT(attempts: number) {
  return Math.max(0, 3 - attempts)
}

export async function refreshCaptchaPanel(guildId: string, channelId: string) {
  const cfg = await prisma.discordCaptchaConfig.findUnique({ where: { guildId } })
  if (!cfg?.enabled) return null

  const { buildCaptchaSetupPanel } = await import("./panel.js")
  return { cfg, panel: buildCaptchaSetupPanel() }
}
