"use client"

import { useState } from "react"
import { Input, Textarea } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

export function LogTimeForm() {
  const [workspaceId, setWorkspaceId] = useState("")
  const [taskId, setTaskId] = useState("")
  const [jobId, setJobId] = useState("")
  const [minutes, setMinutes] = useState("60")
  const [billable, setBillable] = useState(true)
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true)
    setError(null)
    setOk(false)
    try {
      const res = await fetch("/api/ops/time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          taskId: taskId || undefined,
          jobId: jobId || undefined,
          minutes: Number(minutes),
          billable,
          note: note || undefined,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setOk(true)
      setNote("")
    } catch (e: any) {
      setError(e?.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="font-display text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
        Log time
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <Input label="Workspace ID *" value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} />
        <Input label="Minutes *" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        <Input label="Task ID (optional)" value={taskId} onChange={(e) => setTaskId(e.target.value)} />
        <Input label="Job ID (optional)" value={jobId} onChange={(e) => setJobId(e.target.value)} />
      </div>
      <div className="flex items-center gap-2 text-sm text-fg-muted">
        <input
          type="checkbox"
          checked={billable}
          onChange={(e) => setBillable(e.target.checked)}
        />
        <span>Billable</span>
      </div>
      <Textarea label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {ok && <p className="text-xs text-emerald-300">Saved.</p>}
      <Button type="button" onClick={submit} isLoading={loading} disabled={!workspaceId.trim()}>
        Log time
      </Button>
    </div>
  )
}

