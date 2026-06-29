"use client"

import { useState } from "react"
import { Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { BOARD_COLUMN_COLORS, type BoardColumnDto } from "@/lib/board-columns"
import { COLUMN_COLOR_DOT } from "@/lib/board-column-styles"
import { ticketStatusLabel } from "@/lib/ticket-display"
import type { TicketStatus } from "@prisma/client"

const BOARD_STATUSES: TicketStatus[] = [
  "PLANNED",
  "IN_PROGRESS",
  "REVIEW",
  "AWAITING_CLIENT",
  "DONE",
  "CANCELLED",
  "BACKLOG",
]

export function BoardColumnSettings(props: {
  workspaceId: string
  columns: BoardColumnDto[]
  open: boolean
  onClose: () => void
  onColumnsChange: (columns: BoardColumnDto[]) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [label, setLabel] = useState("")
  const [status, setStatus] = useState<TicketStatus>("IN_PROGRESS")
  const [color, setColor] = useState<(typeof BOARD_COLUMN_COLORS)[number]>("violet")

  if (!props.open) return null

  async function refresh() {
    const res = await fetch(`/api/workspaces/${props.workspaceId}/board-columns`)
    if (!res.ok) throw new Error(await res.text())
    const data = (await res.json()) as { columns: BoardColumnDto[] }
    props.onColumnsChange(data.columns)
  }

  async function addColumn() {
    const trimmed = label.trim()
    if (!trimmed) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/workspaces/${props.workspaceId}/board-columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: trimmed, status, color }),
      })
      if (!res.ok) throw new Error(await res.text())
      setLabel("")
      await refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add column")
    } finally {
      setBusy(false)
    }
  }

  async function removeColumn(columnId: string) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/workspaces/${props.workspaceId}/board-columns?columnId=${encodeURIComponent(columnId)}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error(await res.text())
      await refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to remove column")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40">
      <div
        className="w-full max-w-md rounded-lg border border-border bg-surface-1 shadow-xl"
        role="dialog"
        aria-labelledby="board-columns-title"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <h2 id="board-columns-title" className="text-sm font-medium text-fg">
            Board columns
          </h2>
          <button
            type="button"
            onClick={props.onClose}
            className="p-1 rounded-sm text-fg-muted hover:text-fg hover:bg-surface-2"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-fg-muted">
            System columns map to ticket statuses. Custom columns are extra swimlanes (e.g. QA,
            Blocked) that set status when cards move in.
          </p>

          <ul className="space-y-2">
            {props.columns.map((col) => (
              <li
                key={col.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${COLUMN_COLOR_DOT[col.color]}`}
                  />
                  <span className="text-sm text-fg truncate">{col.label}</span>
                  <span className="text-[10px] text-fg-subtle shrink-0">
                    {ticketStatusLabel(col.status)}
                    {col.isSystem ? " · system" : ""}
                  </span>
                </div>
                {!col.isSystem ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void removeColumn(col.id)}
                    className="p-1 text-fg-muted hover:text-red-500"
                    aria-label={`Remove ${col.label}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-fg-subtle">
              Add custom column
            </p>
            <Input
              label="Column name"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. QA, Blocked, On hold"
            />
            <label className="block text-xs text-fg-muted">
              Maps to status
              <select
                className="mt-1 w-full h-9 rounded-sm border border-border bg-surface px-2 text-sm text-fg"
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
              >
                {BOARD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ticketStatusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <p className="text-xs text-fg-muted mb-1.5">Color</p>
              <div className="flex flex-wrap gap-2">
                {BOARD_COLUMN_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded-full border-2 ${COLUMN_COLOR_DOT[c]} ${
                      color === c ? "border-fg ring-2 ring-fg/20" : "border-transparent"
                    }`}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => void addColumn()}
              isLoading={busy}
              disabled={!label.trim()}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add column
            </Button>
          </div>

          {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
      </div>
    </div>
  )
}
