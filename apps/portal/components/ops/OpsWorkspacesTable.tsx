"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ExternalLink, Search, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { DeleteWorkspaceButton } from "@/components/ops/DeleteWorkspaceButton"
import { OpsEmpty } from "@/components/ops/OpsSection"

export type OpsWorkspaceRow = {
  id: string
  name: string
  slug: string
  active: boolean
  createdAt: string
  memberCount: number
  ticketCount: number
  taskCount: number
  jobCount: number
  discordProvisioned: boolean
}

export function OpsWorkspacesTable(props: {
  workspaces: OpsWorkspaceRow[]
  canDelete: boolean
}) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return props.workspaces
    return props.workspaces.filter(
      (w) => w.name.toLowerCase().includes(q) || w.slug.toLowerCase().includes(q)
    )
  }, [props.workspaces, query])

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
          strokeWidth={1.5}
        />
        <input
          type="search"
          placeholder="Search by name or slug…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:border-monarch-500 focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <OpsEmpty>
          {props.workspaces.length === 0 ? "No workspaces yet." : "No workspaces match your search."}
        </OpsEmpty>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface font-display text-[10px] uppercase tracking-widest text-fg-subtle">
                <th className="px-4 py-3 font-normal">Workspace</th>
                <th className="px-4 py-3 font-normal">Members</th>
                <th className="px-4 py-3 font-normal">Tickets</th>
                <th className="px-4 py-3 font-normal">Discord</th>
                <th className="px-4 py-3 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface-1">
              {filtered.map((w) => (
                <tr key={w.id} className="group hover:bg-surface-2/80 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/ops/workspaces/${w.id}`} className="block min-w-0">
                      <p className="font-medium text-fg truncate">{w.name}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-fg-muted">/{w.slug}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-fg-muted tabular-nums">{w.memberCount}</td>
                  <td className="px-4 py-3 text-fg-muted tabular-nums">{w.ticketCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-display uppercase tracking-widest",
                        w.discordProvisioned
                          ? "border-emerald-500/30 text-emerald-300"
                          : "border-border text-fg-subtle"
                      )}
                    >
                      {w.discordProvisioned ? "Live" : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/workspace/${w.slug}/board`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-fg-muted hover:border-border hover:bg-surface hover:text-fg"
                        title="Open client board"
                      >
                        <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </Link>
                      <Link
                        href={`/ops/workspaces/${w.id}`}
                        className="inline-flex h-8 items-center rounded-md border border-border px-2.5 text-[10px] font-display uppercase tracking-widest text-fg-muted hover:bg-surface hover:text-fg"
                      >
                        Manage
                      </Link>
                      {props.canDelete ? (
                        <details className="relative">
                          <summary
                            className="inline-flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-md border border-transparent text-fg-muted hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 [&::-webkit-details-marker]:hidden"
                            title="Delete workspace"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </summary>
                          <div className="absolute right-0 z-20 mt-2 w-[min(100vw-2rem,22rem)] rounded-md border border-border bg-surface-1 p-3 shadow-lg">
                            <DeleteWorkspaceButton
                              workspaceId={w.id}
                              workspaceName={w.name}
                              workspaceSlug={w.slug}
                            />
                          </div>
                        </details>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
