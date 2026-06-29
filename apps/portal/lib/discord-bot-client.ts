/**
 * HTTP client for the standalone discord-bot service (apps/discord-bot).
 */

const BOT_URL = process.env.DISCORD_BOT_URL ?? "http://localhost:4100"
const BOT_SECRET = process.env.DISCORD_BOT_INTERNAL_SECRET ?? ""

async function botFetch(path: string, body: unknown) {
  if (!BOT_SECRET) {
    console.warn("[discord-bot] DISCORD_BOT_INTERNAL_SECRET not set; skipping", path)
    return { ok: false as const, error: "Bot not configured" }
  }

  try {
    const res = await fetch(`${BOT_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BOT_SECRET}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false as const, error: text || res.statusText }
    }
    return { ok: true as const, data: await res.json().catch(() => ({})) }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bot unreachable"
    return { ok: false as const, error: msg }
  }
}

export async function provisionWorkspaceDiscord(input: {
  workspaceId: string
  name: string
  slug: string
  ownerUserId: string
}) {
  return botFetch("/provision", input)
}

export async function syncDiscordMember(input: {
  workspaceId: string
  userId: string
  action: "add" | "remove"
}) {
  return botFetch("/sync-member", input)
}

export async function sendDiscordChatMessage(input: {
  workspaceId: string
  body: string
  authorDisplayName: string
  attachmentPaths?: string[]
}) {
  return botFetch("/send-message", input)
}

export async function postDiscordAnnouncement(input: {
  workspaceId: string
  title: string
  body: string
}) {
  return botFetch("/announce", input)
}

export async function postDiscordLog(input: {
  workspaceId: string
  body: string
}) {
  return botFetch("/log", input)
}

export async function repairWorkspaceDiscordPermissions(workspaceId: string) {
  return botFetch("/repair-permissions", { workspaceId })
}

export async function deprovisionWorkspaceDiscord(input: {
  guildId: string
  categoryId: string
  channelIds: string[]
}) {
  return botFetch("/deprovision", input)
}
