"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronRight, Copy, Check } from "lucide-react"
import { ticketStatusLabel } from "@/lib/ticket-display"
import { LANE_LABELS, laneOf } from "@/lib/ticket-status"
import type { TicketDetailTicket } from "@/components/tickets/ticket-detail-types"

export function TicketDetailHeader(props: {
  workspaceSlug: string
  baseHref: string
  ticket: TicketDetailTicket
  canEdit: boolean
  currentUserId: string | null
  assigneeId: string
  status: string
  title: string
  saveState: "idle" | "saving" | "saved" | "error"
  onTitleInput: (v: string) => void
  onAssignToMe: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      const url =
        typeof window !== "undefined"
          ? window.location.href
          : `/workspace/${props.workspaceSlug}/tickets/${props.ticket.key}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const lane = laneOf(props.status)
  const laneClass =
    lane === "billing"
      ? "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400"
      : "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"

  return (
    <header className="border border-border bg-surface-1 rounded-lg p-5 space-y-4">
      <nav className="flex flex-wrap items-center gap-1 text-xs text-fg-muted">
        <Link href={`${props.baseHref}/list`} className="hover:text-fg">
          All work
        </Link>
        {props.ticket.parent ? (
          <>
            <ChevronRight className="h-3 w-3 shrink-0" strokeWidth={1.75} />
            <Link
              href={`${props.baseHref}/tickets/${props.ticket.parent.key}`}
              className="hover:text-fg truncate max-w-[200px]"
              title={props.ticket.parent.title}
            >
              {props.ticket.parent.key}
            </Link>
          </>
        ) : null}
        {props.ticket.subtaskOf ? (
          <>
            <ChevronRight className="h-3 w-3 shrink-0" strokeWidth={1.75} />
            <Link
              href={`${props.baseHref}/tickets/${props.ticket.subtaskOf.key}`}
              className="hover:text-fg truncate max-w-[200px]"
              title={props.ticket.subtaskOf.title}
            >
              {props.ticket.subtaskOf.key}
            </Link>
          </>
        ) : null}
        <ChevronRight className="h-3 w-3 shrink-0" strokeWidth={1.75} />
        <span className="text-fg font-mono">{props.ticket.key}</span>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 min-w-0 space-y-3">
          <input
            className="w-full bg-transparent text-2xl font-medium text-fg tracking-tight focus:outline-none"
            value={props.title}
            onChange={(e) => props.onTitleInput(e.target.value)}
            disabled={!props.canEdit}
            aria-label="Title"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-fg-muted">
              {props.ticket.type === "EPIC" ? "Epic" : "Ticket"}
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${laneClass}`}
              title={lane === "billing" ? "Billing-gated work (quote/payment/input)" : "Workflow on the sprint board"}
            >
              {LANE_LABELS[lane]}
            </span>
            <span className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] text-fg-muted">
              {props.ticket.discipline}
            </span>
            <span className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-fg">
              {ticketStatusLabel(props.status)}
            </span>
            {props.saveState === "saved" ? (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Saved</span>
            ) : props.saveState === "saving" ? (
              <span className="text-[11px] text-fg-subtle">Saving…</span>
            ) : props.saveState === "error" ? (
              <span className="text-[11px] text-red-400">Save failed</span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {props.canEdit && props.currentUserId && props.assigneeId !== props.currentUserId ? (
            <button
              type="button"
              onClick={props.onAssignToMe}
              className="text-xs text-fg-muted hover:text-fg underline underline-offset-2"
            >
              Assign to me
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => void copyLink()}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-2 text-xs text-fg-muted hover:text-fg hover:bg-surface-2"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy link"}
          </button>

          <Link href={`${props.baseHref}/board`} className="text-xs text-fg-muted hover:text-fg px-2 py-2">
            Board
          </Link>
        </div>
      </div>
    </header>
  )
}
