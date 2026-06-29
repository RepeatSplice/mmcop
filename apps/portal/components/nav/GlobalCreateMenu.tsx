"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { FileText, Megaphone, Plus, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { PinUpdateModal } from "@/components/nav/PinUpdateModal"

export function GlobalCreateMenu({
  workspaceId,
  workspaceSlug,
  canPinUpdate,
}: {
  workspaceId: string
  workspaceSlug: string
  canPinUpdate: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pinOpen, setPinOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return
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

  const base = `/workspace/${workspaceSlug}`

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <div className="relative">
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "hidden sm:inline-flex h-8 items-center gap-1.5 px-3 rounded-sm border border-fg bg-fg text-surface text-[11px] font-medium uppercase tracking-[0.14em] hover:opacity-90 transition-opacity",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fg/40"
          )}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Create"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          Create
        </button>
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="sm:hidden inline-flex h-8 w-8 items-center justify-center rounded-sm border border-fg bg-fg text-surface"
          aria-label="Create"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </button>

        {open ? (
          <div
            ref={panelRef}
            role="menu"
            className="absolute right-0 top-[calc(100%+6px)] z-[60] w-[min(100vw-1.5rem,16rem)] overflow-hidden rounded-lg border border-border bg-surface-1 shadow-lg"
          >
            <div className="border-b border-border px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-fg-subtle">Create</p>
            </div>
            <ul className="py-1">
              <MenuRow
                icon={<Plus className="h-3.5 w-3.5" strokeWidth={1.75} />}
                label="New ticket"
                hint="Add to backlog"
                onClick={() => go(`${base}/backlog?new=1`)}
              />
              <MenuRow
                icon={<FileText className="h-3.5 w-3.5" strokeWidth={1.75} />}
                label="New request"
                hint="Quote / PayG work"
                onClick={() => go(`${base}/request`)}
              />
              <MenuRow
                icon={<UserPlus className="h-3.5 w-3.5" strokeWidth={1.75} />}
                label="Invite member"
                hint="Add teammate"
                onClick={() => go(`${base}/settings/members`)}
              />
              {canPinUpdate ? (
                <MenuRow
                  icon={<Megaphone className="h-3.5 w-3.5" strokeWidth={1.75} />}
                  label="Pin update"
                  hint="Announce on Summary"
                  onClick={() => {
                    setOpen(false)
                    setPinOpen(true)
                  }}
                />
              ) : null}
            </ul>
            <div className="border-t border-border px-3 py-2">
              <Link
                href={`${base}/summary`}
                onClick={() => setOpen(false)}
                className="text-[11px] text-fg-muted hover:text-fg"
              >
                View Summary →
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {pinOpen ? (
        <PinUpdateModal
          workspaceId={workspaceId}
          onClose={() => setPinOpen(false)}
          onPinned={() => {
            setPinOpen(false)
            router.refresh()
          }}
        />
      ) : null}
    </>
  )
}

function MenuRow({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  hint?: string
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-surface-2 transition-colors text-left"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-fg-muted">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-fg leading-tight">{label}</p>
          {hint ? <p className="text-[10px] text-fg-subtle mt-0.5">{hint}</p> : null}
        </div>
      </button>
    </li>
  )
}
