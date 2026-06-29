"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, X } from "lucide-react"

type SearchResult = {
  tickets: Array<{ id: string; key: string; title: string; href: string; workspaceName: string }>
  messages: Array<{ id: string; preview: string; href: string; workspaceName: string }>
  members: Array<{
    userId: string
    name: string | null
    email: string | null
    href: string
    workspaceName: string
  }>
}

function slugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/workspace\/([^/]+)/)
  return m ? m[1] : null
}

/** Mobile / icon-button counterpart to `GlobalSearch` — opens a focused modal. */
export function GlobalSearchModal({ onClose }: { onClose: () => void }) {
  const pathname = usePathname()
  const slug = slugFromPath(pathname)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [q, setQ] = useState("")
  const [data, setData] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    inputRef.current?.focus()
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onEsc)
    return () => document.removeEventListener("keydown", onEsc)
  }, [onClose])

  const runSearch = useCallback(
    async (query: string) => {
      abortRef.current?.abort()
      if (query.length < 2) {
        setData(null)
        setLoading(false)
        return
      }
      const ac = new AbortController()
      abortRef.current = ac
      setLoading(true)
      try {
        const params = new URLSearchParams({ q: query })
        if (slug) params.set("workspaceSlug", slug)
        const res = await fetch(`/api/search?${params}`, { signal: ac.signal })
        if (res.ok) setData((await res.json()) as SearchResult)
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return
      } finally {
        if (!ac.signal.aborted) setLoading(false)
      }
    },
    [slug]
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void runSearch(q), 280)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [q, runSearch])

  const hasResults =
    data &&
    (data.tickets.length > 0 || data.messages.length > 0 || data.members.length > 0)

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-16"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-lg border border-border bg-surface-1 shadow-xl">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="h-4 w-4 text-fg-subtle" strokeWidth={1.75} aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tickets, chat, people…"
            className="flex-1 min-w-0 bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-fg-subtle hover:text-fg hover:bg-surface-2"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="max-h-[min(70vh,500px)] overflow-y-auto p-2 text-sm">
          {q.length < 2 ? (
            <p className="px-3 py-6 text-center text-xs text-fg-subtle">
              Type at least 2 characters.
            </p>
          ) : loading ? (
            <p className="px-3 py-6 text-center text-xs text-fg-subtle">Searching…</p>
          ) : !hasResults ? (
            <p className="px-3 py-6 text-center text-xs text-fg-subtle">No results.</p>
          ) : (
            <>
              {data?.tickets.length ? (
                <Group title="Tickets">
                  {data.tickets.map((t) => (
                    <li key={t.id}>
                      <Link
                        href={t.href}
                        onClick={onClose}
                        className="block px-3 py-2 rounded-md hover:bg-surface-2"
                      >
                        <span className="font-mono text-xs text-fg-muted">{t.key}</span>{" "}
                        <span className="text-fg">{t.title}</span>
                        <span className="block text-[11px] text-fg-subtle truncate">
                          {t.workspaceName}
                        </span>
                      </Link>
                    </li>
                  ))}
                </Group>
              ) : null}
              {data?.messages.length ? (
                <Group title="Chat">
                  {data.messages.map((m) => (
                    <li key={m.id}>
                      <Link
                        href={m.href}
                        onClick={onClose}
                        className="block px-3 py-2 rounded-md hover:bg-surface-2 truncate"
                      >
                        {m.preview}
                      </Link>
                    </li>
                  ))}
                </Group>
              ) : null}
              {data?.members.length ? (
                <Group title="People">
                  {data.members.map((m) => (
                    <li key={m.userId}>
                      <Link
                        href={m.href}
                        onClick={onClose}
                        className="block px-3 py-2 rounded-md hover:bg-surface-2"
                      >
                        {m.name ?? m.email}
                      </Link>
                    </li>
                  ))}
                </Group>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-fg-subtle">{title}</p>
      <ul>{children}</ul>
    </div>
  )
}
