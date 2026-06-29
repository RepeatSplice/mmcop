"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

export function ServerControlsModal(props: {
  open: boolean
  onClose: () => void
  workspaceId: string
  initial: {
    online: boolean
    playerCount: number
    maxPlayers: number
  } | null
}) {
  const router = useRouter()
  const [online, setOnline] = useState(props.initial?.online ?? false)
  const [players, setPlayers] = useState(props.initial?.playerCount ?? 0)
  const [maxPlayers, setMaxPlayers] = useState(props.initial?.maxPlayers ?? 60)
  const [pinned, setPinned] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  if (!props.open) return null

  async function saveStatus() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/workspaces/${props.workspaceId}/server`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          online,
          playerCount: players,
          maxPlayers,
          provider: "MANUAL",
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setMsg({ kind: "ok", text: "Status saved." })
      router.refresh()
    } catch (e: unknown) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Failed" })
    } finally {
      setBusy(false)
    }
  }

  async function pinUpdate() {
    if (!pinned.trim()) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/workspaces/${props.workspaceId}/pinned-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: pinned, mirrorDiscord: true }),
      })
      if (!res.ok) throw new Error(await res.text())
      setPinned("")
      setMsg({ kind: "ok", text: "Pinned to summary and mirrored to Discord." })
      router.refresh()
    } catch (e: unknown) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Failed" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface-1 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-fg">Server controls</h3>
          <button
            type="button"
            onClick={props.onClose}
            className="text-fg-muted hover:text-fg"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {msg ? (
            <p
              className={
                "text-xs " +
                (msg.kind === "ok" ? "text-emerald-500" : "text-red-500")
              }
            >
              {msg.text}
            </p>
          ) : null}

          <section className="space-y-3">
            <h4 className="text-xs font-medium uppercase tracking-widest text-fg-subtle">
              Live status
            </h4>
            <label className="flex items-center gap-2 text-sm text-fg">
              <input
                type="checkbox"
                checked={online}
                onChange={(e) => setOnline(e.target.checked)}
              />
              Server online
            </label>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-widest text-fg-subtle">
                  Players
                </label>
                <input
                  type="number"
                  min={0}
                  value={players}
                  onChange={(e) => setPlayers(Number(e.target.value))}
                  className="mt-1 block w-24 rounded-md border border-border bg-surface px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest text-fg-subtle">
                  Max slots
                </label>
                <input
                  type="number"
                  min={0}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="mt-1 block w-24 rounded-md border border-border bg-surface px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => void saveStatus()}
                disabled={busy}
                className="h-9 inline-flex items-center px-3 rounded-md border border-fg bg-fg text-surface text-[11px] disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-xs font-medium uppercase tracking-widest text-fg-subtle">
              Pin an update
            </h4>
            <textarea
              rows={3}
              value={pinned}
              onChange={(e) => setPinned(e.target.value)}
              placeholder="e.g. Server restart tonight 9pm UTC — expect 10 min downtime."
              className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void pinUpdate()}
                disabled={busy || !pinned.trim()}
                className="h-9 inline-flex items-center px-3 rounded-md border border-fg bg-fg text-surface text-[11px] disabled:opacity-50"
              >
                Pin and announce
              </button>
            </div>
            <p className="text-[10px] text-fg-subtle">
              Mirrors to your Discord #announcements channel if connected.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
