"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const RECENT_KEY = "monarch-recent-workspaces"
const RECENT_MAX = 5

type WorkspaceListItem = {
  id: string
  slug: string
  name: string
  role: string
}

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is string => typeof v === "string").slice(0, RECENT_MAX)
  } catch {
    return []
  }
}

function pushRecent(slug: string) {
  try {
    const existing = readRecent().filter((s) => s !== slug)
    const next = [slug, ...existing].slice(0, RECENT_MAX)
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

export function WorkspaceSwitcher() {
  const pathname = usePathname()
  const currentSlug = useMemo(() => {
    const m = pathname.match(/^\/workspace\/([^/]+)/)
    return m ? m[1] : null
  }, [pathname])

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<WorkspaceListItem[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (currentSlug) pushRecent(currentSlug)
  }, [currentSlug])

  useEffect(() => {
    if (!open) return
    setRecent(readRecent())
    let cancelled = false
    setLoading(true)
    void fetch("/api/me/workspaces", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setItems(Array.isArray(data.workspaces) ? data.workspaces : [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || buttonRef.current?.contains(t)) return
      setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onEsc)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("keydown", onEsc)
    }
  }, [open])

  const current = items.find((w) => w.slug === currentSlug) ?? null
  const recentItems = recent
    .map((slug) => items.find((w) => w.slug === slug))
    .filter((w): w is WorkspaceListItem => Boolean(w) && w!.slug !== currentSlug)
    .slice(0, 3)
  const otherItems = items.filter(
    (w) => w.slug !== currentSlug && !recentItems.some((r) => r.slug === w.slug)
  )

  if (!currentSlug) return null

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 px-2 rounded-sm border border-border bg-surface-1 text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors max-w-[200px]",
          open && "text-fg bg-surface-2"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-border bg-surface text-[10px] font-semibold text-fg">
          {(current?.name ?? currentSlug).slice(0, 1).toUpperCase()}
        </span>
        <span className="truncate text-xs font-medium text-fg">
          {current?.name ?? currentSlug}
        </span>
        <ChevronDown className="h-3 w-3 shrink-0 text-fg-subtle" strokeWidth={2} aria-hidden />
      </button>

      {open ? (
        <div
          ref={panelRef}
          role="menu"
          className="absolute left-0 top-[calc(100%+6px)] z-[60] w-[min(100vw-1.5rem,18rem)] overflow-hidden rounded-lg border border-border bg-surface-1 shadow-lg"
        >
          {loading && items.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-fg-muted">Loading workspaces…</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-fg-muted">
              You aren&apos;t in any workspaces yet.
            </div>
          ) : (
            <>
              {current ? (
                <div className="border-b border-border px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-fg-subtle">Current</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-[11px] font-semibold text-fg">
                      {current.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg">{current.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-fg-subtle">
                        {current.role.toLowerCase()}
                      </p>
                    </div>
                    <Check className="h-3.5 w-3.5 text-fg-subtle ml-auto" strokeWidth={1.75} />
                  </div>
                </div>
              ) : null}

              <div className="max-h-[280px] overflow-y-auto">
                {recentItems.length > 0 ? (
                  <div className="border-b border-border py-1.5">
                    <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
                      Recent
                    </p>
                    {recentItems.map((w) => (
                      <SwitcherRow key={w.id} ws={w} onClick={() => setOpen(false)} />
                    ))}
                  </div>
                ) : null}

                {otherItems.length > 0 ? (
                  <div className="py-1.5">
                    {recentItems.length > 0 ? (
                      <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
                        All workspaces
                      </p>
                    ) : null}
                    {otherItems.map((w) => (
                      <SwitcherRow key={w.id} ws={w} onClick={() => setOpen(false)} />
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="border-t border-border px-2 py-2 flex items-center justify-between">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="text-[11px] text-fg-muted hover:text-fg px-2 py-1"
                >
                  See all workspaces
                </Link>
                <Link
                  href="/apply"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-1 text-[11px] text-fg-muted hover:text-fg px-2 py-1"
                >
                  <Plus className="h-3 w-3" strokeWidth={2} />
                  Request workspace
                </Link>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}

function SwitcherRow({ ws, onClick }: { ws: WorkspaceListItem; onClick: () => void }) {
  return (
    <Link
      href={`/workspace/${ws.slug}/summary`}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-2 transition-colors"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-[10px] font-semibold text-fg">
        {ws.name.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-fg">{ws.name}</p>
        <p className="text-[10px] uppercase tracking-widest text-fg-subtle">
          {ws.role.toLowerCase()}
        </p>
      </div>
    </Link>
  )
}
