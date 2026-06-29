import Link from "next/link"
import { CalendarDays, Columns3, Inbox, ListTodo } from "lucide-react"

export function TimelineHeader(props: {
  baseHref: string
  sprintCount: number
  activeSprintCount: number
  ticketCount: number
  ticketsWithDue: number
}) {
  const stats = [
    { label: "Sprints", value: props.sprintCount },
    { label: "Active", value: props.activeSprintCount },
    { label: "Tickets", value: props.ticketCount },
    { label: "With due date", value: props.ticketsWithDue },
  ]

  return (
    <header className="bg-surface-1 overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">
            Roadmap
          </p>
          <h1 className="mt-1 text-xl font-medium text-fg tracking-tight">Timeline</h1>
          <p className="mt-1.5 text-sm text-fg-muted max-w-lg">
            Three Monday-aligned 2-week sprints: current, next, and later. Plan work into future
            sprints; only the active sprint appears on the board.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            href={`${props.baseHref}/board`}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-surface px-3 text-[11px] font-medium text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
          >
            <Inbox className="h-3.5 w-3.5" strokeWidth={1.75} />
            Board
          </Link>
          <Link
            href={`${props.baseHref}/backlog`}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-surface px-3 text-[11px] font-medium text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
          >
            <ListTodo className="h-3.5 w-3.5" strokeWidth={1.75} />
            Backlog
          </Link>
          <Link
            href={`${props.baseHref}/summary`}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-surface px-3 text-[11px] font-medium text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
          >
            <Columns3 className="h-3.5 w-3.5" strokeWidth={1.75} />
            Summary
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {stats.map((s) => (
          <div key={s.label} className="px-5 py-3.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
              {s.label}
            </p>
            <p className="mt-0.5 text-lg font-medium text-fg tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="px-5 py-2.5 border-t border-border flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-fg-subtle">
        <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        <span>Vertical line = today · drag the chart horizontally to pan dates</span>
      </div>
    </header>
  )
}
