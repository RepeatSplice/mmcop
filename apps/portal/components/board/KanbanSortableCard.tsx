"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { KanbanCard } from "@/components/board/KanbanCard"
import type { BoardColumnColor } from "@/lib/board-columns"
import type { KanbanTicket } from "@/components/board/kanban-types"

export function KanbanSortableCard(props: {
  ticket: KanbanTicket
  columnColor: BoardColumnColor
  workspaceSlug?: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.ticket.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.2 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <KanbanCard
        ticket={props.ticket}
        columnColor={props.columnColor}
        workspaceSlug={props.workspaceSlug}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}
