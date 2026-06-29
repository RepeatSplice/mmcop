"use client"

import { Button } from "@/components/ui/Button"
import { useState } from "react"

export function BillingPortalButton({ workspaceId }: { workspaceId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function go() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
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
    <div className="space-y-2">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button type="button" onClick={go} isLoading={loading}>
        Open Stripe billing portal
      </Button>
    </div>
  )
}

