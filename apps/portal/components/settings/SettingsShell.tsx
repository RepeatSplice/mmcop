"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { buildSettingsNav, type SettingsNavItem } from "@/components/settings/settings-nav"

function navIsActive(pathname: string, item: SettingsNavItem) {
  if (item.id === "overview") {
    return pathname === item.href || pathname === `${item.href}/`
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export function SettingsShell(props: {
  workspaceName: string
  baseHref: string
  workspaceBaseHref: string
  showServer: boolean
  children: ReactNode
}) {
  const pathname = usePathname()
  const navItems = buildSettingsNav(props.baseHref, { showServer: props.showServer })

  return (
    <div className="w-full min-w-0 flex flex-col">
      <header className="px-5 py-4 border-b border-border bg-surface-1">
        <Link
          href={props.workspaceBaseHref}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-fg-muted hover:text-fg transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          Back to workspace
        </Link>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">
          {props.workspaceName}
        </p>
        <h1 className="mt-1 text-xl font-medium text-fg tracking-tight">Settings</h1>
        <p className="mt-1.5 text-sm text-fg-muted max-w-xl">
          Manage your team, integrations, billing, and workspace preferences.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row lg:min-h-[520px]">
        <aside className="lg:w-[240px] shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-surface-1/60">
          <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {navItems.map((item) => {
              const active = navIsActive(pathname, item)
              const Icon = item.icon
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2.5 min-w-[140px] lg:min-w-0 transition-colors",
                    active
                      ? "bg-fg text-surface"
                      : "text-fg-muted hover:text-fg hover:bg-surface-2"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span className="text-left min-w-0">
                    <span className="block text-[13px] font-medium leading-tight">{item.label}</span>
                    <span
                      className={cn(
                        "hidden lg:block text-[10px] mt-0.5 leading-snug",
                        active ? "text-surface/80" : "text-fg-subtle"
                      )}
                    >
                      {item.description}
                    </span>
                  </span>
                </Link>
              )
            })}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 bg-surface-1">{props.children}</div>
      </div>
    </div>
  )
}
