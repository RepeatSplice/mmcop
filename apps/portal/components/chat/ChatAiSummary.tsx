"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"

export function ChatAiSummary(props: { workspaceId: string }) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/chat-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: props.workspaceId }),
      })
      const data = (await res.json()) as { summary?: string; error?: string }
      if (!res.ok) throw new Error(data.error || "Failed")
      setSummary(data.summary ?? null)
    } catch {
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-4">
      <Button type="button" variant="secondary" size="sm" onClick={() => void load()} isLoading={loading}>
        Summarize thread
      </Button>
      {summary ? (
        <pre className="mt-3 text-xs text-fg-muted whitespace-pre-wrap border border-border p-3 rounded-md max-h-40 overflow-y-auto">
          {summary}
        </pre>
      ) : null}
    </div>
  )
}
