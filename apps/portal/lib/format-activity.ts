import { ticketStatusLabel } from "@/lib/ticket-display"

export type ActivityDisplay = {
  headline: string
  detail?: string
  ticketKey?: string
}

const FIELD_LABELS: Record<string, string> = {
  status: "Status",
  type: "Type",
  assigneeId: "Assignee",
  dueDate: "Due date",
  title: "Title",
  sprintId: "Sprint",
  parentId: "Parent",
  discipline: "Discipline",
  position: "Order",
  description: "Description",
}

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (field === "status" && typeof value === "string") return ticketStatusLabel(value)
  if (field === "type" && typeof value === "string") {
    return value === "EPIC" ? "Epic" : "Ticket"
  }
  if (field === "assigneeId") {
    return value ? "Assigned" : "Unassigned"
  }
  if (field === "dueDate" && typeof value === "string") {
    try {
      return new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    } catch {
      return String(value)
    }
  }
  if (typeof value === "string") return value
  return String(value)
}

function formatChanges(changes: Record<string, { from: unknown; to: unknown }>): string {
  return Object.entries(changes)
    .map(([field, { from, to }]) => {
      const label = FIELD_LABELS[field] ?? field
      return `${label}: ${formatValue(field, from)} → ${formatValue(field, to)}`
    })
    .join(" · ")
}

export function formatActivityEvent(event: {
  type: string
  body: string
  ticket?: { key: string; title?: string | null } | null
}): ActivityDisplay {
  const key = event.ticket?.key
  const trimmed = event.body.trim()

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as {
        ticketKey?: string
        changes?: Record<string, { from: unknown; to: unknown }>
      }
      const ticketKey = parsed.ticketKey ?? key
      if (parsed.changes && Object.keys(parsed.changes).length > 0) {
        return {
          ticketKey,
          headline: ticketKey ? `${ticketKey} updated` : "Ticket updated",
          detail: formatChanges(parsed.changes),
        }
      }
    } catch {
      // fall through
    }
  }

  if (event.type === "ticket.created" || event.type.startsWith("ticket.")) {
    const match = trimmed.match(/^([A-Z]+-\d+):\s*(.+)$/i)
    if (match) {
      return { ticketKey: match[1], headline: match[2], detail: "Created" }
    }
  }

  if (key && !trimmed.toLowerCase().startsWith(key.toLowerCase())) {
    return { ticketKey: key, headline: trimmed, detail: event.type.replace(/\./g, " ") }
  }

  const jobMatch = trimmed.match(/^([A-Z]+-\d+):\s*(.+)$/i)
  if (jobMatch) {
    return { ticketKey: jobMatch[1], headline: jobMatch[2] }
  }

  return { ticketKey: key, headline: trimmed }
}
