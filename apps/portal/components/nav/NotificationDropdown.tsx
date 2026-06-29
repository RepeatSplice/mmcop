"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { Bell, CheckCheck, Loader2, MessageSquare, AtSign } from "lucide-react"
import { cn } from "@/lib/utils"

type NotificationItem = {
  id: string
  type: string
  title: string
  body: string | null
  url: string | null
  readAt: string | null
  createdAt: string
  workspaceName: string | null
  workspaceSlug: string | null
}

function formatWhen(iso: string) {
  try {
    const d = new Date(iso)
    const now = Date.now()
    const diff = now - d.getTime()
    if (diff < 60_000) return "Just now"
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  } catch {
    return ""
  }
}

function typeIcon(type: string) {
  if (type.startsWith("chat.mention")) return AtSign
  if (type.startsWith("chat.")) return MessageSquare
  return Bell
}

export function NotificationDropdown({
  unreadCount,
  onCountChange,
}: {
  unreadCount: number
  onCountChange: (count: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications?limit=25")
      if (!res.ok) return
      const data = (await res.json()) as {
        notifications: NotificationItem[]
        unreadCount: number
      }
      setItems(data.notifications)
      onCountChange(data.unreadCount)
    } finally {
      setLoading(false)
    }
  }, [onCountChange])

  useEffect(() => {
    if (!open) return
    void load()
  }, [open, load])

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || buttonRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [open])

  async function markRead(id: string) {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: "POST",
      headers: { Accept: "application/json" },
    })
    if (!res.ok) return
    const data = (await res.json()) as { unreadCount: number }
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    )
    onCountChange(data.unreadCount)
  }

  async function markAllRead() {
    const res = await fetch("/api/notifications/read-all", { method: "POST" })
    if (!res.ok) return
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
    onCountChange(0)
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative h-9 w-9 inline-flex items-center justify-center rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fg/30",
          open
            ? "border-border bg-surface-2 text-fg"
            : "border-transparent text-fg-muted hover:text-fg hover:bg-surface-2"
        )}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 text-[9px] leading-none bg-fg text-surface flex items-center justify-center font-medium rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          ref={panelRef}
          className="absolute right-0 top-[calc(100%+6px)] z-[60] w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-lg border border-border bg-surface-1 shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div>
              <p className="font-display text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
                Notifications
              </p>
              {unreadCount > 0 ? (
                <p className="mt-0.5 text-[11px] text-fg-muted">{unreadCount} unread</p>
              ) : null}
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-display uppercase tracking-widest text-fg-muted hover:bg-surface-2 hover:text-fg"
              >
                <CheckCheck className="h-3 w-3" strokeWidth={1.5} />
                All read
              </button>
            ) : null}
          </div>

          <div className="max-h-[min(60vh,420px)] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-fg-muted">
                <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-fg-muted">You&apos;re all caught up.</p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((n) => {
                  const Icon = typeIcon(n.type)
                  const unread = !n.readAt
                  const inner = (
                    <div
                      className={cn(
                        "flex gap-3 px-4 py-3 transition-colors",
                        unread ? "bg-surface" : "bg-surface-1",
                        n.url && "hover:bg-surface-2"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
                          unread ? "border-fg/20 bg-fg/5" : "border-border bg-surface"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 text-fg-muted" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-fg leading-snug">{n.title}</p>
                        {n.body ? (
                          <p className="mt-1 text-xs text-fg-muted line-clamp-2">{n.body}</p>
                        ) : null}
                        <p className="mt-1.5 text-[10px] text-fg-subtle tabular-nums">
                          {formatWhen(n.createdAt)}
                          {n.workspaceName ? ` · ${n.workspaceName}` : ""}
                        </p>
                      </div>
                      {unread ? (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-fg" aria-hidden />
                      ) : null}
                    </div>
                  )

                  return (
                    <li key={n.id}>
                      {n.url ? (
                        <Link
                          href={n.url}
                          onClick={() => {
                            if (unread) void markRead(n.id)
                            setOpen(false)
                          }}
                        >
                          {inner}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() => unread && void markRead(n.id)}
                        >
                          {inner}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          <div className="border-t border-border px-3 py-2">
            <Link
              href="/notifications"
              className="text-[11px] text-fg-muted hover:text-fg"
              onClick={() => setOpen(false)}
            >
              View all notifications →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
