"use client"

import Link from "next/link"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowUpRight, GripVertical, Layers, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { ticketStatusLabel } from "@/lib/ticket-display"
import { laneOf, statusToneClass } from "@/lib/ticket-status"
import type { BacklogTicket } from "@/components/backlog/backlog-types"

type SprintOption = { id: string; name: string; status: string; label: string }

function StatusPill({ status }: { status: string }) {
  const lane = laneOf(status)
  return (
    <span
      className={cn(
        "inline-flex rounded-sm border bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        statusToneClass(status)
      )}
      title={lane === "billing" ? "Billing lane" : "Workflow lane"}
    >
      {ticketStatusLabel(status)}
    </span>
  )
}

function CardBody({
  ticket,
  workspaceSlug,
  dragHandleProps,
  dragging,
  sprints,
  onMoveToSprint,
}: {
  ticket: BacklogTicket
  workspaceSlug: string
  dragHandleProps?: Record<string, unknown>
  dragging?: boolean
  sprints?: SprintOption[]
  onMoveToSprint?: (ticketId: string, sprintId: string | null) => void
}) {
  const href = `/workspace/${workspaceSlug}/tickets/${ticket.key}`

  return (
    <article
      className={cn(
        "relative rounded-lg border bg-surface transition-all",
        dragging
          ? "border-fg/40 shadow-md"
          : "border-border hover:border-fg/25 hover:shadow-sm"
      )}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-fg/20" aria-hidden="true" />

      <div className="pl-3.5 pr-3 py-3">
        <div className="flex items-start gap-2">
          {dragHandleProps ? (
            <button
              type="button"
              className="mt-0.5 touch-none shrink-0 rounded p-0.5 text-fg-subtle/50 hover:text-fg hover:bg-surface-2 cursor-grab active:cursor-grabbing"
              aria-label={`Drag ${ticket.key}`}
              {...dragHandleProps}
            >
              <GripVertical className="h-4 w-4" strokeWidth={1.5} />
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={href}
                className="text-[11px] font-semibold text-fg hover:underline tabular-nums"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {ticket.key}
              </Link>
              <StatusPill status={ticket.status} />
              {ticket.sprintName ? (
                <span className="text-[10px] text-fg-subtle truncate max-w-[140px]">
                  {ticket.sprintName}
                </span>
              ) : null}
            </div>

            <Link
              href={href}
              className="mt-1.5 block text-sm font-medium text-fg leading-snug line-clamp-2 hover:underline"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {ticket.title}
            </Link>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-sm bg-surface-2 px-1.5 py-0.5 text-[10px] text-fg-muted">
                {ticket.discipline}
              </span>
              {ticket.parentKey ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-fg-subtle">
                  <Layers className="h-3 w-3" strokeWidth={1.75} />
                  {ticket.parentKey}
                </span>
              ) : null}
              {sprints && onMoveToSprint ? (
                <select
                  value={ticket.sprintId ?? ""}
                  onChange={(e) => onMoveToSprint(ticket.id, e.target.value || null)}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-sm border border-border bg-surface px-1.5 py-0.5 text-[10px] text-fg-muted hover:text-fg focus:outline-none"
                  title="Move to sprint"
                  aria-label={`Sprint for ${ticket.key}`}
                >
                  <option value="">No sprint</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {ticket.commentsCount > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-fg-subtle">
                <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
                {ticket.commentsCount}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-0.5 text-[10px] text-fg-muted opacity-0 group-hover:opacity-100 transition-opacity">
              Open
              <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

export function BacklogTicketCardPreview({
  ticket,
  workspaceSlug,
}: {
  ticket: BacklogTicket
  workspaceSlug: string
}) {
  return (
    <div className="group relative cursor-grabbing rotate-[1deg]">
      <CardBody ticket={ticket} workspaceSlug={workspaceSlug} dragging />
    </div>
  )
}

export function BacklogTicketCardStatic({
  ticket,
  workspaceSlug,
}: {
  ticket: BacklogTicket
  workspaceSlug: string
}) {
  return (
    <div className="group relative">
      <CardBody ticket={ticket} workspaceSlug={workspaceSlug} />
    </div>
  )
}

export function BacklogTicketCard({
  ticket,
  workspaceSlug,
  sprints,
  onMoveToSprint,
}: {
  ticket: BacklogTicket
  workspaceSlug: string
  sprints?: SprintOption[]
  onMoveToSprint?: (ticketId: string, sprintId: string | null) => void
}) {
  const sortable = useSortable({ id: ticket.id })
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.35 : 1,
  }

  return (
    <div ref={sortable.setNodeRef} style={style} className="group relative">
      <CardBody
        ticket={ticket}
        workspaceSlug={workspaceSlug}
        dragHandleProps={{ ...sortable.attributes, ...sortable.listeners }}
        sprints={sprints}
        onMoveToSprint={onMoveToSprint}
      />
    </div>
  )
}
