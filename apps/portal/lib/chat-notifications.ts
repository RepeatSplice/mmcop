import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/resend"

function parseMentionedUserIds(
  body: string,
  members: Array<{
    userId: string
    user: { email: string | null; name: string | null }
  }>
): Set<string> {
  const mentioned = new Set<string>()
  const tokens = body.match(/@([a-zA-Z0-9._-]{2,32})/g)
  if (!tokens) return mentioned

  for (const token of tokens) {
    const needle = token.slice(1).toLowerCase()
    for (const m of members) {
      const emailLocal = m.user.email?.split("@")[0]?.toLowerCase()
      const name = m.user.name?.toLowerCase()
      const nameParts = name?.split(/\s+/) ?? []
      if (
        emailLocal === needle ||
        name === needle ||
        nameParts.some((p) => p === needle) ||
        name?.replace(/\s+/g, "") === needle
      ) {
        mentioned.add(m.userId)
      }
    }
  }
  return mentioned
}

export async function notifyChatMessage(input: {
  workspaceId: string
  workspaceSlug: string
  workspaceName: string
  body: string
  authorUserId: string | null
  authorDisplayName: string
}) {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: input.workspaceId },
    select: {
      userId: true,
      user: {
        select: { email: true, name: true, notifyChatMode: true },
      },
    },
  })

  if (members.length === 0) return

  const mentioned = parseMentionedUserIds(input.body, members)
  const preview = input.body.trim().slice(0, 240) || "Sent an attachment"
  const chatUrl = `/workspace/${input.workspaceSlug}/chat`

  const rows = members
    .filter((m) => m.userId !== input.authorUserId)
    .map((m) => {
      const isMention = mentioned.has(m.userId)
      // Default = mentions only. Users on "ALL" still get every message.
      const mode = m.user.notifyChatMode ?? "MENTIONS"
      const shouldNotify = isMention || mode === "ALL"
      return {
        userId: m.userId,
        workspaceId: input.workspaceId,
        type: isMention ? "chat.mention" : "chat.message",
        title: isMention
          ? `${input.authorDisplayName} mentioned you in ${input.workspaceName}`
          : `New message in ${input.workspaceName}`,
        body: preview,
        url: chatUrl,
        _email: isMention ? m.user.email : null,
        _keep: shouldNotify,
      }
    })
    .filter((r) => r._keep)

  if (rows.length === 0) return

  await prisma.notification.createMany({
    data: rows.map(({ _email: _e, _keep: _k, ...r }) => r),
  })

  for (const row of rows) {
    if (!row._email) continue
    void sendEmail({
      to: row._email,
      subject: row.title,
      text: `${row.body}\n\nOpen chat: ${process.env.AUTH_URL ?? "http://localhost:4000"}${chatUrl}`,
    }).catch((e) => console.warn("[chat] mention email failed", e))
  }
}
