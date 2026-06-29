"use client"

import Link from "next/link"
import {
  ArrowUpRight,
  Calendar,
  Clock,
  GripVertical,
  Layers,
  MessageSquare,
  Paperclip,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { BoardColumnColor } from "@/lib/board-columns"
import { COLUMN_COLOR_ACCENT } from "@/lib/board-column-styles"
import type { KanbanTicket } from "@/components/board/kanban-types"

function AssigneeBadge({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <span
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-fg text-[9px] font-semibold text-surface"
      title={name}
    >
      {initials || "?"}
    </span>
  )
}

function DueBadge({ dueDate }: { dueDate: string }) {
  const due = new Date(dueDate)
  const now = Date.now()
  const overdue = due.getTime() < now
  const dueSoon = !overdue && due.getTime() - now < 7 * 24 * 60 * 60 * 1000

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium",
        overdue
          ? "border-fg bg-fg text-surface"
          : dueSoon
            ? "border-fg/40 text-fg"
            : "border-border text-fg-muted"
      )}
    >
      <Calendar className="h-3 w-3 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {due.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
    </span>
  )
}

export function KanbanCard(props: {
  ticket: KanbanTicket
  columnColor: BoardColumnColor
  workspaceSlug?: string
  dragging?: boolean
  ghost?: boolean
  dragHandleProps?: Record<string, unknown>
}) {
  const { ticket, columnColor, workspaceSlug, dragging, ghost, dragHandleProps } = props
  const isDone = ticket.status === "DONE"
  const href = workspaceSlug ? `/workspace/${workspaceSlug}/tickets/${ticket.key}` : undefined

  const inner = (
    <article
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-surface text-left transition-all duration-200",
        dragging
          ? "border-fg/50 shadow-lg ring-2 ring-fg/10 scale-[1.02]"
          : ghost
            ? "border-dashed border-border/80 opacity-40"
            : "border-border hover:border-fg/30 hover:shadow-md",
        isDone && !dragging && "opacity-80 hover:opacity-100"
      )}
    >
      <div
        className={cn("absolute left-0 top-0 bottom-0 w-1", COLUMN_COLOR_ACCENT[columnColor])}
        aria-hidden="true"
      />

      <div className="pl-3.5 pr-2.5 pt-2.5 pb-2.5">
        <div className="flex items-center gap-1.5">
          {dragHandleProps ? (
            <button
              type="button"
              className={cn(
                "touch-none shrink-0 rounded p-0.5 text-fg-subtle/50",
                "hover:text-fg hover:bg-surface-2 transition-colors cursor-grab active:cursor-grabbing"
              )}
              aria-label={`Drag ${ticket.key}`}
              {...dragHandleProps}
            >
              <GripVertical className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          ) : (
            <span className="w-5 shrink-0" aria-hidden="true" />
          )}

          <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle tabular-nums">
            {ticket.key}
          </span>

          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {href ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-fg">
                Open
                <ArrowUpRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
              </span>
            ) : null}
          </div>
        </div>

        {ticket.parentKey ? (
          <p className="mt-1.5 flex items-center gap-1 text-[10px] text-fg-subtle truncate">
            <Layers className="h-3 w-3 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate">{ticket.parentKey}</span>
          </p>
        ) : null}

        <h3
          className={cn(
            "mt-2 text-[13px] font-medium leading-snug text-fg line-clamp-3",
            isDone && "line-through decoration-fg/30"
          )}
        >
          {ticket.title}
        </h3>

        {ticket.descriptionPreview ? (
          <p className="mt-1.5 text-[11px] text-fg-muted leading-relaxed line-clamp-2">
            {ticket.descriptionPreview}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {ticket.discipline ? (
            <span className="rounded-sm bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-fg-muted">
              {ticket.discipline}
            </span>
          ) : null}
          {ticket.dueDate ? <DueBadge dueDate={ticket.dueDate} /> : null}
          {ticket.hoursEst != null && ticket.hoursEst > 0 ? (
            <span className="inline-flex items-center gap-0.5 rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-fg-muted">
              <Clock className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
              {ticket.hoursEst}h
            </span>
          ) : null}
        </div>

        <div className="mt-3 pt-2.5 border-t border-border/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-fg-subtle">
            {ticket.commentsCount > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-[10px]">
                <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                {ticket.commentsCount}
              </span>
            ) : null}
            {ticket.attachmentsCount > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-[10px]">
                <Paperclip className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                {ticket.attachmentsCount}
              </span>
            ) : null}
            {!ticket.commentsCount && !ticket.attachmentsCount ? (
              <span className="text-[10px] text-fg-subtle/60">No activity</span>
            ) : null}
          </div>
          {ticket.assigneeName ? (
            <AssigneeBadge name={ticket.assigneeName} />
          ) : (
            <span
              className="h-6 w-6 rounded-full border border-dashed border-border shrink-0"
              title="Unassigned"
            />
          )}
        </div>
      </div>
    </article>
  )

  if (href && !dragging) {
    return (
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/30 rounded-lg"
        draggable={false}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) {
            e.preventDefault()
          }
        }}
      >
        {inner}
      </Link>
    )
  }

  return inner
}
