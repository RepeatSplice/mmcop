"use client"

import dynamic from "next/dynamic"
import type { BoardColumnDto } from "@/lib/board-columns"
import type { KanbanTicket } from "@/components/board/kanban-types"

const KanbanBoard = dynamic(
  () => import("@/components/board/KanbanBoard").then((m) => m.KanbanBoard),
  {
    loading: () => (
      <div className="flex gap-3 p-4 overflow-x-auto min-h-[360px] animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="w-[280px] shrink-0 space-y-2">
            <div className="h-7 bg-surface-2 rounded-md" />
            <div className="h-20 bg-surface-2 rounded-md" />
            <div className="h-16 bg-surface-2 rounded-md" />
          </div>
        ))}
      </div>
    ),
    ssr: false,
  }
)

export function BoardKanban(props: {
  workspaceId: string
  sprintId: string
  workspaceSlug: string
  backlogHref: string
  canEdit: boolean
  canManageColumns: boolean
  currentUserId: string | null
  initialColumns: BoardColumnDto[]
  initialTickets: KanbanTicket[]
  epics: Array<{ id: string; key: string; title: string }>
  disciplines: string[]
}) {
  return <KanbanBoard {...props} />
}
