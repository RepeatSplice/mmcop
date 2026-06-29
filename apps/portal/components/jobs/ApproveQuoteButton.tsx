"use client"

import { Button } from "@/components/ui/Button"
import { useState } from "react"

export function ApproveQuoteButton(props: { quoteId: string; canApprove: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function approve() {
    setLoading(true)
    setError(null)
    setOk(false)
    try {
      const res = await fetch(`/api/quotes/${props.quoteId}/approve`, { method: "POST" })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as { checkoutUrl?: string | null }
      setOk(true)
      if (data.checkoutUrl) window.location.href = data.checkoutUrl
    } catch (e: any) {
      setError(e?.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  if (!props.canApprove) return <p className="text-xs text-fg-muted">Quote approved (or read-only).</p>

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-400">{error}</p>}
      {ok && <p className="text-xs text-emerald-300">Approved.</p>}
      <Button type="button" onClick={approve} isLoading={loading}>
        Approve quote
      </Button>
    </div>
  )
}

