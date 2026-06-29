"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"

export function ApplyAiHintButton(props: { applicationId: string }) {
  const [hint, setHint] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/ai/apply-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: props.applicationId }),
      })
      const data = (await res.json()) as { hint?: string; error?: string }
      if (!res.ok) throw new Error(data.error || "Failed")
      setHint(data.hint ?? null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" size="sm" onClick={() => void load()} isLoading={loading}>
        AI triage hint
      </Button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      {hint ? (
        <pre className="text-xs text-fg-muted whitespace-pre-wrap rounded-md border border-border bg-surface p-3 max-h-48 overflow-y-auto">
          {hint}
        </pre>
      ) : null}
    </div>
  )
}
