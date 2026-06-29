"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { GanttChart, Inbox, ZoomIn } from "lucide-react"
import { cn } from "@/lib/utils"
import { TimelineSprintRowChart, TimelineSprintRowLeft } from "@/components/timeline/TimelineSprintRow"
import type { TimelineSprint, TimelineZoom } from "@/components/timeline/timeline-types"
import {
  addDays,
  clamp,
  diffDays,
  monthLabel,
  startOfDay,
} from "@/components/timeline/timeline-utils"

const ZOOM_OPTIONS: { value: TimelineZoom; label: string }[] = [
  { value: 16, label: "Compact" },
  { value: 24, label: "Normal" },
  { value: 32, label: "Comfort" },
]

export function TimelineGantt(props: {
  workspaceSlug: string
  baseHref: string
  sprints: TimelineSprint[]
  currentSprintId: string | null
}) {
  const [pxPerDay, setPxPerDay] = useState<TimelineZoom>(24)

  const range = useMemo(() => {
    const now = startOfDay(new Date())
    const starts = props.sprints.map((s) => startOfDay(new Date(s.startDate)))
    const ends = props.sprints.map((s) => startOfDay(new Date(s.endDate)))
    const minStart = starts.length ? new Date(Math.min(...starts.map((d) => d.getTime()))) : now
    const maxEnd = ends.length ? new Date(Math.max(...ends.map((d) => d.getTime()))) : addDays(now, 30)
    const paddedStart = addDays(minStart, -7)
    const paddedEnd = addDays(maxEnd, 14)
    const totalDays = Math.max(1, diffDays(paddedStart, paddedEnd) + 1)
    return { start: paddedStart, end: paddedEnd, totalDays, today: now }
  }, [props.sprints])

  const months = useMemo(() => {
    const out: { label: string; left: number; width: number }[] = []
    let cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1)
    if (cursor.getTime() > range.start.getTime()) {
      cursor = new Date(range.start.getFullYear(), range.start.getMonth() - 1, 1)
    }

    while (cursor.getTime() <= range.end.getTime()) {
      const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
      const segStart = cursor.getTime() < range.start.getTime() ? range.start : cursor
      const segEnd =
        addDays(next, -1).getTime() > range.end.getTime() ? range.end : addDays(next, -1)
      const leftDays = diffDays(range.start, segStart)
      const widthDays = diffDays(segStart, segEnd) + 1
      out.push({ label: monthLabel(cursor), left: leftDays * pxPerDay, width: widthDays * pxPerDay })
      cursor = next
    }
    return out
  }, [range.end, range.start, pxPerDay])

  const timelineWidth = range.totalDays * pxPerDay
  const todayLeft = clamp(diffDays(range.start, range.today) * pxPerDay, 0, timelineWidth)

  const chartProps = {
    rangeStart: range.start,
    timelineWidth,
    todayLeft,
    pxPerDay,
  }

  return (
    <section className="bg-surface-1 overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[11px] text-fg-muted">
          <GanttChart className="h-3.5 w-3.5 text-fg-subtle" strokeWidth={1.75} />
          <span className="hidden sm:inline">Sprint schedule</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <ZoomIn className="h-3.5 w-3.5 text-fg-subtle" strokeWidth={1.75} />
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
              Zoom
            </span>
          </div>
          <div className="inline-flex p-0.5 rounded-lg border border-border bg-surface gap-0.5">
            {ZOOM_OPTIONS.map((z) => (
              <button
                key={z.value}
                type="button"
                onClick={() => setPxPerDay(z.value)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  pxPerDay === z.value
                    ? "bg-fg text-surface"
                    : "text-fg-muted hover:text-fg hover:bg-surface-2"
                )}
              >
                {z.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {props.sprints.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <GanttChart className="mx-auto h-10 w-10 text-fg-subtle/30" strokeWidth={1.25} />
          <p className="mt-4 text-sm font-medium text-fg">No sprints yet</p>
          <p className="mt-1 text-xs text-fg-muted max-w-sm mx-auto">
            Sprints appear here once they are created for this workspace.
          </p>
          <Link
            href={`${props.baseHref}/board`}
            className="mt-6 inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-4 text-[11px] font-medium text-fg hover:bg-surface-2 transition-colors"
          >
            <Inbox className="h-3.5 w-3.5" strokeWidth={1.75} />
            Open board
          </Link>
        </div>
      ) : (
        <>
          <div className="border-b border-border overflow-x-auto overscroll-x-contain bg-surface-2/20">
            <div className="relative h-11" style={{ width: timelineWidth, minWidth: "100%" }}>
              {months.map((m) => (
                <div
                  key={`${m.label}-${m.left}`}
                  className="absolute top-0 bottom-0 border-r border-border/80 px-2 flex items-center text-[11px] text-fg-subtle"
                  style={{ left: m.left, width: m.width }}
                >
                  {m.label}
                </div>
              ))}
              <div
                className="absolute top-0 bottom-0 w-px bg-fg z-10"
                style={{ left: todayLeft }}
                title="Today"
              />
            </div>
          </div>

          <div className="hidden lg:grid lg:grid-cols-[minmax(260px,320px)_1fr]">
            <div className="border-r border-border px-4 py-3 bg-surface-2/30">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle">Work</p>
            </div>
            <div aria-hidden="true" className="bg-surface-2/20" />

            <div className="divide-y divide-border border-r border-border">
              {props.sprints.map((s) => (
                <TimelineSprintRowLeft
                  key={s.id}
                  sprint={s}
                  workspaceSlug={props.workspaceSlug}
                  isCurrent={s.id === props.currentSprintId}
                />
              ))}
            </div>

            <div className="overflow-x-auto overscroll-x-contain">
              <div style={{ width: timelineWidth, minWidth: "100%" }}>
                {props.sprints.map((s) => (
                  <TimelineSprintRowChart
                    key={s.id}
                    sprint={s}
                    workspaceSlug={props.workspaceSlug}
                    isCurrent={s.id === props.currentSprintId}
                    {...chartProps}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:hidden divide-y divide-border">
            {props.sprints.map((s) => (
              <div key={s.id}>
                <TimelineSprintRowLeft
                  sprint={s}
                  workspaceSlug={props.workspaceSlug}
                  isCurrent={s.id === props.currentSprintId}
                />
                <div className="overflow-x-auto overscroll-x-contain border-t border-border bg-surface-2/20">
                  <div style={{ width: timelineWidth, minWidth: "100%" }}>
                    <TimelineSprintRowChart
                      sprint={s}
                      workspaceSlug={props.workspaceSlug}
                      isCurrent={s.id === props.currentSprintId}
                      {...chartProps}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
