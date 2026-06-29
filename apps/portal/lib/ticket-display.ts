import type { TicketStatus } from "@prisma/client"

const STATUS_LABELS: Record<TicketStatus, string> = {
  BACKLOG: "Backlog",
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  REVIEW: "Review",
  DONE: "Done",
  CANCELLED: "Cancelled",
  REQUESTED: "Requested",
  QUOTED: "Quoted",
  AWAITING_PAYMENT: "Awaiting payment",
  ACTIVE: "Active",
  AWAITING_CLIENT: "Needs your input",
}

const BOARD_STATUSES: TicketStatus[] = ["BACKLOG", "PLANNED", "IN_PROGRESS", "REVIEW", "DONE"]

/** Default statuses shown on the sprint board when columns are seeded. */
export const SPRINT_BOARD_COLUMNS: TicketStatus[] = [
  "PLANNED",
  "IN_PROGRESS",
  "REVIEW",
  "AWAITING_CLIENT",
  "DONE",
  "CANCELLED",
]
const PAYG_STATUSES: TicketStatus[] = ["REQUESTED", "QUOTED", "AWAITING_PAYMENT", "ACTIVE"]

export function ticketStatusLabel(status: string): string {
  return STATUS_LABELS[status as TicketStatus] ?? status.replace(/_/g, " ").toLowerCase()
}

export function boardColumnLabel(status: string): string {
  if (status === "PLANNED") return "To do"
  return ticketStatusLabel(status)
}

export function isBoardStatus(status: string): boolean {
  return BOARD_STATUSES.includes(status as TicketStatus)
}

export function isPaygStatus(status: string): boolean {
  return PAYG_STATUSES.includes(status as TicketStatus)
}

export const OPEN_BOARD_STATUSES: TicketStatus[] = ["BACKLOG", "PLANNED", "IN_PROGRESS", "REVIEW"]
export const OPEN_PAYG_STATUSES: TicketStatus[] = [
  "REQUESTED",
  "QUOTED",
  "AWAITING_PAYMENT",
  "ACTIVE",
  "REVIEW",
  "IN_PROGRESS",
  "PLANNED",
]

export const PIPELINE_STATUSES: TicketStatus[] = [
  "BACKLOG",
  "PLANNED",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
  "REQUESTED",
  "QUOTED",
  "AWAITING_PAYMENT",
  "ACTIVE",
  "AWAITING_CLIENT",
]

export const NEEDS_YOU_STATUSES: TicketStatus[] = ["AWAITING_CLIENT", "AWAITING_PAYMENT"]
