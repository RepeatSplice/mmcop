import type { TicketStatus } from "@prisma/client"

export type BoardColumnColor =
  | "slate"
  | "blue"
  | "amber"
  | "orange"
  | "green"
  | "red"
  | "violet"
  | "neutral"

export type BoardColumnDto = {
  id: string
  label: string
  status: TicketStatus
  position: number
  color: BoardColumnColor
  isSystem: boolean
}

export const BOARD_COLUMN_COLORS: BoardColumnColor[] = [
  "slate",
  "blue",
  "amber",
  "orange",
  "green",
  "red",
  "violet",
  "neutral",
]

/** Default sprint-board columns (seeded per workspace). */
export const DEFAULT_BOARD_COLUMNS: Array<{
  id: string
  label: string
  status: TicketStatus
  position: number
  color: BoardColumnColor
  isSystem: true
}> = [
  { id: "PLANNED", label: "To do", status: "PLANNED", position: 0, color: "slate", isSystem: true },
  {
    id: "IN_PROGRESS",
    label: "In progress",
    status: "IN_PROGRESS",
    position: 10,
    color: "blue",
    isSystem: true,
  },
  { id: "REVIEW", label: "Review", status: "REVIEW", position: 20, color: "amber", isSystem: true },
  {
    id: "AWAITING_CLIENT",
    label: "Needs client",
    status: "AWAITING_CLIENT",
    position: 30,
    color: "orange",
    isSystem: true,
  },
  { id: "DONE", label: "Done", status: "DONE", position: 40, color: "green", isSystem: true },
  {
    id: "CANCELLED",
    label: "Cancelled",
    status: "CANCELLED",
    position: 50,
    color: "neutral",
    isSystem: true,
  },
]

export function boardColumnStatuses(columns: BoardColumnDto[]): TicketStatus[] {
  return [...new Set(columns.map((c) => c.status))]
}

export function resolveTicketBoardColumnId(
  ticket: { boardColumnId: string | null; status: string },
  columns: BoardColumnDto[]
): string {
  if (ticket.boardColumnId && columns.some((c) => c.id === ticket.boardColumnId)) {
    return ticket.boardColumnId
  }
  const byStatus = columns.filter((c) => c.status === ticket.status)
  return byStatus[0]?.id ?? columns[0]?.id ?? "PLANNED"
}

export function serializeBoardColumn(row: {
  id: string
  label: string
  status: TicketStatus
  position: number
  color: string
  isSystem: boolean
}): BoardColumnDto {
  const color = BOARD_COLUMN_COLORS.includes(row.color as BoardColumnColor)
    ? (row.color as BoardColumnColor)
    : "slate"
  return {
    id: row.id,
    label: row.label,
    status: row.status,
    position: row.position,
    color,
    isSystem: row.isSystem,
  }
}
