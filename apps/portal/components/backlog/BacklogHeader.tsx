import Link from "next/link"
import { Columns3, GanttChart, Inbox, Layers } from "lucide-react"

export function BacklogHeader(props: {
  baseHref: string
  total: number
  workflowCount: number
  requestCount: number
  inSprintCount: number
  epicCount: number
}) {
  const stats = [
    { label: "Total", value: props.total },
    { label: "Workflow", value: props.workflowCount },
    { label: "Requests", value: props.requestCount },
    { label: "Scheduled", value: props.inSprintCount },
    { label: "Epics", value: props.epicCount },
  ]

  return (
    <header className="bg-surface-1 overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">
            Product backlog
          </p>
          <h1 className="mt-1 text-xl font-medium text-fg tracking-tight">Backlog</h1>
          <p className="mt-1.5 text-sm text-fg-muted max-w-lg">
            Groom work not yet in a sprint. Assign to active, next, or later sprint — only the active
            sprint shows on the board. Epics group tickets; they are not board cards.
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

      <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {stats.map((s) => (
          <div key={s.label} className="px-5 py-3.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
              {s.label}
            </p>
            <p className="mt-0.5 text-lg font-medium text-fg tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {props.epicCount > 0 ? (
        <div className="px-5 py-2.5 border-t border-border flex items-center gap-2 text-[11px] text-fg-muted">
          <Layers className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {props.epicCount} epic{props.epicCount === 1 ? "" : "s"} — link tickets when creating backlog items
        </div>
      ) : null}
    </header>
  )
}
