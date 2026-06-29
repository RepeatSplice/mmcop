import { config } from "./config.js"

export type InboundAttachment = {
  fileName: string
  mimeType: string
  contentBase64: string
  discordAttachmentId?: string
}

/** Notify portal of an inbound Discord chat message (persists + SSE). */
export async function notifyPortalInboundMessage(payload: {
  workspaceId: string
  discordMessageId: string
  body: string
  authorDiscordId: string
  authorDisplayName: string
  attachments?: InboundAttachment[]
}) {
  const res = await fetch(`${config.portalInternalUrl()}/api/internal/discord/inbound-message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.internalSecret()}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Portal inbound failed: ${res.status} ${text}`)
  }
  return res.json()
}
