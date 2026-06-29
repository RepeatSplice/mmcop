import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/resend"
import { ticketStatusLabel } from "@/lib/ticket-display"

/**
 * Match @mention tokens to workspace members. The same logic as
 * chat-notifications -- handles email locals, full names, and stripped names.
 */
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

function ticketUrl(workspaceSlug: string, ticketKey: string): string {
  return `/workspace/${workspaceSlug}/tickets/${ticketKey}`
}

function absoluteUrl(path: string): string {
  return `${process.env.AUTH_URL ?? "http://localhost:4000"}${path}`
}

export async function notifyTicketAssigned(input: {
  workspaceId: string
  workspaceSlug: string
  workspaceName: string
  ticketId: string
  ticketKey: string
  ticketTitle: string
  newAssigneeId: string
  actorUserId: string | null
  actorName: string | null
}) {
  if (input.newAssigneeId === input.actorUserId) return
  const assignee = await prisma.user.findUnique({
    where: { id: input.newAssigneeId },
    select: { email: true, name: true },
  })
  if (!assignee) return
  const url = ticketUrl(input.workspaceSlug, input.ticketKey)
  const actor = input.actorName || "Someone"
  await prisma.notification.create({
    data: {
      userId: input.newAssigneeId,
      workspaceId: input.workspaceId,
      type: "ticket.assigned",
      title: `${actor} assigned you to ${input.ticketKey}`,
      body: input.ticketTitle,
      url,
    },
  })
  if (assignee.email) {
    void sendEmail({
      to: assignee.email,
      subject: `${input.ticketKey}: assigned to you`,
      text: `${actor} assigned you to ${input.ticketKey} in ${input.workspaceName}.\n\n${input.ticketTitle}\n\nOpen: ${absoluteUrl(url)}`,
    }).catch((e) => console.warn("[notify] assignee email failed", e))
  }
}

export async function notifyTicketStatusChanged(input: {
  workspaceId: string
  workspaceSlug: string
  workspaceName: string
  ticketId: string
  ticketKey: string
  ticketTitle: string
  fromStatus: string
  toStatus: string
  assigneeId: string | null
  createdById: string | null
  actorUserId: string | null
  actorName: string | null
}) {
  const recipientIds = new Set<string>()
  if (input.assigneeId && input.assigneeId !== input.actorUserId)
    recipientIds.add(input.assigneeId)
  if (input.createdById && input.createdById !== input.actorUserId)
    recipientIds.add(input.createdById)
  if (recipientIds.size === 0) return

  const url = ticketUrl(input.workspaceSlug, input.ticketKey)
  const actor = input.actorName || "Someone"
  const fromLabel = ticketStatusLabel(input.fromStatus)
  const toLabel = ticketStatusLabel(input.toStatus)
  const title = `${input.ticketKey}: ${fromLabel} → ${toLabel}`
  const body = `${actor} moved ${input.ticketKey} to ${toLabel}`

  await prisma.notification.createMany({
    data: Array.from(recipientIds).map((userId) => ({
      userId,
      workspaceId: input.workspaceId,
      type: "ticket.status",
      title,
      body,
      url,
    })),
  })
}

export async function notifyTicketComment(input: {
  workspaceId: string
  workspaceSlug: string
  workspaceName: string
  ticketId: string
  ticketKey: string
  ticketTitle: string
  body: string
  assigneeId: string | null
  createdById: string | null
  actorUserId: string | null
  actorName: string | null
}) {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: input.workspaceId },
    select: { userId: true, user: { select: { email: true, name: true } } },
  })
  const mentioned = parseMentionedUserIds(input.body, members)

  const subscriberIds = new Set<string>()
  if (input.assigneeId && input.assigneeId !== input.actorUserId)
    subscriberIds.add(input.assigneeId)
  if (input.createdById && input.createdById !== input.actorUserId)
    subscriberIds.add(input.createdById)

  // Mentions get a dedicated row + email; do not double-notify as "comment"
  const mentionedFiltered = new Set<string>()
  for (const u of mentioned) {
    if (u !== input.actorUserId) mentionedFiltered.add(u)
    subscriberIds.delete(u)
  }

  const url = ticketUrl(input.workspaceSlug, input.ticketKey)
  const actor = input.actorName || "Someone"
  const preview = input.body.trim().slice(0, 240) || ""

  const rows: { userId: string; type: string; title: string; body: string }[] = []
  for (const uid of mentionedFiltered) {
    rows.push({
      userId: uid,
      type: "ticket.mention",
      title: `${actor} mentioned you in ${input.ticketKey}`,
      body: preview,
    })
  }
  for (const uid of subscriberIds) {
    rows.push({
      userId: uid,
      type: "ticket.comment",
      title: `${actor} commented on ${input.ticketKey}`,
      body: preview,
    })
  }

  if (rows.length === 0) return

  await prisma.notification.createMany({
    data: rows.map((r) => ({
      userId: r.userId,
      workspaceId: input.workspaceId,
      type: r.type,
      title: r.title,
      body: r.body,
      url,
    })),
  })

  // Email mentions only (don't spam every commenter).
  for (const uid of mentionedFiltered) {
    const member = members.find((m) => m.userId === uid)
    const email = member?.user.email
    if (!email) continue
    void sendEmail({
      to: email,
      subject: `${actor} mentioned you in ${input.ticketKey}`,
      text: `${preview}\n\nOpen: ${absoluteUrl(url)}`,
    }).catch((e) => console.warn("[notify] mention email failed", e))
  }
}
