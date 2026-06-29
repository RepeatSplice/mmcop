const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const NOISE = ["·", "•", "▪", "░", "│", "╱", "╲"]
const MAX_ATTEMPTS = 3
const TTL_MS = 5 * 60_000

export type PendingCaptcha = {
  code: string
  attempts: number
  expiresAt: number
}

const pending = new Map<string, PendingCaptcha>()

function key(guildId: string, memberId: string) {
  return `${guildId}:${memberId}`
}

export function createChallenge(guildId: string, memberId: string): PendingCaptcha {
  const code = Array.from(
    { length: 6 },
    () => CHARSET[Math.floor(Math.random() * CHARSET.length)]
  ).join("")

  const challenge: PendingCaptcha = {
    code,
    attempts: 0,
    expiresAt: Date.now() + TTL_MS,
  }
  pending.set(key(guildId, memberId), challenge)
  return challenge
}

export function getChallenge(guildId: string, memberId: string): PendingCaptcha | null {
  const row = pending.get(key(guildId, memberId))
  if (!row) return null
  if (Date.now() > row.expiresAt) {
    pending.delete(key(guildId, memberId))
    return null
  }
  return row
}

export function clearChallenge(guildId: string, memberId: string) {
  pending.delete(key(guildId, memberId))
}

export function recordFailedAttempt(guildId: string, memberId: string): PendingCaptcha | null {
  const row = getChallenge(guildId, memberId)
  if (!row) return null
  row.attempts += 1
  if (row.attempts >= MAX_ATTEMPTS) {
    pending.delete(key(guildId, memberId))
    return null
  }
  return row
}

/** Monospace “distorted” captcha display for the embed */
export function renderCaptchaVisual(code: string): string {
  const spaced = code
    .split("")
    .map((ch) => {
      const n = NOISE[Math.floor(Math.random() * NOISE.length)]
      return Math.random() > 0.45 ? `${n}${ch}` : `${ch}${n}`
    })
    .join(" ")

  return [
    "```",
    "┌───────────────────────┐",
    `│  ${spaced.padEnd(21)}│`,
    "└───────────────────────┘",
    "```",
  ].join("\n")
}

export function normalizeAnswer(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "")
}
