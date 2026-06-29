"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export function AddIntegrationForm(props: {
  workspaces: { id: string; name: string; slug: string }[]
}) {
  const [workspaceId, setWorkspaceId] = useState(props.workspaces[0]?.id ?? "")
  const [type, setType] = useState<"GITHUB_REPO" | "DISCORD_CHANNEL">("GITHUB_REPO")
  const [externalId, setExternalId] = useState("")
  const [jobId, setJobId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function submit() {
    setLoading(true)
    setError(null)
    setOk(false)
    try {
      const res = await fetch("/api/ops/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          type,
          externalId,
          jobId: jobId || undefined,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setOk(true)
      setExternalId("")
      setJobId("")
    } catch (e: any) {
      setError(e?.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="font-display text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
        Add integration
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="font-display text-[11px] uppercase tracking-widest text-fg-subtle">
            Workspace
          </label>
          <select
            className="bg-surface border border-border px-3 py-2 text-sm text-fg focus:outline-none focus:border-monarch-500 transition-colors"
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
          >
            {props.workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-display text-[11px] uppercase tracking-widest text-fg-subtle">
            Type
          </label>
          <select
            className="bg-surface border border-border px-3 py-2 text-sm text-fg focus:outline-none focus:border-monarch-500 transition-colors"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            <option value="GITHUB_REPO">GitHub repo</option>
            <option value="DISCORD_CHANNEL">Discord channel/webhook</option>
          </select>
        </div>

        <Input
          label={type === "GITHUB_REPO" ? "Repo full name (owner/repo)" : "Channel ID or Webhook URL"}
          value={externalId}
          onChange={(e) => setExternalId(e.target.value)}
        />
        <Input
          label="Job ID (optional)"
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {ok && <p className="text-xs text-emerald-300">Saved.</p>}

      <Button type="button" onClick={submit} isLoading={loading} disabled={!workspaceId || !externalId.trim()}>
        Save
      </Button>
    </div>
  )
}

