import type { TicketStatus } from "@prisma/client"
import type { BoardColumnColor } from "@/lib/board-columns"

export type BoardColumnConfig = {
  id: string
  label: string
  status: TicketStatus
  position: number
  color: BoardColumnColor
  isSystem: boolean
}

export type KanbanTicket = {
  id: string
  key: string
  title: string
  descriptionPreview?: string | null
  discipline: string | null
  status: TicketStatus
  boardColumnId: string
  position: number
  commentsCount: number
  attachmentsCount: number
  assigneeId?: string | null
  assigneeName?: string | null
  assigneeImage?: string | null
  dueDate?: string | null
  hoursEst?: number | null
  parentId?: string | null
  parentKey?: string | null
  parentTitle?: string | null
  subtaskOfId?: string | null
}
