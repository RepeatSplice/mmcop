"use client"

import { useState } from "react"

const TIERS: Array<{
  id: "FOUNDATION" | "PARTNER" | "STUDIO"
  label: string
  description: string
}> = [
  { id: "FOUNDATION", label: "Foundation", description: "Best for small studios" },
  { id: "PARTNER", label: "Partner", description: "Best for active production" },
  { id: "STUDIO", label: "Studio", description: "Best for ongoing live ops" },
]

export function StartRetainerButtons({ workspaceId }: { workspaceId: string }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function start(tier: (typeof TIERS)[number]["id"]) {
    setBusy(tier)
    setError(null)
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/retainer-checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier }),
        }
      )
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as { url: string }
      window.location.href = data.url
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start checkout")
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {TIERS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => void start(t.id)}
            disabled={Boolean(busy)}
            className="rounded-md border border-border bg-surface px-3 py-3 text-left text-sm hover:border-fg/30 hover:bg-surface-2 disabled:opacity-50"
          >
            <p className="font-medium text-fg">{t.label}</p>
            <p className="mt-0.5 text-[11px] text-fg-muted">{t.description}</p>
            <p className="mt-2 text-[10px] uppercase tracking-widest text-fg-subtle">
              {busy === t.id ? "Opening Stripe…" : "Start retainer"}
            </p>
          </button>
        ))}
      </div>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  )
}
