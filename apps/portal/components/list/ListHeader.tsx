import Link from "next/link"
import { Columns3, GanttChart, Inbox, ListTodo } from "lucide-react"

export function ListHeader(props: {
  baseHref: string
  total: number
  openCount: number
  unassignedCount: number
  overdueCount: number
}) {
  const stats = [
    { label: "Total", value: props.total },
    { label: "Open", value: props.openCount },
    { label: "Unassigned", value: props.unassignedCount },
    { label: "Overdue", value: props.overdueCount },
  ]

  return (
    <header className="bg-surface-1 overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">
            Workspace index
          </p>
          <h1 className="mt-1 text-xl font-medium text-fg tracking-tight">All work</h1>
          <p className="mt-1.5 text-sm text-fg-muted max-w-lg">
            All tickets in this workspace — sortable columns, quick search, and inline create.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            href={`${props.baseHref}/request`}
            className="inline-flex h-8 items-center border border-fg px-3 text-[11px] font-medium uppercase tracking-widest text-fg hover:opacity-90 transition-opacity"
          >
            Request work
          </Link>
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
            href={`${props.baseHref}/timeline`}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-surface px-3 text-[11px] font-medium text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
          >
            <GanttChart className="h-3.5 w-3.5" strokeWidth={1.75} />
            Timeline
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
    </header>
  )
}
