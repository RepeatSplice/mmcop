"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

export function NewJobCommentForm({ jobId }: { jobId: string }) {
  const [body, setBody] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function submit() {
    setSaving(true)
    setError(null)
    setOk(false)
    try {
      const res = await fetch(`/api/jobs/${jobId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) throw new Error(await res.text())
      setBody("")
      setOk(true)
    } catch (e: any) {
      setError(e?.message || "Failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <Textarea label="Add comment" value={body} onChange={(e) => setBody(e.target.value)} />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {ok && <p className="text-xs text-emerald-300">Posted.</p>}
      <Button type="button" onClick={submit} isLoading={saving} disabled={!body.trim()}>
        Post
      </Button>
    </div>
  )
}

