"use client"

import { useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageShell } from "@/components/layout/PageShell"
import { cn } from "@/lib/utils"

export type CalendarSprint = {
  id: string
  name: string
  startDate: string // ISO
  endDate: string // ISO
  status: "PLANNING" | "ACTIVE" | "COMPLETE" | "CANCELLED"
  hoursMax: number
  hoursUsed: number
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`
}

function toYm(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1)
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function monthLabel(d: Date) {
  return d.toLocaleString(undefined, { month: "long", year: "numeric" })
}

function clampDate(d: Date, min: Date, max: Date) {
  return new Date(Math.min(max.getTime(), Math.max(min.getTime(), d.getTime())))
}

function inRange(day: Date, start: Date, end: Date) {
  const t = day.getTime()
  return t >= start.getTime() && t <= end.getTime()
}

export function WorkspaceCalendar({
  baseHref,
  ym,
  sprints,
}: {
  baseHref: string
  ym: string
  sprints: CalendarSprint[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const monthDate = useMemo(() => {
    const [y, m] = ym.split("-").map((v) => Number(v))
    if (!y || !m) return new Date()
    return new Date(y, m - 1, 1)
  }, [ym])

  const today = useMemo(() => startOfDay(new Date()), [])

  const grid = useMemo(() => {
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
    // Monday-start calendar: 0=Mon ... 6=Sun
    const dow = (first.getDay() + 6) % 7
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - dow)
    const days: Date[] = []
    for (let i = 0; i < 42; i++) {
      days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
    }
    return days
  }, [monthDate])

  const sprintRanges = useMemo(() => {
    return sprints.map((s) => {
      const start = startOfDay(new Date(s.startDate))
      const end = startOfDay(new Date(s.endDate))
      const safeEnd = end.getTime() < start.getTime() ? start : end
      return { sprint: s, start, end: safeEnd }
    })
  }, [sprints])

  function navigateTo(newMonth: Date) {
    const next = new URLSearchParams(searchParams?.toString())
    next.set("ym", toYm(newMonth))
    router.push(`${baseHref}?${next.toString()}`)
  }

  function statusTone(s: CalendarSprint["status"]) {
    if (s === "COMPLETE") return "bg-emerald-500/20 text-emerald-200 border-emerald-500/30"
    if (s === "CANCELLED") return "bg-red-500/10 text-red-200 border-red-500/20"
    if (s === "ACTIVE") return "bg-monarch-500/20 text-fg border-monarch-500/30"
    return "bg-surface-2 text-fg-muted border-border"
  }

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  return (
    <PageShell>
      <div className="w-full bg-surface-1">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-border">
          <div>
            <p className="text-xs text-fg-muted">Calendar</p>
            <h2 className="mt-1 font-display text-xl uppercase tracking-wide">{monthLabel(monthDate)}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateTo(addMonths(monthDate, -1))}
              className="h-9 px-3 border border-border bg-surface-1 text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => navigateTo(clampDate(today, new Date(2000, 0, 1), new Date(2100, 0, 1)))}
              className="h-9 px-3 border border-border bg-surface-1 text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => navigateTo(addMonths(monthDate, 1))}
              className="h-9 px-3 border border-border bg-surface-1 text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
            >
              Next
            </button>
          </div>
        </div>

        <div className="border-t border-border bg-surface-1">
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map((d) => (
              <div key={d} className="px-3 py-2 text-xs text-fg-subtle">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {grid.map((day) => {
              const inMonth = day.getMonth() === monthDate.getMonth()
              const isToday = isSameDay(day, today)
              const dayStart = startOfDay(day)

              const covering = sprintRanges.filter((r) => inRange(dayStart, r.start, r.end))
              const starting = covering.filter((r) => isSameDay(r.start, dayStart))

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[120px] border-b border-border border-r border-border p-2",
                    !inMonth && "bg-surface",
                    covering.length > 0 && "bg-monarch-500/5"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "text-xs",
                        inMonth ? "text-fg" : "text-fg-subtle",
                        isToday && "font-display"
                      )}
                    >
                      {day.getDate()}
                    </div>
                    {isToday ? (
                      <div className="text-[10px] px-2 py-0.5 border border-monarch-500 bg-monarch-500 text-white">
                        Today
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-2 space-y-1">
                    {starting.slice(0, 3).map(({ sprint }) => (
                      <div
                        key={sprint.id}
                        className={cn(
                          "text-[11px] px-2 py-1 border truncate",
                          statusTone(sprint.status)
                        )}
                        title={`${sprint.name} (${sprint.status})`}
                      >
                        {sprint.name}
                      </div>
                    ))}
                    {starting.length > 3 ? (
                      <div className="text-[11px] text-fg-subtle px-1">+{starting.length - 3} more</div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="text-xs text-fg-subtle px-4 sm:px-5 py-3 border-t border-border">
          Showing sprints on their start date. Next we can add drag-to-create events and due dates on
          tickets.
        </div>
      </div>
    </PageShell>
  )
}

