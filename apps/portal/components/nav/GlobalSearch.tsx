"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search } from "lucide-react"

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

export function GlobalSearch(props: { className?: string }) {
  const pathname = usePathname()
  const slug = slugFromPath(pathname)
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SearchResult | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  const hasResults =
    data &&
    (data.tickets.length > 0 || data.messages.length > 0 || data.members.length > 0)

  return (
    <div ref={wrapRef} className={`relative ${props.className ?? ""}`}>
      <div className="flex items-center gap-2 h-8 w-44 xl:w-52 border border-border bg-surface px-2.5 rounded-sm">
        <Search className="h-3.5 w-3.5 text-fg-subtle shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <input
          className="w-full min-w-0 bg-transparent text-xs text-fg placeholder:text-fg-subtle focus:outline-none"
          placeholder="Search tickets, chat…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          aria-expanded={open}
          aria-autocomplete="list"
        />
      </div>

      {open && q.length >= 2 ? (
        <div className="absolute right-0 top-full mt-1 w-80 max-h-[70vh] overflow-y-auto rounded-md border border-border bg-surface-1 shadow-lg z-[60] p-2 text-xs">
          {loading ? <p className="px-2 py-3 text-fg-subtle">Searching…</p> : null}
          {!loading && !hasResults ? (
            <p className="px-2 py-3 text-fg-subtle">No results</p>
          ) : null}
          {data?.tickets.length ? (
            <div className="mb-2">
              <p className="px-2 py-1 font-display text-[10px] uppercase tracking-widest text-fg-subtle">
                Tickets
              </p>
              <ul>
                {data.tickets.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={t.href}
                      className="block px-2 py-1.5 rounded-sm hover:bg-surface-2"
                      onClick={() => setOpen(false)}
                    >
                      <span className="font-mono text-fg-muted">{t.key}</span> {t.title}
                      <span className="block text-fg-subtle truncate">{t.workspaceName}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {data?.messages.length ? (
            <div className="mb-2">
              <p className="px-2 py-1 font-display text-[10px] uppercase tracking-widest text-fg-subtle">
                Chat
              </p>
              <ul>
                {data.messages.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={m.href}
                      className="block px-2 py-1.5 rounded-sm hover:bg-surface-2 truncate"
                      onClick={() => setOpen(false)}
                    >
                      {m.preview}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {data?.members.length ? (
            <div>
              <p className="px-2 py-1 font-display text-[10px] uppercase tracking-widest text-fg-subtle">
                People
              </p>
              <ul>
                {data.members.map((m) => (
                  <li key={m.userId}>
                    <Link
                      href={m.href}
                      className="block px-2 py-1.5 rounded-sm hover:bg-surface-2"
                      onClick={() => setOpen(false)}
                    >
                      {m.name ?? m.email}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
