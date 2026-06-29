"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import Link from "next/link"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { ticketStatusLabel } from "@/lib/ticket-display"
import { COLUMN_COLOR_DOT, COLUMN_COLOR_BORDER } from "@/lib/board-column-styles"
import type { BoardColumnConfig, KanbanTicket } from "@/components/board/kanban-types"
import { KanbanCard } from "@/components/board/KanbanCard"
import { KanbanSortableCard } from "@/components/board/KanbanSortableCard"
import { KanbanColumnAdd } from "@/components/board/KanbanColumnAdd"

function ColumnShell(props: {
  column: BoardColumnConfig
  tickets: KanbanTicket[]
  workspaceSlug?: string
  backlogHref?: string
  canEdit?: boolean
  isOver?: boolean
  droppableRef?: (node: HTMLElement | null) => void
  onAddCard?: (columnId: string, title: string) => Promise<void>
}) {
  const showBacklogLink =
    props.backlogHref && props.column.status === "PLANNED" && props.tickets.length === 0

  return (
    <div
      ref={props.droppableRef}
      data-kanban-column
      className={cn(
        "flex w-[min(300px,85vw)] shrink-0 flex-col rounded-lg border min-h-[480px] transition-all duration-200",
        props.isOver
          ? "border-fg/40 bg-surface-2 shadow-inner"
          : cn("bg-surface-1/90", COLUMN_COLOR_BORDER[props.column.color])
      )}
    >
      <header className="px-3 py-2.5 border-b border-border rounded-t-lg bg-surface/90 sticky top-0 z-[1] backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn("h-2 w-2 shrink-0 rounded-full", COLUMN_COLOR_DOT[props.column.color])}
              aria-hidden="true"
            />
            <h2 className="text-sm font-medium text-fg truncate">{props.column.label}</h2>
          </div>
          <span className="inline-flex min-w-[1.5rem] h-5 items-center justify-center rounded-md border border-border bg-surface px-1.5 text-[10px] font-semibold text-fg tabular-nums">
            {props.tickets.length}
          </span>
        </div>
        {!props.column.isSystem ? (
          <p className="mt-0.5 pl-4 text-[10px] text-fg-subtle truncate">
            → {ticketStatusLabel(props.column.status)}
          </p>
        ) : null}
      </header>

      <div className="flex-1 p-2 flex flex-col gap-2 min-h-[160px]">
        {props.canEdit ? (
          <SortableContext items={props.tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {props.tickets.length === 0 ? (
              <EmptyDropZone isOver={props.isOver} />
            ) : (
              props.tickets.map((t) => (
                <KanbanSortableCard
                  key={t.id}
                  ticket={t}
                  columnColor={props.column.color}
                  workspaceSlug={props.workspaceSlug}
                />
              ))
            )}
          </SortableContext>
        ) : props.tickets.length === 0 ? (
          <EmptyDropZone />
        ) : (
          props.tickets.map((t) => (
            <KanbanCard
              key={t.id}
              ticket={t}
              columnColor={props.column.color}
              workspaceSlug={props.workspaceSlug}
            />
          ))
        )}

        {props.canEdit && props.onAddCard ? (
          <KanbanColumnAdd
            disabled={false}
            onCreate={(title) => props.onAddCard!(props.column.id, title)}
          />
        ) : null}

        {showBacklogLink && !props.canEdit ? (
          <Link
            href={props.backlogHref!}
            className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-[11px] font-medium text-fg-muted hover:text-fg hover:border-fg/25 hover:bg-surface-2 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            From backlog
          </Link>
        ) : null}
      </div>
    </div>
  )
}

function EmptyDropZone(props: { isOver?: boolean }) {
  return (
    <div
      className={cn(
        "flex-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-3 py-8 text-center min-h-[100px]",
        props.isOver ? "border-fg/30 bg-surface-2" : "border-border/70 bg-surface/40"
      )}
    >
      <p className="text-xs text-fg-muted">{props.isOver ? "Drop here" : "Empty"}</p>
    </div>
  )
}

export function KanbanColumnStatic(props: {
  column: BoardColumnConfig
  tickets: KanbanTicket[]
  workspaceSlug?: string
  backlogHref?: string
}) {
  return (
    <ColumnShell
      column={props.column}
      tickets={props.tickets}
      workspaceSlug={props.workspaceSlug}
      backlogHref={props.backlogHref}
    />
  )
}

export function KanbanColumn(props: {
  column: BoardColumnConfig
  tickets: KanbanTicket[]
  workspaceSlug?: string
  backlogHref?: string
  canEdit?: boolean
  onAddCard?: (columnId: string, title: string) => Promise<void>
}) {
  const droppable = useDroppable({ id: props.column.id })

  return (
    <ColumnShell
      column={props.column}
      tickets={props.tickets}
      workspaceSlug={props.workspaceSlug}
      backlogHref={props.backlogHref}
      canEdit={props.canEdit}
      isOver={droppable.isOver}
      droppableRef={droppable.setNodeRef}
      onAddCard={props.onAddCard}
    />
  )
}
