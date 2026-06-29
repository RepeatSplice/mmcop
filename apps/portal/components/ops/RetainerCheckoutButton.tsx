"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"

export function RetainerCheckoutButton({ workspaceId }: { workspaceId: string }) {
  const [tier, setTier] = useState<"FOUNDATION" | "PARTNER" | "STUDIO">("FOUNDATION")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/ops/workspaces/${workspaceId}/retainer-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as { url: string }
      window.location.href = data.url
    } catch (e: any) {
      setError(e?.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="bg-surface border border-border px-3 py-2 text-sm text-fg focus:outline-none focus:border-monarch-500 transition-colors"
          value={tier}
          onChange={(e) => setTier(e.target.value as any)}
        >
          <option value="FOUNDATION">Foundation</option>
          <option value="PARTNER">Partner</option>
          <option value="STUDIO">Studio</option>
        </select>
        <Button type="button" onClick={start} isLoading={loading}>
          Start subscription checkout
        </Button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <p className="text-xs text-fg-muted">
        Uses env price IDs: <code>STRIPE_RETAINER_PRICE_*</code>
      </p>
    </div>
  )
}

