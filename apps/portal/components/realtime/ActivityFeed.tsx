"use client"

import { useEffect, useMemo, useState } from "react"

type ActivityEvent = {
  id: string
  createdAt: string
  source: string
  type: string
  body: string
}

export function ActivityFeed(props: { workspaceId: string; jobId?: string; taskId?: string; ticketId?: string }) {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [connected, setConnected] = useState(false)

  const url = useMemo(() => {
    const sp = new URLSearchParams({ workspaceId: props.workspaceId })
    if (props.jobId) sp.set("jobId", props.jobId)
    if (props.taskId) sp.set("taskId", props.taskId)
    if (props.ticketId) sp.set("ticketId", props.ticketId)
    return `/api/realtime/activity?${sp.toString()}`
  }, [props.workspaceId, props.jobId, props.taskId, props.ticketId])

  useEffect(() => {
    const es = new EventSource(url)
    setConnected(false)
    es.addEventListener("open", () => setConnected(true))
    es.addEventListener("error", () => setConnected(false))
    es.addEventListener("activity", (msg) => {
      try {
        const data = JSON.parse((msg as MessageEvent).data) as ActivityEvent
        setEvents((prev) => {
          if (prev.some((e) => e.id === data.id)) return prev
          return [...prev, data].slice(-200)
        })
      } catch {
        // ignore
      }
    })
    return () => es.close()
  }, [url])

  return (
    <div className="space-y-3">
      <p className="text-xs text-fg-muted">{connected ? "Live" : "Connecting…"}</p>
      <div className="space-y-2">
        {events.length === 0 ? (
          <p className="text-sm text-fg-muted">No activity yet.</p>
        ) : (
          events.map((e) => (
            <div key={e.id} className="text-sm text-fg-muted">
              <span className="text-xs text-fg-subtle">{new Date(e.createdAt).toLocaleString()} • </span>
              {e.body}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

