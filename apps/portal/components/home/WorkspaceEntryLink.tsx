"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { WORKSPACE_PRIORITY_PRELOAD_SUFFIXES } from "@/components/nav/workspace-tabs"

export function WorkspaceEntryLink(props: {
  name: string
  slug: string
  role: string
  /** First page after preload (default summary). */
  landing?: "board" | "summary"
}) {
  const router = useRouter()
  const base = `/workspace/${props.slug}`
  const href = `${base}/${props.landing ?? "summary"}`

  function warmOnHover() {
    for (const suffix of WORKSPACE_PRIORITY_PRELOAD_SUFFIXES) {
      router.prefetch(`${base}/${suffix}`)
    }
    router.prefetch(href)
  }

  function onPickWorkspace() {
    try {
      sessionStorage.removeItem(`monarch-ws-preload:${props.slug}`)
    } catch {
      /* ignore */
    }
  }

  return (
    <Link
      href={href}
      prefetch
      onClick={onPickWorkspace}
      onMouseEnter={warmOnHover}
      onFocus={warmOnHover}
      className="group flex items-center justify-between gap-4 rounded-md border border-border bg-surface px-5 py-4 hover:border-fg/25 hover:bg-surface-2 transition-colors"
    >
      <div className="min-w-0">
        <p className="font-medium text-fg truncate">{props.name}</p>
        <p className="mt-1 font-mono text-[11px] text-fg-subtle truncate">/{props.slug}</p>
        <p className="mt-2 font-display text-[10px] uppercase tracking-widest text-fg-muted">
          {props.role.toLowerCase().replace("_", " ")}
        </p>
      </div>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-fg-subtle group-hover:text-fg group-hover:translate-x-0.5 transition-all"
        aria-hidden="true"
      />
    </Link>
  )
}
