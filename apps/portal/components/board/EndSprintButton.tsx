"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export function EndSprintButton(props: {
  workspaceId: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function endSprint() {
    if (!confirm("End this sprint now? Incomplete tickets move to the next sprint as To do.")) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/workspaces/${props.workspaceId}/sprints/end`, {
        method: "POST",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? "Failed to end sprint")
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to end sprint")
    } finally {
      setLoading(false)
    }
  }

  if (props.disabled) return null

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={endSprint}
        disabled={loading}
        className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-fg px-3 text-[11px] font-medium uppercase tracking-widest text-fg hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        End sprint
      </button>
      {error ? <p className="text-[10px] text-red-600 dark:text-red-400 max-w-[200px] text-right">{error}</p> : null}
    </div>
  )
}
