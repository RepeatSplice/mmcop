"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"

type Preview =
  | {
      ok: true
      workspace: { name: string; slug: string }
      role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
      invitedEmail: string
      sessionEmail: string
      emailMismatch: boolean
      expiresAt: string
    }
  | {
      ok: false
      reason: string
      error: string
      workspace?: { name: string; slug: string }
    }

const ROLE_BLURB: Record<"OWNER" | "ADMIN" | "MEMBER" | "VIEWER", string> = {
  OWNER: "Full control — manages billing, members, and workspace settings.",
  ADMIN: "Manages members, integrations, and settings (no billing).",
  MEMBER: "Creates and edits tickets, chats, and comments.",
  VIEWER: "Read-only access. Cannot post or change ticket state.",
}

function humanizeError(raw: string): string {
  if (!raw) return "We couldn't accept that invite right now."
  if (raw.includes("expired")) return "This invite has expired. Ask for a new one."
  if (raw.includes("revoked")) return "This invite was revoked."
  if (raw.includes("not found") || raw.includes("Not found"))
    return "We couldn't find that invite. The link may be old or revoked."
  if (raw.includes("Already")) return "This invite was already accepted."
  return raw.slice(0, 240)
}

export function AcceptInviteClient({ token }: { token: string }) {
  const [preview, setPreview] = useState<Preview | null>(null)
  const [previewing, setPreviewing] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/invites/preview?token=${encodeURIComponent(token)}`)
        const data = (await res.json()) as Preview
        if (!cancelled) setPreview(data)
      } catch {
        if (!cancelled) {
          setPreview({
            ok: false,
            reason: "network",
            error: "Couldn't load this invite. Check your connection and try again.",
          })
        }
      } finally {
        if (!cancelled) setPreviewing(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [token])

  async function accept() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as { workspaceSlug: string }
      window.location.href = `/workspace/${data.workspaceSlug}/summary`
    } catch (e: unknown) {
      setError(humanizeError(e instanceof Error ? e.message : ""))
    } finally {
      setLoading(false)
    }
  }

  if (previewing) {
    return <p className="text-sm text-fg-muted">Checking invite…</p>
  }

  if (!preview) {
    return <p className="text-sm text-red-400">Failed to load invite preview.</p>
  }

  if (!preview.ok) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-400 break-words">{preview.error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-surface px-4 py-3 space-y-1">
        <p className="text-[11px] uppercase tracking-widest text-fg-subtle">
          You&apos;ve been invited to join
        </p>
        <p className="text-base font-medium text-fg">{preview.workspace.name}</p>
        <p className="text-xs text-fg-muted">
          As <span className="font-medium text-fg">{preview.role}</span> ·{" "}
          {ROLE_BLURB[preview.role]}
        </p>
      </div>
      {preview.emailMismatch ? (
        <p className="text-[11px] text-amber-500">
          Heads up: invite was sent to <strong>{preview.invitedEmail}</strong> but you&apos;re signed in as <strong>{preview.sessionEmail}</strong>. Accepting will add the signed-in account to the workspace.
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-400 break-words">{error}</p> : null}
      <Button type="button" onClick={accept} isLoading={loading}>
        Join {preview.workspace.name}
      </Button>
      <p className="text-xs text-fg-muted">
        Once you join, you&apos;ll be taken to the workspace summary.
      </p>
    </div>
  )
}
