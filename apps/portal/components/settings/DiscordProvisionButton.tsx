"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"

export function DiscordProvisionButton(props: { workspaceId: string; alreadyProvisioned?: boolean }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function retry() {
    setBusy(true)
    setError(null)
    setOk(false)
    try {
      const res = await fetch(`/api/workspaces/${props.workspaceId}/discord/retry-provision`, {
        method: "POST",
      })
      if (!res.ok) throw new Error(await res.text())
      setOk(true)
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Provision failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={retry} isLoading={busy}>
        {ok
          ? "Done"
          : props.alreadyProvisioned
            ? "Fix Discord channel permissions"
            : "Provision / retry Discord"}
      </Button>
      {error && <p className="text-xs text-red-400 break-words">{error}</p>}
    </div>
  )
}
