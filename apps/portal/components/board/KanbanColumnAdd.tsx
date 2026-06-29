"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function KanbanColumnAdd(props: {
  onCreate: (title: string) => Promise<void>
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || busy) return
    setBusy(true)
    try {
      await props.onCreate(trimmed)
      setTitle("")
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        disabled={props.disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "w-full flex items-center justify-center gap-1.5 rounded-md border border-dashed py-2.5",
          "text-[11px] font-medium transition-colors",
          props.disabled
            ? "border-border/60 text-fg-subtle/50 cursor-not-allowed"
            : "border-border text-fg-muted hover:text-fg hover:border-fg/25 hover:bg-surface-2"
        )}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
        Add card
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-border bg-surface p-2.5 space-y-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Card title…"
        className="w-full rounded-sm border border-border bg-surface-1 px-2.5 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-fg/25"
        disabled={busy}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || title.trim().length < 2}
          className="flex-1 h-8 rounded-sm border border-fg bg-fg text-[11px] font-medium text-surface hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Adding…" : "Create"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setTitle("")
          }}
          className="h-8 w-8 inline-flex items-center justify-center rounded-sm border border-border text-fg-muted hover:text-fg hover:bg-surface-2"
          aria-label="Cancel"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </form>
  )
}
