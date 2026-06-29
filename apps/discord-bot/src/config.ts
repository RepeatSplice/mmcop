import { resolve } from "node:path"

function required(name: string): string {
  const v = process.env[name]
  if (!v?.trim()) throw new Error(`Missing env: ${name}`)
  return v.trim()
}

function optional(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback
}

export const config = {
  discordToken: () => required("DISCORD_BOT_TOKEN"),
  guildId: () => required("DISCORD_GUILD_ID"),
  /** Optional guild role ID — staff with this role can view all workspace channels. */
  staffRoleId: () => process.env.DISCORD_STAFF_ROLE_ID?.trim() || null,
  /** Role applied during `/ui member` sessions (stripped on close). */
  uiRoleId: () => process.env.DISCORD_UI_ROLE_ID?.trim() || null,
  /** Monarch™︱Unverified — assigned on join until captcha passed. */
  captchaUnverifiedRoleId: () => process.env.DISCORD_CAPTCHA_UNVERIFIED_ROLE_ID?.trim() || null,
  /** Monarch™︱Verified — granted when captcha passed. */
  captchaVerifiedRoleId: () => process.env.DISCORD_CAPTCHA_VERIFIED_ROLE_ID?.trim() || null,
  /** Member role — also granted when captcha passed. */
  captchaMemberRoleId: () => process.env.DISCORD_CAPTCHA_MEMBER_ROLE_ID?.trim() || null,
  databaseUrl: () => required("DATABASE_URL"),
  portalPublicUrl: () => optional("PORTAL_PUBLIC_URL", "http://localhost:4000"),
  portalInternalUrl: () => optional("PORTAL_INTERNAL_URL", "http://localhost:4000"),
  portalUploadsRoot: () =>
    optional("PORTAL_UPLOADS_ROOT", resolve(process.cwd(), "../portal")),
  internalSecret: () => required("DISCORD_BOT_INTERNAL_SECRET"),
  httpPort: () => Number(optional("BOT_HTTP_PORT", "4100")),
}
