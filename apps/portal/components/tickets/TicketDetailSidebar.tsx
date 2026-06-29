"use client"

import Link from "next/link"
import { useState } from "react"
import { ticketStatusLabel } from "@/lib/ticket-display"
import { statusOptionsForTicket } from "@/lib/ticket-status-options"
import type {
  TicketDetailTicket,
  TicketMember,
  TicketSprint,
} from "@/components/tickets/ticket-detail-types"
import { DISCIPLINES } from "@/components/tickets/ticket-detail-types"

import type { ReactNode } from "react"

function DetailRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-b-0">
      <span className="text-xs text-fg-muted shrink-0">{props.label}</span>
      <div className="min-w-0 text-right">{props.children}</div>
    </div>
  )
}

function memberLabel(m: TicketMember) {
  return m.name || m.email || "Member"
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function TicketDetailSidebar(props: {
  workspaceSlug: string
  baseHref: string
  ticket: TicketDetailTicket
  members: TicketMember[]
  epics: { id: string; key: string; title: string }[]
  sprints: TicketSprint[]
  canEdit: boolean
  showAdvanced: boolean
  currentUserId: string | null
  type: string
  status: string
  parentId: string
  assigneeId: string
  sprintId: string
  discipline: string
  dueDate: string
  hoursEst: string
  hoursActual: string
  onTypeChange: (v: string) => void
  onStatusChange: (v: string) => void
  onEpicChange: (v: string) => void
  onAssigneeChange: (v: string) => void
  onSprintChange: (v: string) => void
  onDisciplineChange: (v: string) => void
  onDueDateChange: (v: string) => void
  onHoursEstInput: (v: string) => void
  onHoursEstChange: (v: string) => void
  onHoursActualInput: (v: string) => void
  onHoursActualChange: (v: string) => void
  onAssignToMe: () => void
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const assignee = props.members.find((m) => m.id === props.assigneeId)
  const assigneeName = assignee ? memberLabel(assignee) : "Unassigned"
  const statusOptions = statusOptionsForTicket(props.status)

  return (
    <aside className="space-y-4">
      <div className="border border-border bg-surface-1 rounded-lg p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">Details</p>
        <div className="mt-3">
          <DetailRow label="Status">
            {props.canEdit ? (
              <select
                className="max-w-[160px] rounded-md border border-border bg-surface px-2 py-1 text-sm text-fg"
                value={props.status}
                onChange={(e) => props.onStatusChange(e.target.value)}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {ticketStatusLabel(s)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-fg">{ticketStatusLabel(props.status)}</span>
            )}
          </DetailRow>

          <DetailRow label="Assignee">
            <div className="flex flex-col items-end gap-1">
              {assignee ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-fg">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-[10px] font-medium">
                    {initials(assigneeName)}
                  </span>
                  {assigneeName}
                </span>
              ) : (
                <span className="text-sm text-fg-subtle">Unassigned</span>
              )}
              {props.canEdit ? (
                <>
                  <select
                    className="max-w-[160px] rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg"
                    value={props.assigneeId}
                    onChange={(e) => props.onAssigneeChange(e.target.value)}
                    aria-label="Assignee"
                  >
                    <option value="">Unassigned</option>
                    {props.members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {memberLabel(m)}
                      </option>
                    ))}
                  </select>
                  {props.currentUserId && props.assigneeId !== props.currentUserId ? (
                    <button
                      type="button"
                      onClick={props.onAssignToMe}
                      className="text-[11px] text-fg-muted hover:text-fg underline"
                    >
                      Assign to me
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </DetailRow>

          <DetailRow label="Epic">
            {props.ticket.parent && !props.canEdit ? (
              <Link
                href={`${props.baseHref}/tickets/${props.ticket.parent.key}`}
                className="text-sm text-fg hover:underline truncate max-w-[160px] inline-block"
              >
                {props.ticket.parent.key}
              </Link>
            ) : props.canEdit && props.type !== "EPIC" ? (
              <select
                className="max-w-[160px] rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg"
                value={props.parentId}
                onChange={(e) => props.onEpicChange(e.target.value)}
              >
                <option value="">None</option>
                {props.epics.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.key}
                  </option>
                ))}
              </select>
            ) : props.ticket.parent ? (
              <Link
                href={`${props.baseHref}/tickets/${props.ticket.parent.key}`}
                className="text-sm text-fg hover:underline"
              >
                {props.ticket.parent.key}
              </Link>
            ) : (
              <span className="text-sm text-fg-subtle">None</span>
            )}
          </DetailRow>

          {props.type !== "EPIC" ? (
            <DetailRow label="Sprint">
              {props.canEdit ? (
                <select
                  className="max-w-[160px] rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg"
                  value={props.sprintId}
                  onChange={(e) => props.onSprintChange(e.target.value)}
                >
                  <option value="">None</option>
                  {props.sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-fg">{props.ticket.sprint?.name ?? "None"}</span>
              )}
            </DetailRow>
          ) : null}

          <DetailRow label="Discipline">
            {props.canEdit ? (
              <select
                className="max-w-[160px] rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg"
                value={props.discipline}
                onChange={(e) => props.onDisciplineChange(e.target.value)}
              >
                {DISCIPLINES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-fg">{props.discipline}</span>
            )}
          </DetailRow>

          <DetailRow label="Due date">
            {props.canEdit ? (
              <input
                type="date"
                className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg"
                value={props.dueDate}
                onChange={(e) => props.onDueDateChange(e.target.value)}
              />
            ) : (
              <span className="text-sm text-fg">
                {props.ticket.dueDate
                  ? new Date(props.ticket.dueDate).toLocaleDateString()
                  : "None"}
              </span>
            )}
          </DetailRow>

          <DetailRow label="Estimate (h)">
            {props.canEdit ? (
              <input
                type="number"
                min={0}
                step={0.5}
                className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg"
                value={props.hoursEst}
                onChange={(e) => props.onHoursEstInput(e.target.value)}
                onBlur={(e) => props.onHoursEstChange(e.target.value)}
                placeholder="—"
              />
            ) : (
              <span className="text-sm text-fg">{props.ticket.hoursEst ?? "—"}</span>
            )}
          </DetailRow>

          <DetailRow label="Logged (h)">
            {props.canEdit ? (
              <input
                type="number"
                min={0}
                step={0.5}
                className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg"
                value={props.hoursActual}
                onChange={(e) => props.onHoursActualInput(e.target.value)}
                onBlur={(e) => props.onHoursActualChange(e.target.value)}
                placeholder="—"
              />
            ) : (
              <span className="text-sm text-fg">{props.ticket.hoursActual ?? "—"}</span>
            )}
          </DetailRow>

          {props.canEdit ? (
            <DetailRow label="Type">
              <select
                className="max-w-[160px] rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg"
                value={props.type}
                onChange={(e) => props.onTypeChange(e.target.value)}
              >
                <option value="TICKET">Ticket</option>
                <option value="EPIC">Epic</option>
              </select>
            </DetailRow>
          ) : null}
        </div>
      </div>

      {props.showAdvanced ? (
        <div className="border border-border bg-surface-1 rounded-lg p-4">
          <button
            type="button"
            onClick={() => setAdvancedOpen((o) => !o)}
            className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle w-full text-left"
          >
            Advanced {advancedOpen ? "▾" : "▸"}
          </button>
          {advancedOpen ? (
            <p className="mt-2 text-xs text-fg-muted">Order: {props.ticket.position}</p>
          ) : null}
        </div>
      ) : null}

      <div className="border border-border bg-surface-1 rounded-lg p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">Meta</p>
        <div className="mt-3 space-y-2 text-xs text-fg-muted">
          <p>
            Reporter:{" "}
            <span className="text-fg">
              {props.ticket.createdBy.name || props.ticket.createdBy.email || "User"}
            </span>
          </p>
          <p>
            Created:{" "}
            <span className="text-fg">{new Date(props.ticket.createdAt).toLocaleString()}</span>
          </p>
          <p>
            Updated:{" "}
            <span className="text-fg">{new Date(props.ticket.updatedAt).toLocaleString()}</span>
          </p>
        </div>
      </div>
    </aside>
  )
}
