"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  buildWorkspacePreloadHrefs,
  WORKSPACE_PRIORITY_PRELOAD_SUFFIXES,
} from "@/components/nav/workspace-tabs"

const STORAGE_PREFIX = "monarch-ws-preload:"

function storageKey(slug: string) {
  return `${STORAGE_PREFIX}${slug}`
}

/** Non-blocking: show workspace immediately; warm routes in the background. */
export function WorkspacePreloadGate(props: {
  slug: string
  workspaceId: string
  workspaceName: string
  baseHref: string
  children: ReactNode
}) {
  const router = useRouter()
  const [warming, setWarming] = useState(false)

  useEffect(() => {
    const key = storageKey(props.slug)
    const already = sessionStorage.getItem(key) === "1"

    const priority = WORKSPACE_PRIORITY_PRELOAD_SUFFIXES.map((s) => `${props.baseHref}/${s}`)
    const all = buildWorkspacePreloadHrefs(props.baseHref)

    for (const href of priority) router.prefetch(href)
    if (already) {
      for (const href of all) router.prefetch(href)
      return
    }

    setWarming(true)
    let cancelled = false

    void (async () => {
      try {
        await fetch(`/api/workspaces/${props.workspaceId}/bootstrap`, {
          credentials: "same-origin",
        })
      } catch {
        /* non-fatal */
      }
      if (cancelled) return
      sessionStorage.setItem(key, "1")
      setWarming(false)
      for (const href of all) router.prefetch(href)
    })()

    return () => {
      cancelled = true
    }
  }, [props.slug, props.workspaceId, props.baseHref, router])

  return (
    <>
      {warming ? (
        <div
          className="fixed top-12 left-0 right-0 z-[60] h-0.5 bg-surface-2 overflow-hidden"
          role="progressbar"
          aria-label={`Loading ${props.workspaceName}`}
        >
          <div
            className="h-full w-1/3 bg-fg rounded-full"
            style={{ animation: "workspace-warm 1s ease-in-out infinite" }}
          />
        </div>
      ) : null}
      {props.children}
    </>
  )
}
