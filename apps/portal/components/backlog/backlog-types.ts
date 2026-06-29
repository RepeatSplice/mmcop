export type BacklogTicket = {
  id: string
  key: string
  title: string
  discipline: string
  status: string
  sprintId: string | null
  sprintName?: string | null
  position: number
  parentId: string | null
  parentKey?: string | null
  commentsCount: number
}

/**
 * Backlog filter:
 *  - all: every grooming-eligible ticket
 *  - workflow: BACKLOG / PLANNED (standard sprint work)
 *  - requests: billing-lane (REQUESTED / QUOTED / AWAITING_PAYMENT / ACTIVE / AWAITING_CLIENT)
 */
export type BacklogFilter = "all" | "workflow" | "requests"
