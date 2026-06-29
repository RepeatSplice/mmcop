import Link from "next/link"
import { CalendarDays, GanttChart, Inbox, ListTodo } from "lucide-react"
import { EndSprintButton } from "@/components/board/EndSprintButton"
import { COLUMN_COLOR_DOT } from "@/lib/board-column-styles"
import type { BoardColumnDto } from "@/lib/board-columns"
import { formatSprintRange } from "@/lib/sprint-calendar"

export type BoardSprintInfo = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  hoursMax: number
  hoursUsed: number
  status: string
}

function daysRemaining(end: Date): number {
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
}

function sprintTimelinePct(start: Date, end: Date): number {
  const total = end.getTime() - start.getTime()
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, ((Date.now() - start.getTime()) / total) * 100))
}

export function BoardSprintHeader(props: {
  sprint: BoardSprintInfo
  workspaceId: string
  baseHref: string
  totalCards: number
  columns: BoardColumnDto[]
  columnCounts: Record<string, number>
  canEndSprint?: boolean
}) {
  const { sprint } = props
  const hoursPct =
    sprint.hoursMax > 0 ? Math.min(100, (sprint.hoursUsed / sprint.hoursMax) * 100) : null
  const timelinePct = sprintTimelinePct(sprint.startDate, sprint.endDate)

  const sortedCols = [...props.columns].sort((a, b) => a.position - b.position)
  const inProgress = sortedCols
    .filter((c) => c.status === "IN_PROGRESS")
    .reduce((n, c) => n + (props.columnCounts[c.id] ?? 0), 0)
  const done = sortedCols
    .filter((c) => c.status === "DONE")
    .reduce((n, c) => n + (props.columnCounts[c.id] ?? 0), 0)

  return (
    <header className="bg-surface-1 border-b border-border shrink-0">
      <div className="px-4 sm:px-5 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
            Sprint board
          </p>
          <h1 className="text-lg font-medium text-fg tracking-tight truncate">{sprint.name}</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            {formatSprintRange(sprint.startDate, sprint.endDate)}
            <span className="text-fg-subtle"> · {daysRemaining(sprint.endDate)}d left</span>
            <span className="text-fg-subtle"> · {props.totalCards} cards</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <EndSprintButton workspaceId={props.workspaceId} disabled={!props.canEndSprint} />
          <Link
            href={`${props.baseHref}/backlog`}
            className="inline-flex h-7 items-center gap-1 rounded-sm border border-border bg-surface px-2.5 text-[11px] font-medium text-fg-muted hover:text-fg hover:bg-surface-2"
          >
            <Inbox className="h-3.5 w-3.5" strokeWidth={1.75} />
            Backlog
          </Link>
          <Link
            href={`${props.baseHref}/list`}
            className="inline-flex h-7 items-center gap-1 rounded-sm border border-border bg-surface px-2.5 text-[11px] font-medium text-fg-muted hover:text-fg hover:bg-surface-2"
          >
            <ListTodo className="h-3.5 w-3.5" strokeWidth={1.75} />
            List
          </Link>
          <Link
            href={`${props.baseHref}/timeline`}
            className="inline-flex h-7 items-center gap-1 rounded-sm border border-border bg-surface px-2.5 text-[11px] font-medium text-fg-muted hover:text-fg hover:bg-surface-2"
          >
            <GanttChart className="h-3.5 w-3.5" strokeWidth={1.75} />
            Timeline
          </Link>
        </div>
      </div>

      <div className="px-4 sm:px-5 pb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {sortedCols.map((col) => {
            const n = props.columnCounts[col.id] ?? 0
            return (
              <span
                key={col.id}
                className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface px-2 py-0.5 text-[11px] text-fg-muted"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${COLUMN_COLOR_DOT[col.color]}`}
                />
                <span className="font-medium text-fg tabular-nums">{n}</span>
                <span className="truncate max-w-[120px]">{col.label}</span>
              </span>
            )
          })}
        </div>

        <div className="flex gap-4 sm:gap-6 text-[11px] text-fg-subtle shrink-0">
          <div className="min-w-[100px]">
            <div className="flex justify-between mb-1">
              <span>Timeline</span>
              <span className="tabular-nums">{Math.round(timelinePct)}%</span>
            </div>
            <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full bg-fg rounded-full" style={{ width: `${timelinePct}%` }} />
            </div>
          </div>
          <div className="min-w-[100px]">
            <div className="flex justify-between mb-1">
              <span>Hours</span>
              <span className="tabular-nums">
                {sprint.hoursUsed}/{sprint.hoursMax || "∞"}
              </span>
            </div>
            <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full bg-fg/60 rounded-full"
                style={{ width: hoursPct != null ? `${hoursPct}%` : "0%" }}
              />
            </div>
          </div>
          <p className="hidden xl:block self-center">
            {inProgress} active · {done} done
          </p>
        </div>
      </div>

      <div className="px-4 py-1.5 border-t border-border/80 bg-surface flex items-center gap-2 text-[10px] text-fg-subtle">
        <CalendarDays className="h-3 w-3 shrink-0" strokeWidth={1.75} />
        <span>Scroll horizontally for all columns · use Columns to add custom swimlanes</span>
      </div>
    </header>
  )
}
