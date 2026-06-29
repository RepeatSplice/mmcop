import { mapChatAttachments, type chatMessageSelect } from "@/lib/chat-attachments"
import type { Prisma } from "@prisma/client"

export type ChatMessageRecord = Prisma.WorkspaceChatMessageGetPayload<{
  select: typeof chatMessageSelect
}>

export function serializeChatMessage(m: ChatMessageRecord) {
  return {
    id: m.id,
    body: m.body,
    authorUserId: m.authorUserId,
    authorDiscordId: m.authorDiscordId,
    authorDisplayName: m.authorDisplayName,
    source: m.source as "PORTAL" | "DISCORD",
    createdAt: m.createdAt.toISOString(),
    attachments: mapChatAttachments(m.attachments),
  }
}
