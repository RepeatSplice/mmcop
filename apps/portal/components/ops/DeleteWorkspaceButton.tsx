"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export function DeleteWorkspaceButton(props: {
  workspaceId: string
  workspaceName: string
  workspaceSlug: string
  redirectTo?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canDelete = confirm === props.workspaceSlug

  async function onDelete() {
    if (!canDelete) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/ops/workspaces/${props.workspaceId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmSlug: props.workspaceSlug }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Delete failed")
      }
      router.push(props.redirectTo ?? "/ops/workspaces")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="danger" size="sm" onClick={() => setOpen(true)}>
        Delete workspace
      </Button>
    )
  }

  return (
    <div className="max-w-md space-y-4 rounded-md border border-red-500/30 bg-red-500/5 p-4">
      <p className="text-sm text-fg">
        Permanently delete <span className="font-medium text-fg">{props.workspaceName}</span>? This
        removes members, tickets, sprints, jobs, chat, and Discord records. It does not delete
        Discord channels automatically.
      </p>
      <Input
        label={`Type ${props.workspaceSlug} to confirm`}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="off"
      />
      {error ? <p className="text-xs text-red-400 break-words">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={!canDelete}
          isLoading={busy}
          onClick={onDelete}
        >
          Delete permanently
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => {
            setOpen(false)
            setConfirm("")
            setError(null)
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
