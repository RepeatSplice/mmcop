"use client"

import Link from "next/link"
import { ArrowUpRight, Layers } from "lucide-react"

export type BacklogEpic = {
  id: string
  key: string
  title: string
  childCount: number
}

export function BacklogEpicsPanel(props: {
  epics: BacklogEpic[]
  workspaceSlug: string
}) {
  return (
    <section className="border border-border bg-surface-1 overflow-hidden rounded-md">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Layers className="h-4 w-4 text-fg-subtle" strokeWidth={1.75} />
        <div>
          <h2 className="text-sm font-medium text-fg">Epics</h2>
          <p className="text-[11px] text-fg-muted">Groups for tickets — not on the sprint board.</p>
        </div>
      </div>

      {props.epics.length === 0 ? (
        <p className="px-4 py-6 text-xs text-fg-muted">No epics yet. Create one below to group related tickets.</p>
      ) : (
        <ul className="divide-y divide-border max-h-[220px] overflow-y-auto">
          {props.epics.map((e) => (
            <li key={e.id}>
              <Link
                href={`/workspace/${props.workspaceSlug}/tickets/${e.key}`}
                className="flex items-start justify-between gap-2 px-4 py-3 hover:bg-surface-2 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-fg tabular-nums">{e.key}</p>
                  <p className="text-sm text-fg truncate group-hover:underline">{e.title}</p>
                  <p className="mt-0.5 text-[11px] text-fg-subtle">
                    {e.childCount} linked ticket{e.childCount === 1 ? "" : "s"}
                  </p>
                </div>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-fg-subtle opacity-0 group-hover:opacity-100 transition-opacity"
                  strokeWidth={1.75}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
