"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ticketStatusLabel } from "@/lib/ticket-display"
import type { TicketSubtask } from "@/components/tickets/ticket-detail-types"

export function TicketSubtasksPanel(props: {
  workspaceId: string
  workspaceSlug: string
  baseHref: string
  ticketId: string
  ticketType: string
  canEdit: boolean
  subtasks: TicketSubtask[]
  onSubtaskCreated: (t: TicketSubtask) => void
}) {
  const [title, setTitle] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  if (props.ticketType === "EPIC") return null

  async function createSubtask() {
    const t = title.trim()
    if (!t) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: props.workspaceId,
          title: t,
          discipline: "Other",
          subtaskOfId: props.ticketId,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as {
        ticket: { id: string; key: string; title: string; status: string }
      }
      props.onSubtaskCreated({
        id: data.ticket.id,
        key: data.ticket.key,
        title: data.ticket.title,
        status: data.ticket.status,
      })
      setTitle("")
      setOpen(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="border border-border bg-surface-1 rounded-lg p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-fg">Subtasks</h3>
        <span className="text-xs text-fg-muted">{props.subtasks.length}</span>
      </div>

      <ul className="mt-3 space-y-1">
        {props.subtasks.length === 0 ? (
          <li className="text-sm text-fg-muted">No subtasks yet.</li>
        ) : (
          props.subtasks.map((s) => (
            <li key={s.id}>
              <Link
                href={`${props.baseHref}/tickets/${s.key}`}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-2 text-sm"
              >
                <span className="font-mono text-xs text-fg-subtle">{s.key}</span>
                <span className="flex-1 truncate text-fg">{s.title}</span>
                <span className="text-[10px] text-fg-muted shrink-0">
                  {ticketStatusLabel(s.status)}
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>

      {props.canEdit ? (
        <div className="mt-3">
          {open ? (
            <div className="space-y-2">
              <Input
                label="Subtask title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add subtask…"
              />
              {error ? <p className="text-xs text-red-400">{error}</p> : null}
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={() => void createSubtask()} isLoading={busy}>
                  Add
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-xs text-fg-muted hover:text-fg underline underline-offset-2"
            >
              Add subtask
            </button>
          )}
        </div>
      ) : null}
    </section>
  )
}
