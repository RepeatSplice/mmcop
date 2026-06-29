"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { formatActivityEvent, type ActivityDisplay } from "@/lib/format-activity"
import { cn } from "@/lib/utils"

type ActivityRow = {
  id: string
  createdAt: string
  type: string
  body: string
  ticket?: { key: string; title: string | null } | null
  actor?: { name: string | null; email: string | null } | null
}

function ActivityItem({
  event,
  baseHref,
  display,
}: {
  event: ActivityRow
  baseHref: string
  display: ActivityDisplay
}) {
  const when = new Date(event.createdAt).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  })
  const actor =
    event.actor?.name?.trim() ||
    event.actor?.email?.split("@")[0] ||
    null
  const href = display.ticketKey ? `${baseHref}/tickets/${display.ticketKey}` : undefined

  return (
    <li className="group flex gap-3 py-3 border-b border-border last:border-0">
      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fg/30 group-hover:bg-fg transition-colors" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <time className="text-[11px] text-fg-subtle tabular-nums">{when}</time>
          {actor ? (
            <span className="text-[11px] text-fg-subtle">· {actor}</span>
          ) : null}
        </div>
        {href ? (
          <Link href={href} className="mt-1 block text-sm text-fg hover:underline font-medium">
            {display.headline}
          </Link>
        ) : (
          <p className="mt-1 text-sm text-fg font-medium">{display.headline}</p>
        )}
        {display.detail ? (
          <p className="mt-0.5 text-xs text-fg-muted leading-relaxed">{display.detail}</p>
        ) : null}
      </div>
    </li>
  )
}

export function SummaryActivityFeed(props: {
  workspaceId: string
  baseHref: string
  initialEvents: ActivityRow[]
}) {
  const [events, setEvents] = useState<ActivityRow[]>(props.initialEvents)
  const [live, setLive] = useState(false)

  const url = useMemo(() => {
    const sp = new URLSearchParams({ workspaceId: props.workspaceId })
    return `/api/realtime/activity?${sp.toString()}`
  }, [props.workspaceId])

  useEffect(() => {
    const es = new EventSource(url)
    es.addEventListener("open", () => setLive(true))
    es.addEventListener("error", () => setLive(false))
    es.addEventListener("activity", (msg) => {
      try {
        const data = JSON.parse((msg as MessageEvent).data) as ActivityRow
        setEvents((prev) => {
          if (prev.some((e) => e.id === data.id)) return prev
          return [data, ...prev].slice(0, 20)
        })
      } catch {
        // ignore
      }
    })
    return () => es.close()
  }, [url])

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-[11px] text-fg-subtle uppercase tracking-[0.12em]">Recent activity</p>
        <span
          className={cn(
            "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm border",
            live
              ? "border-fg/20 text-fg"
              : "border-border text-fg-subtle"
          )}
        >
          {live ? "Live" : "Offline"}
        </span>
      </div>
      {events.length === 0 ? (
        <p className="py-8 text-sm text-fg-muted text-center">No activity yet.</p>
      ) : (
        <ul>
          {events.map((e) => (
            <ActivityItem
              key={e.id}
              event={e}
              baseHref={props.baseHref}
              display={formatActivityEvent({
                type: e.type,
                body: e.body,
                ticket: e.ticket,
              })}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
