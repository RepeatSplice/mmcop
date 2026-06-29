"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { ChevronRight, LayoutGrid, UserPlus } from "lucide-react"
import { pageGutterClass } from "@/components/layout/PageShell"
import { cn } from "@/lib/utils"
import { SidebarNavIcon } from "@/components/nav/sidebar-icons"
import type { WorkspaceTab } from "@/components/nav/workspace-tabs"
import { useRouter } from "next/navigation"

function WorkspaceTabLink({
  tab,
  active,
  badge,
  onWarm,
}: {
  tab: WorkspaceTab
  active: boolean
  badge?: number
  onWarm?: () => void
}) {
  return (
    <Link
      href={tab.href}
      prefetch
      onMouseEnter={onWarm}
      onFocus={onWarm}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium transition-colors whitespace-nowrap",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fg/25",
        active
          ? "bg-fg text-surface shadow-sm"
          : "text-fg-muted hover:text-fg hover:bg-surface-2/90"
      )}
    >
      <span className="inline-flex shrink-0">
        <SidebarNavIcon
          kind={tab.icon}
          className={cn("h-4 w-4", active ? "text-surface" : "text-fg-subtle")}
        />
      </span>
      {tab.label}
      {badge != null && badge > 0 ? (
        <span className="ml-1 inline-flex min-w-[1.1rem] h-4 items-center justify-center rounded-sm bg-red-500/90 px-1 text-[9px] font-medium text-white tabular-nums">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  )
}

export function WorkspaceProjectNav(props: {
  workspaceId?: string
  workspaceName: string
  baseHref: string
  tabs: WorkspaceTab[]
  breadcrumbRoot?: { label: string; href: string }
  showMembersAction?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [chatUnread, setChatUnread] = useState(0)

  function prefetchTab(href: string) {
    router.prefetch(href)
  }

  useEffect(() => {
    if (!props.workspaceId) return
    let cancelled = false
    async function load() {
      const res = await fetch(`/api/workspaces/${props.workspaceId}/chat/unread-count`)
      if (!res.ok || cancelled) return
      const data = (await res.json()) as { count: number }
      if (!cancelled) setChatUnread(data.count)
    }
    load()
    const t = setInterval(load, 12000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [props.workspaceId])
  const firstLetter = props.workspaceName.slice(0, 1).toUpperCase()
  const root = props.breadcrumbRoot ?? { label: "Workspaces", href: "/" }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <header className="border-b border-border bg-surface/95 backdrop-blur-sm supports-[backdrop-filter]:bg-surface/90">
      {/* Top bar */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 h-11 border-b border-border/80",
          pageGutterClass
        )}
      >
        <nav aria-label="Breadcrumbs" className="min-w-0 flex items-center gap-2">
          <Link
            href={root.href}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-fg-subtle hover:text-fg transition-colors shrink-0"
          >
            <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden sm:inline">{root.label}</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-fg-subtle/60 shrink-0" strokeWidth={2} aria-hidden="true" />
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface-1 text-[11px] font-semibold text-fg"
              aria-hidden="true"
            >
              {firstLetter}
            </span>
            <span className="truncate text-sm font-medium text-fg">{props.workspaceName}</span>
          </div>
        </nav>

        <div className="flex items-center gap-1.5 shrink-0">
          {props.showMembersAction !== false ? (
            <Link
              href={`${props.baseHref}/settings/members`}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[11px] font-medium text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden md:inline">Add people</span>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Tab rail */}
      <nav aria-label="Space views" className={cn(pageGutterClass, "py-2.5")}>
        <div className="overflow-x-auto overscroll-x-contain -mx-1 px-1 pb-0.5">
          <div
            className="inline-flex items-center gap-0.5 p-1 rounded-lg border border-border bg-surface-1 min-w-min"
            role="tablist"
          >
            {props.tabs.map((tab) => (
              <WorkspaceTabLink
                key={tab.href}
                tab={tab}
                active={isActive(tab.href)}
                badge={tab.label === "Chat" ? chatUnread : undefined}
                onWarm={() => prefetchTab(tab.href)}
              />
            ))}
          </div>
        </div>
      </nav>
    </header>
  )
}
