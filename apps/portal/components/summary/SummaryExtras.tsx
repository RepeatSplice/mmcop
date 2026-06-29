import Link from "next/link"
import { Server, Calendar, Pin, AlertTriangle } from "lucide-react"
import { ServerControlsLauncher } from "@/components/summary/ServerControlsLauncher"

export type ServerSnapshot = {
  online: boolean
  playerCount: number
  maxPlayers: number
  mapName: string | null
  version: string | null
  lastSeenAt: Date | null
  displayName: string | null
}

export function ServerStatusCard(props: {
  server: ServerSnapshot | null
  baseHref: string
  isStaff: boolean
  workspaceId?: string
  canAdmin?: boolean
}) {
  const s = props.server
  if (!s) {
    return (
      <section className="px-4 sm:px-5 py-5 bg-surface-1 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-sm font-medium text-fg flex items-center gap-2">
            <Server className="h-4 w-4" strokeWidth={1.75} />
            Server status
          </h2>
          {props.canAdmin && props.workspaceId ? (
            <ServerControlsLauncher workspaceId={props.workspaceId} initial={null} />
          ) : null}
        </div>
        <p className="mt-2 text-sm text-fg-muted">
          No monitor configured yet.
          {props.canAdmin ? (
            <> Use <span className="underline">Manage</span> to set the status manually.</>
          ) : null}
        </p>
      </section>
    )
  }

  return (
    <section className="px-4 sm:px-5 py-5 bg-surface-1 border-b border-border">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-fg flex items-center gap-2">
            <Server className="h-4 w-4" strokeWidth={1.75} />
            {s.displayName ?? "Game server"}
          </h2>
          <p className="mt-1 text-xs text-fg-muted">
            {s.lastSeenAt
              ? `Last seen ${s.lastSeenAt.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}`
              : "No heartbeat yet"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`shrink-0 text-[11px] uppercase tracking-wider px-2 py-1 rounded-sm border ${
              s.online ? "border-emerald-500/40 text-emerald-300" : "border-red-500/40 text-red-300"
            }`}
          >
            {s.online ? "Online" : "Offline"}
          </span>
          {props.canAdmin && props.workspaceId ? (
            <ServerControlsLauncher
              workspaceId={props.workspaceId}
              initial={{
                online: s.online,
                playerCount: s.playerCount,
                maxPlayers: s.maxPlayers,
              }}
            />
          ) : null}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-fg-subtle">Players</p>
          <p className="mt-0.5 font-medium tabular-nums">
            {s.playerCount}
            {s.maxPlayers > 0 ? ` / ${s.maxPlayers}` : ""}
          </p>
        </div>
        {s.mapName ? (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-fg-subtle">Map</p>
            <p className="mt-0.5 font-medium truncate">{s.mapName}</p>
          </div>
        ) : null}
        {s.version ? (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-fg-subtle">Build</p>
            <p className="mt-0.5 font-medium truncate">{s.version}</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function PinnedUpdateBlock(props: { body: string | null }) {
  if (!props.body) return null
  return (
    <section className="px-4 sm:px-5 py-4 bg-amber-500/5 border-b border-amber-500/20">
      <h2 className="text-[11px] font-display uppercase tracking-widest text-amber-200/90 flex items-center gap-2">
        <Pin className="h-3.5 w-3.5" />
        Pinned update
      </h2>
      <p className="mt-2 text-sm text-fg leading-relaxed whitespace-pre-wrap">{props.body}</p>
    </section>
  )
}

export function SprintHealthBanner(props: {
  atRisk: boolean
  hoursPct: number | null
  daysLeft: number
  doneInSprint: number
  totalInSprint: number
}) {
  if (!props.atRisk && props.hoursPct == null) return null
  return (
    <section
      className={`px-4 sm:px-5 py-3 border-b ${
        props.atRisk ? "bg-red-500/10 border-red-500/25" : "bg-surface-1 border-border"
      }`}
    >
      <p className="text-sm flex items-start gap-2">
        {props.atRisk ? (
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
        ) : null}
        <span>
          {props.atRisk ? (
            <strong className="text-red-200">Sprint at risk:</strong>
          ) : (
            <span className="text-fg-muted">Sprint health:</span>
          )}{" "}
          {props.daysLeft} days left · {props.doneInSprint}/{props.totalInSprint} tickets done
          {props.hoursPct != null ? ` · ${Math.round(props.hoursPct)}% hours used` : ""}
        </span>
      </p>
    </section>
  )
}

export function CalBookingLink(props: { url: string | null }) {
  if (!props.url) return null
  return (
    <Link
      href={props.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-9 items-center gap-2 rounded-sm border border-border bg-surface px-4 text-[11px] font-medium uppercase tracking-[0.12em] text-fg hover:bg-surface-2 transition-colors"
    >
      <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
      Book sprint review
    </Link>
  )
}

export function EpicProgressList(props: {
  epics: Array<{ key: string; title: string; done: number; total: number }>
  baseHref: string
}) {
  if (props.epics.length === 0) return null
  return (
    <section className="px-4 sm:px-5 py-5 bg-surface-1 border-t border-border">
      <h2 className="text-sm font-medium text-fg mb-3">Epic progress</h2>
      <ul className="space-y-3">
        {props.epics.map((e) => {
          const pct = e.total > 0 ? Math.round((e.done / e.total) * 100) : 0
          return (
            <li key={e.key}>
              <Link
                href={`${props.baseHref}/tickets/${e.key}`}
                className="text-sm font-medium text-fg hover:underline"
              >
                {e.key}: {e.title}
              </Link>
              <div className="mt-1.5 h-1 w-full rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full bg-fg/70 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-fg-subtle">
                {e.done}/{e.total} done ({pct}%)
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
