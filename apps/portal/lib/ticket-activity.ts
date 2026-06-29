import { ticketStatusLabel } from "@/lib/ticket-display"

export type TicketActivityItem = {
  id: string
  kind: "comment" | "history"
  createdAt: string
  authorName?: string | null
  text: string
  eventType?: string
}

export type TicketCommentRow = {
  id: string
  authorName: string
  body: string
  createdAt: string
}

export type TicketActivityEventRow = {
  id: string
  type: string
  body: string
  createdAt: string
  actorName?: string | null
}

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  status: "Status",
  discipline: "Discipline",
  type: "Type",
  parentId: "Epic",
  subtaskOfId: "Parent ticket",
  sprintId: "Sprint",
  assigneeId: "Assignee",
  dueDate: "Due date",
  position: "Order",
  hoursEst: "Estimate (hours)",
  hoursActual: "Logged (hours)",
}

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "None"
  if (field === "status" && typeof value === "string") return ticketStatusLabel(value)
  if (field === "dueDate" && typeof value === "string") {
    try {
      return new Date(value).toLocaleDateString()
    } catch {
      return value
    }
  }
  if ((field === "hoursEst" || field === "hoursActual") && typeof value === "number") {
    return String(value)
  }
  if (typeof value === "string" && value.length > 80) return `${value.slice(0, 77)}…`
  return String(value)
}

function formatChangeLine(field: string, from: unknown, to: unknown): string {
  const label = FIELD_LABELS[field] ?? field
  return `${label} changed from ${formatValue(field, from)} to ${formatValue(field, to)}`
}

export function formatTicketActivityEvent(event: {
  type: string
  body: string
  actorName?: string | null
}): string {
  if (event.type === "ticket.comment") return "Added a comment"
  if (event.type === "ticket.created") return event.body || "Ticket created"
  if (event.type === "ticket.updated") {
    try {
      const parsed = JSON.parse(event.body) as {
        ticketKey?: string
        changes?: Record<string, { from: unknown; to: unknown }>
      }
      const changes = parsed.changes
      if (!changes || Object.keys(changes).length === 0) return "Updated ticket"
      return Object.entries(changes)
        .map(([k, v]) => formatChangeLine(k, v.from, v.to))
        .join(" · ")
    } catch {
      return event.body || "Updated ticket"
    }
  }
  return event.body || event.type
}

export function mergeTicketActivity(
  comments: TicketCommentRow[],
  events: TicketActivityEventRow[]
): TicketActivityItem[] {
  const commentItems: TicketActivityItem[] = comments.map((c) => ({
    id: `comment-${c.id}`,
    kind: "comment",
    createdAt: c.createdAt,
    authorName: c.authorName,
    text: c.body,
  }))

  const historyItems: TicketActivityItem[] = events
    .filter((e) => e.type !== "ticket.comment")
    .map((e) => ({
      id: `event-${e.id}`,
      kind: "history",
      createdAt: e.createdAt,
      authorName: e.actorName,
      text: formatTicketActivityEvent(e),
      eventType: e.type,
    }))

  const merged = [...commentItems, ...historyItems].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const seen = new Set<string>()
  return merged.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}
