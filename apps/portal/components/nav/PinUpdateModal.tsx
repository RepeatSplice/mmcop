"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Megaphone, X } from "lucide-react"

export function PinUpdateModal({
  workspaceId,
  onClose,
  onPinned,
}: {
  workspaceId: string
  onClose: () => void
  onPinned: () => void
}) {
  const [body, setBody] = useState("")
  const [mirrorDiscord, setMirrorDiscord] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textRef.current?.focus()
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onEsc)
    return () => document.removeEventListener("keydown", onEsc)
  }, [onClose])

  async function submit() {
    if (!body.trim()) {
      setError("Write a short update first.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/pinned-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), mirrorDiscord }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || "Failed to pin update")
      }
      onPinned()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to pin update")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-update-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-border bg-surface-1 shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-surface text-fg-muted">
              <Megaphone className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
            <h2 id="pin-update-title" className="text-sm font-medium text-fg">
              Pin a workspace update
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-fg-subtle hover:text-fg hover:bg-surface-2"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-4 py-4 space-y-3">
          <p className="text-xs text-fg-muted">
            Shown at the top of Summary until replaced. Useful for announcements,
            maintenance windows, or critical asks.
          </p>
          <textarea
            ref={textRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            maxLength={4000}
            placeholder="What does the team need to know?"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-fg/30"
          />
          <label className="flex items-center gap-2 text-xs text-fg-muted cursor-pointer">
            <input
              type="checkbox"
              checked={mirrorDiscord}
              onChange={(e) => setMirrorDiscord(e.target.checked)}
              className="accent-fg"
            />
            Also post to Discord announcements
          </label>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-fg-muted hover:text-fg px-2 py-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading || !body.trim()}
            className="inline-flex items-center gap-1.5 rounded-md border border-fg bg-fg text-surface px-3 py-1.5 text-xs font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Pin update
          </button>
        </div>
      </div>
    </div>
  )
}
