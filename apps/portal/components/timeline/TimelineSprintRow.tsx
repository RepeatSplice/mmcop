"use client"

import Link from "next/link"
import { ArrowUpRight, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { ticketStatusLabel } from "@/lib/ticket-display"
import type { TimelineSprint, TimelineTicket } from "@/components/timeline/timeline-types"
import {
  addDays,
  clamp,
  daysRemaining,
  diffDays,
  formatShortDate,
  sprintTimelinePct,
  startOfDay,
} from "@/components/timeline/timeline-utils"

const MAX_TICKETS_LEFT = 6
const MAX_TICKETS_GANTT = 14

export function sprintRowHeight(sprint: TimelineSprint) {
  const ganttCount = Math.min(sprint.tickets.length, MAX_TICKETS_GANTT)
  return Math.max(120, 72 + ganttCount * 26)
}

function sprintStatusClass(status: string) {
  if (status === "ACTIVE") return "border-fg/40 bg-fg/15 text-fg"
  if (status === "COMPLETE") return "border-border bg-surface-2 text-fg-muted"
  if (status === "CANCELLED") return "border-border bg-surface text-fg-subtle line-through"
  return "border-border bg-surface-2 text-fg-muted"
}

function sprintBarClass(status: string) {
  if (status === "ACTIVE") return "bg-fg/80"
  if (status === "COMPLETE") return "bg-fg/25"
  return "bg-fg/40"
}

function ticketBarClass(status: string) {
  if (status === "DONE") return "bg-fg border-fg"
  if (status === "IN_PROGRESS") return "bg-fg/60 border-fg/60"
  if (status === "REVIEW") return "bg-fg/35 border-fg/35"
  return "bg-surface-2 border-border"
}

function AssigneeDot({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-fg text-[8px] font-semibold text-surface"
      title={name}
    >
      {initials || "?"}
    </span>
  )
}

function TicketListItem({
  ticket,
  workspaceSlug,
}: {
  ticket: TimelineTicket
  workspaceSlug: string
}) {
  const href = `/workspace/${workspaceSlug}/tickets/${ticket.key}`
  return (
    <Link
      href={href}
      className="group flex items-start gap-2 rounded-md border border-border bg-surface px-2.5 py-2 hover:border-fg/25 hover:bg-surface-2 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold text-fg tabular-nums">{ticket.key}</span>
          <span className="text-[10px] text-fg-subtle">{ticketStatusLabel(ticket.status)}</span>
        </div>
        <p className="mt-0.5 text-xs text-fg line-clamp-1">{ticket.title}</p>
        {ticket.dueDate ? (
          <p className="mt-0.5 text-[10px] text-fg-muted flex items-center gap-1">
            <Calendar className="h-3 w-3" strokeWidth={1.75} />
            {formatShortDate(new Date(ticket.dueDate))}
          </p>
        ) : null}
      </div>
      {ticket.assigneeName ? <AssigneeDot name={ticket.assigneeName} /> : null}
      <ArrowUpRight
        className="h-3 w-3 shrink-0 text-fg-subtle opacity-0 group-hover:opacity-100 transition-opacity"
        strokeWidth={2}
      />
    </Link>
  )
}

type RowProps = {
  sprint: TimelineSprint
  workspaceSlug: string
  isCurrent: boolean
}

export function TimelineSprintRowLeft(props: RowProps) {
  const { sprint } = props
  const start = startOfDay(new Date(sprint.startDate))
  const end = startOfDay(new Date(sprint.endDate))
  const timelinePct = sprintTimelinePct(start, end)
  const hoursPct =
    sprint.hoursMax > 0 ? Math.min(100, (sprint.hoursUsed / sprint.hoursMax) * 100) : null
  const leftTickets = sprint.tickets.slice(0, MAX_TICKETS_LEFT)
  const rowHeight = sprintRowHeight(sprint)

  return (
    <div
      className={cn(
        "border-b border-border px-4 py-4 flex flex-col gap-3",
        props.isCurrent && "bg-surface-2/50 border-l-2 border-l-fg"
      )}
      style={{ minHeight: rowHeight }}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              sprintStatusClass(sprint.status)
            )}
          >
            {sprint.status}
          </span>
          {props.isCurrent ? (
            <span className="text-[10px] font-medium text-fg">Current sprint</span>
          ) : null}
        </div>
        <p className="mt-1.5 text-sm font-medium text-fg truncate">{sprint.name}</p>
        <p className="mt-0.5 text-[11px] text-fg-muted">
          {formatShortDate(start)} – {formatShortDate(end)}
          <span className="text-fg-subtle"> · {daysRemaining(end)}d left</span>
        </p>
      </div>

      <div>
        <div className="flex justify-between text-[10px] text-fg-subtle mb-1">
          <span>Sprint elapsed</span>
          <span className="tabular-nums">{Math.round(timelinePct)}%</span>
        </div>
        <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full bg-fg rounded-full" style={{ width: `${timelinePct}%` }} />
        </div>
      </div>

      {sprint.hoursMax > 0 ? (
        <div>
          <div className="flex justify-between text-[10px] text-fg-subtle mb-1">
            <span>Hours</span>
            <span className="tabular-nums">
              {sprint.hoursUsed} / {sprint.hoursMax}
            </span>
          </div>
          <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full bg-fg/60 rounded-full"
              style={{ width: hoursPct != null ? `${hoursPct}%` : "0%" }}
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5 flex-1 min-h-0">
        {leftTickets.length === 0 ? (
          <p className="text-xs text-fg-muted py-2">No tickets in this sprint.</p>
        ) : (
          leftTickets.map((t) => (
            <TicketListItem key={t.id} ticket={t} workspaceSlug={props.workspaceSlug} />
          ))
        )}
        {sprint.tickets.length > MAX_TICKETS_LEFT ? (
          <p className="text-[10px] text-fg-subtle pt-1">
            +{sprint.tickets.length - MAX_TICKETS_LEFT} more on chart →
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function TimelineSprintRowChart(props: RowProps & {
  rangeStart: Date
  timelineWidth: number
  todayLeft: number
  pxPerDay: number
}) {
  const { sprint } = props
  const start = startOfDay(new Date(sprint.startDate))
  const end = startOfDay(new Date(sprint.endDate))
  const sprintLeft = clamp(diffDays(props.rangeStart, start) * props.pxPerDay, 0, props.timelineWidth)
  const sprintWidth = clamp(
    (diffDays(start, end) + 1) * props.pxPerDay,
    props.pxPerDay * 2,
    props.timelineWidth - sprintLeft
  )
  const ganttTickets = sprint.tickets.slice(0, MAX_TICKETS_GANTT)
  const rowHeight = sprintRowHeight(sprint)

  return (
    <div
      className={cn(
        "relative border-b border-border px-2 py-3 overflow-hidden",
        props.isCurrent && "bg-surface-2/30"
      )}
      style={{ minHeight: rowHeight, width: props.timelineWidth }}
    >
      <div
        className="absolute top-0 bottom-0 w-px bg-fg/50 z-10 pointer-events-none"
        style={{ left: props.todayLeft }}
        aria-hidden="true"
      />

      <div
        className={cn("absolute top-5 h-2 rounded-full", sprintBarClass(sprint.status))}
        style={{ left: sprintLeft, width: sprintWidth }}
        title={`${sprint.name} (${formatShortDate(start)} – ${formatShortDate(end)})`}
      />

      <div className="absolute left-0 right-0 top-10">
        {ganttTickets.map((t, i) => {
          const bar = ticketBarGeometry(t, sprint, props.rangeStart, props.pxPerDay, i)
          const href = `/workspace/${props.workspaceSlug}/tickets/${t.key}`
          return (
            <Link
              key={t.id}
              href={href}
              className="absolute block h-5 rounded-sm group"
              style={{
                left: bar.left,
                width: bar.width,
                top: i * 26,
              }}
              title={`${t.key}: ${t.title}${t.dueDate ? ` · due ${formatShortDate(new Date(t.dueDate))}` : ""}`}
            >
              <span
                className={cn(
                  "flex h-full w-full items-center rounded-sm border px-1.5 overflow-hidden",
                  ticketBarClass(t.status)
                )}
              >
                <span className="text-[9px] font-medium text-fg truncate">{t.key}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function ticketBarGeometry(
  ticket: TimelineTicket,
  sprint: TimelineSprint,
  rangeStart: Date,
  pxPerDay: number,
  index: number
) {
  const sprintStart = startOfDay(new Date(sprint.startDate))

  if (ticket.dueDate) {
    const due = startOfDay(new Date(ticket.dueDate))
    const start = sprintStart.getTime() < due.getTime() ? sprintStart : addDays(due, -1)
    const left = diffDays(rangeStart, start) * pxPerDay
    const width = Math.max(pxPerDay * 2, (diffDays(start, due) + 1) * pxPerDay)
    return { left: Math.max(0, left), width }
  }

  const stagger = index * pxPerDay * 0.4
  const left = diffDays(rangeStart, sprintStart) * pxPerDay + stagger
  return { left: Math.max(0, left), width: pxPerDay * 3 }
}
