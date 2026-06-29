"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { EndSprintButton } from "@/components/board/EndSprintButton"
import { formatSprintRange } from "@/lib/sprint-calendar"
import { boardColumnLabel, ticketStatusLabel } from "@/lib/ticket-display"
import type { TimelineSprint, TimelineTicket } from "@/components/timeline/timeline-types"
import { diffDays, startOfDay } from "@/components/timeline/timeline-utils"

function sprintRoleLabel(status: string, index: number) {
  if (status === "ACTIVE") return "Current sprint"
  if (index === 1) return "Next sprint"
  return "Later"
}

function statusCounts(tickets: TimelineTicket[]) {
  const counts: Record<string, number> = {}
  for (const t of tickets) {
    if (t.status === "BACKLOG") continue
    counts[t.status] = (counts[t.status] ?? 0) + 1
  }
  return counts
}

function SprintCard(props: {
  sprint: TimelineSprint
  role: string
  workspaceSlug: string
  baseHref: string
  expanded: boolean
  onToggle: () => void
  showEndSprint?: boolean
  workspaceId?: string
  canEndSprint?: boolean
}) {
  const counts = statusCounts(props.sprint.tickets)
  const total = props.sprint.tickets.filter((t) => t.status !== "BACKLOG").length
  const done = counts.DONE ?? 0
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const start = new Date(props.sprint.startDate)
  const end = new Date(props.sprint.endDate)
  const preview = props.sprint.tickets
    .filter((t) => t.status !== "BACKLOG")
    .slice(0, 8)

  return (
    <article
      className={cn(
        "rounded-lg border flex flex-col overflow-hidden",
        props.sprint.status === "ACTIVE"
          ? "border-fg/30 bg-surface-1"
          : "border-border bg-surface-1/80"
      )}
    >
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
              {props.role}
            </p>
            <h3 className="mt-0.5 text-sm font-medium text-fg">{formatSprintRange(start, end)}</h3>
            <p className="mt-0.5 text-[11px] text-fg-muted">
              {total} committed ticket{total === 1 ? "" : "s"}
              {props.sprint.status === "ACTIVE" ? ` · ${pct}% done` : ""}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase",
              props.sprint.status === "ACTIVE"
                ? "border-fg/40 bg-fg/10 text-fg"
                : "border-border text-fg-muted"
            )}
          >
            {props.sprint.status === "ACTIVE" ? "Active" : "Planning"}
          </span>
        </div>
        {props.sprint.status === "ACTIVE" && props.workspaceId ? (
          <div className="mt-3">
            <EndSprintButton
              workspaceId={props.workspaceId}
              disabled={!props.canEndSprint}
            />
          </div>
        ) : null}
      </div>

      <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b border-border">
        {(["PLANNED", "IN_PROGRESS", "REVIEW", "DONE"] as const).map((s) => {
          const n = counts[s] ?? 0
          if (n === 0 && props.sprint.status !== "ACTIVE") return null
          return (
            <span
              key={s}
              className="text-[10px] rounded-sm border border-border px-1.5 py-0.5 text-fg-muted"
            >
              <span className="font-medium text-fg tabular-nums">{n}</span>{" "}
              {s === "PLANNED" ? boardColumnLabel(s) : ticketStatusLabel(s)}
            </span>
          )
        })}
      </div>

      <button
        type="button"
        onClick={props.onToggle}
        className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium text-fg-muted hover:text-fg text-left"
      >
        {props.expanded ? (
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
        )}
        Tickets
      </button>

      {props.expanded ? (
        <ul className="px-3 pb-3 space-y-1.5 max-h-[240px] overflow-y-auto">
          {preview.length === 0 ? (
            <li className="px-2 py-4 text-xs text-fg-muted text-center">No tickets committed yet.</li>
          ) : (
            preview.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/workspace/${props.workspaceSlug}/tickets/${t.key}`}
                  className="block rounded-md border border-border px-2.5 py-2 hover:bg-surface-2 text-xs"
                >
                  <span className="font-semibold text-fg">{t.key}</span>
                  <span className="text-fg-subtle ml-1.5">
                    {t.status === "PLANNED" ? boardColumnLabel(t.status) : ticketStatusLabel(t.status)}
                  </span>
                  <p className="mt-0.5 text-fg line-clamp-1">{t.title}</p>
                </Link>
              </li>
            ))
          )}
          {total > preview.length ? (
            <li className="px-2 pt-1">
              <Link href={`${props.baseHref}/list`} className="text-[11px] text-fg-muted hover:text-fg">
                +{total - preview.length} more in All work →
              </Link>
            </li>
          ) : null}
        </ul>
      ) : null}

      {props.sprint.status === "ACTIVE" ? (
        <div className="mt-auto px-4 py-2 border-t border-border">
          <Link
            href={`${props.baseHref}/board`}
            className="text-[11px] font-medium text-fg hover:underline"
          >
            Open board →
          </Link>
        </div>
      ) : null}
    </article>
  )
}

export function SprintRoadmap(props: {
  workspaceSlug: string
  workspaceId: string
  baseHref: string
  sprints: TimelineSprint[]
  canEndSprint?: boolean
}) {
  const ordered = useMemo(() => {
    const active = props.sprints.find((s) => s.status === "ACTIVE")
    const planning = props.sprints
      .filter((s) => s.status === "PLANNING")
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
    const list: TimelineSprint[] = []
    if (active) list.push(active)
    for (const p of planning.slice(0, 2)) list.push(p)
    return list.slice(0, 3)
  }, [props.sprints])

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const s of ordered) {
      init[s.id] = s.status === "ACTIVE"
    }
    return init
  })

  const range = useMemo(() => {
    if (ordered.length === 0) return null
    const starts = ordered.map((s) => startOfDay(new Date(s.startDate)))
    const ends = ordered.map((s) => startOfDay(new Date(s.endDate)))
    const start = new Date(Math.min(...starts.map((d) => d.getTime())))
    const end = new Date(Math.max(...ends.map((d) => d.getTime())))
    const totalDays = Math.max(1, diffDays(start, end) + 1)
    const today = startOfDay(new Date())
    const todayOffset = diffDays(start, today)
    return { start, end, totalDays, todayOffset }
  }, [ordered])

  return (
    <section className="bg-surface-1 overflow-hidden">
      {range ? (
        <div className="px-5 py-4 border-b border-border">
          <p className="text-[11px] text-fg-muted mb-2">6-week horizon (Monday-aligned sprints)</p>
          <div className="relative h-3 rounded-full bg-surface-2 overflow-hidden flex">
            {ordered.map((s) => {
              const segStart = startOfDay(new Date(s.startDate))
              const segEnd = startOfDay(new Date(s.endDate))
              const left = diffDays(range.start, segStart)
              const width = diffDays(segStart, segEnd) + 1
              const leftPct = (left / range.totalDays) * 100
              const widthPct = (width / range.totalDays) * 100
              return (
                <div
                  key={s.id}
                  className={cn(
                    "absolute top-0 bottom-0 rounded-sm",
                    s.status === "ACTIVE" ? "bg-fg/70" : "bg-fg/25"
                  )}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  title={formatSprintRange(segStart, segEnd)}
                />
              )
            })}
            {range.todayOffset >= 0 && range.todayOffset <= range.totalDays ? (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-fg z-10"
                style={{ left: `${(range.todayOffset / range.totalDays) * 100}%` }}
                title="Today"
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="p-5 grid gap-4 lg:grid-cols-3">
        {ordered.map((s, i) => (
          <SprintCard
            key={s.id}
            sprint={s}
            role={sprintRoleLabel(s.status, i)}
            workspaceSlug={props.workspaceSlug}
            baseHref={props.baseHref}
            expanded={expanded[s.id] ?? false}
            onToggle={() =>
              setExpanded((prev) => ({ ...prev, [s.id]: !prev[s.id] }))
            }
            workspaceId={props.workspaceId}
            canEndSprint={props.canEndSprint}
          />
        ))}
      </div>
    </section>
  )
}
