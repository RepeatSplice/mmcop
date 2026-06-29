"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { SidebarNavIcon } from "@/components/nav/sidebar-icons"
import {
  buildWorkspaceSidebarSections,
  type WorkspaceSidebarItem,
  type WorkspaceSidebarSection,
} from "@/components/nav/workspace-tabs"

const COLLAPSE_STORAGE_KEY = "monarch-ws-sidebar-collapsed"

function useCollapsed() {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const raw = window.localStorage.getItem(COLLAPSE_STORAGE_KEY)
      if (raw === "1") setCollapsed(true)
    } catch {
      /* ignore */
    }
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0")
      } catch {
        /* ignore */
      }
      return next
    })
  }

  return { collapsed: mounted ? collapsed : false, mounted, toggle }
}

function SidebarLink({
  item,
  active,
  collapsed,
  badge,
  onWarm,
}: {
  item: WorkspaceSidebarItem
  active: boolean
  collapsed: boolean
  badge?: number
  onWarm: () => void
}) {
  return (
    <Link
      href={item.href}
      prefetch
      onMouseEnter={onWarm}
      onFocus={onWarm}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md text-[13px] font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fg/25",
        collapsed ? "h-9 w-9 justify-center" : "h-8 px-2.5",
        active
          ? "bg-fg text-surface shadow-sm"
          : "text-fg-muted hover:text-fg hover:bg-surface-2/90"
      )}
    >
      <span className="inline-flex shrink-0">
        <SidebarNavIcon
          kind={item.icon}
          className={cn("h-4 w-4", active ? "text-surface" : "text-fg-subtle group-hover:text-fg")}
        />
      </span>
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
      {!collapsed && badge != null && badge > 0 ? (
        <span className="ml-auto inline-flex min-w-[1.1rem] h-4 items-center justify-center rounded-sm bg-red-500/90 px-1 text-[9px] font-medium text-white tabular-nums">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
      {collapsed && badge != null && badge > 0 ? (
        <span
          className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500/90"
          aria-hidden
        />
      ) : null}
    </Link>
  )
}

export function WorkspaceSidebar(props: {
  workspaceId?: string
  workspaceName: string
  baseHref: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { collapsed, toggle } = useCollapsed()
  const [chatUnread, setChatUnread] = useState(0)

  useEffect(() => {
    if (!props.workspaceId) return
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/workspaces/${props.workspaceId}/chat/unread-count`)
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { count: number }
        if (!cancelled) setChatUnread(data.count)
      } catch {
        /* ignore */
      }
    }
    void load()
    const t = setInterval(load, 12000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [props.workspaceId])

  const sections: WorkspaceSidebarSection[] = buildWorkspaceSidebarSections(props.baseHref)
  const firstLetter = props.workspaceName.slice(0, 1).toUpperCase()

  function isActive(href: string) {
    if (href === props.baseHref + "/settings") {
      return pathname.startsWith(href)
    }
    return pathname === href || pathname.startsWith(href + "/")
  }

  function warm(href: string) {
    router.prefetch(href)
  }

  return (
    <aside
      aria-label="Workspace navigation"
      className={cn(
        "shrink-0 sticky top-12 h-[calc(100vh-48px)] flex flex-col",
        "border-r border-border bg-surface-1/60 backdrop-blur-sm",
        collapsed ? "w-14" : "w-[232px]"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b border-border h-12 px-2.5",
          collapsed && "justify-center px-0"
        )}
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-[11px] font-semibold text-fg"
          aria-hidden="true"
        >
          {firstLetter}
        </span>
        {!collapsed ? (
          <span className="truncate text-sm font-medium text-fg flex-1">{props.workspaceName}</span>
        ) : null}
        {!collapsed ? (
          <button
            type="button"
            onClick={toggle}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-fg-subtle hover:text-fg hover:bg-surface-2"
            aria-label="Collapse sidebar"
            title="Collapse"
          >
            <ChevronsLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>

      <nav
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden py-3",
          collapsed ? "px-1.5" : "px-2"
        )}
      >
        {sections.map((section, idx) => (
          <div key={section.label || `top-${idx}`} className={idx === 0 ? "" : "mt-4"}>
            {!collapsed && section.label ? (
              <p className="px-2.5 mb-1 text-[10px] font-display uppercase tracking-[0.18em] text-fg-subtle">
                {section.label}
              </p>
            ) : null}
            <ul className={cn("flex flex-col", collapsed ? "items-center gap-1" : "gap-0.5")}>
              {section.items.map((item) => (
                <li key={item.href} className={collapsed ? "" : "w-full"}>
                  <SidebarLink
                    item={item}
                    active={isActive(item.href)}
                    collapsed={collapsed}
                    badge={item.badge === "chat" ? chatUnread : undefined}
                    onWarm={() => warm(item.href)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {collapsed ? (
        <div className="border-t border-border p-1.5 flex justify-center">
          <button
            type="button"
            onClick={toggle}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-fg-subtle hover:text-fg hover:bg-surface-2"
            aria-label="Expand sidebar"
            title="Expand"
          >
            <ChevronsRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>
      ) : null}
    </aside>
  )
}
