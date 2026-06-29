"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Textarea } from "@/components/ui/Input"
import { TicketDetailHeader } from "@/components/tickets/TicketDetailHeader"
import { TicketDetailSidebar } from "@/components/tickets/TicketDetailSidebar"
import { TicketActivityPanel } from "@/components/tickets/TicketActivityPanel"
import { TicketAttachmentsPanel } from "@/components/tickets/TicketAttachmentsPanel"
import { TicketSubtasksPanel } from "@/components/tickets/TicketSubtasksPanel"
import type {
  TicketActivityEvent,
  TicketAttachment,
  TicketComment,
  TicketDetailTicket,
  TicketMember,
  TicketSprint,
  TicketSubtask,
} from "@/components/tickets/ticket-detail-types"

function isoToDateValue(iso: string | null) {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  } catch {
    return ""
  }
}

function dateValueToIso(value: string) {
  if (!value) return null
  return new Date(`${value}T00:00:00.000Z`).toISOString()
}

type ServerSnapshot = {
  title: string
  description: string
  status: string
  type: string
  parentId: string
  assigneeId: string
  sprintId: string
  discipline: string
  dueDate: string
  hoursEst: string
  hoursActual: string
}

function snapshotFromTicket(ticket: TicketDetailTicket): ServerSnapshot {
  return {
    title: ticket.title,
    description: ticket.description ?? "",
    status: ticket.status,
    type: ticket.type,
    parentId: ticket.parent?.id ?? "",
    assigneeId: ticket.assignee?.id ?? "",
    sprintId: ticket.sprint?.id ?? "",
    discipline: ticket.discipline,
    dueDate: isoToDateValue(ticket.dueDate),
    hoursEst: ticket.hoursEst != null ? String(ticket.hoursEst) : "",
    hoursActual: ticket.hoursActual != null ? String(ticket.hoursActual) : "",
  }
}

export function TicketDetail(props: {
  canEdit: boolean
  showAdvanced: boolean
  workspaceId: string
  workspaceSlug: string
  baseHref: string
  currentUserId: string | null
  ticket: TicketDetailTicket
  members: TicketMember[]
  epics: { id: string; key: string; title: string }[]
  sprints: TicketSprint[]
  comments: TicketComment[]
  activityEvents: TicketActivityEvent[]
  attachments: TicketAttachment[]
  subtasks: TicketSubtask[]
}) {
  const serverRef = useRef<ServerSnapshot>(snapshotFromTicket(props.ticket))

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [title, setTitle] = useState(props.ticket.title)
  const [description, setDescription] = useState(props.ticket.description ?? "")
  const [status, setStatus] = useState(props.ticket.status)
  const [type, setType] = useState(props.ticket.type)
  const [parentId, setParentId] = useState(props.ticket.parent?.id ?? "")
  const [assigneeId, setAssigneeId] = useState(props.ticket.assignee?.id ?? "")
  const [sprintId, setSprintId] = useState(props.ticket.sprint?.id ?? "")
  const [discipline, setDiscipline] = useState(props.ticket.discipline)
  const [dueDate, setDueDate] = useState(isoToDateValue(props.ticket.dueDate))
  const [hoursEst, setHoursEst] = useState(
    props.ticket.hoursEst != null ? String(props.ticket.hoursEst) : ""
  )
  const [hoursActual, setHoursActual] = useState(
    props.ticket.hoursActual != null ? String(props.ticket.hoursActual) : ""
  )
  const [comments, setComments] = useState(props.comments)
  const [attachments, setAttachments] = useState(props.attachments)
  const [subtasks, setSubtasks] = useState(props.subtasks)

  useEffect(() => {
    // Mark related ticket-* notification rows read when opening a ticket.
    void fetch("/api/notifications/by-target", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "ticket",
        workspaceId: props.workspaceId,
        ticketKey: props.ticket.key,
      }),
    }).catch(() => {})
  }, [props.workspaceId, props.ticket.key])

  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const descDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function applySnapshot(s: ServerSnapshot) {
    setTitle(s.title)
    setDescription(s.description)
    setStatus(s.status)
    setType(s.type)
    setParentId(s.parentId)
    setAssigneeId(s.assigneeId)
    setSprintId(s.sprintId)
    setDiscipline(s.discipline)
    setDueDate(s.dueDate)
    setHoursEst(s.hoursEst)
    setHoursActual(s.hoursActual)
  }

  useEffect(() => {
    const s = snapshotFromTicket(props.ticket)
    serverRef.current = s
    applySnapshot(s)
    setAttachments(props.attachments)
    setSubtasks(props.subtasks)
    setComments(props.comments)
  }, [props.ticket.id, props.ticket.updatedAt, props.attachments, props.subtasks, props.comments])

  const patch = useCallback(
    async (payload: Record<string, unknown>, onFailure?: () => void) => {
      setSaveState("saving")
      try {
        const res = await fetch(`/api/tickets/${props.ticket.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId: props.workspaceId, ...payload }),
        })
        if (!res.ok) throw new Error(await res.text())
        const s = serverRef.current
        if ("title" in payload && typeof payload.title === "string") s.title = payload.title
        if ("description" in payload)
          s.description = payload.description == null ? "" : String(payload.description)
        if ("status" in payload && typeof payload.status === "string") s.status = payload.status
        if ("type" in payload && typeof payload.type === "string") s.type = payload.type
        if ("parentId" in payload)
          s.parentId = payload.parentId == null ? "" : String(payload.parentId)
        if ("assigneeId" in payload)
          s.assigneeId = payload.assigneeId == null ? "" : String(payload.assigneeId)
        if ("sprintId" in payload)
          s.sprintId = payload.sprintId == null ? "" : String(payload.sprintId)
        if ("discipline" in payload && typeof payload.discipline === "string")
          s.discipline = payload.discipline
        if ("dueDate" in payload) {
          s.dueDate = payload.dueDate == null ? "" : isoToDateValue(String(payload.dueDate))
        }
        if ("hoursEst" in payload)
          s.hoursEst = payload.hoursEst == null ? "" : String(payload.hoursEst)
        if ("hoursActual" in payload)
          s.hoursActual = payload.hoursActual == null ? "" : String(payload.hoursActual)
        serverRef.current = s
        setSaveState("saved")
        setTimeout(() => setSaveState("idle"), 2000)
      } catch {
        onFailure?.()
        setSaveState("error")
      }
    },
    [props.ticket.id, props.workspaceId]
  )

  useEffect(() => {
    if (!props.canEdit) return
    if (title === serverRef.current.title) return
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current)
    titleDebounceRef.current = setTimeout(() => {
      if (title.trim().length < 2) return
      const attempt = title
      void patch({ title: attempt }, () => setTitle(serverRef.current.title))
    }, 600)
    return () => {
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current)
    }
  }, [title, props.canEdit, patch])

  useEffect(() => {
    if (!props.canEdit) return
    if (description === serverRef.current.description) return
    if (descDebounceRef.current) clearTimeout(descDebounceRef.current)
    descDebounceRef.current = setTimeout(() => {
      const attempt = description
      void patch(
        { description: attempt.trim() ? attempt : null },
        () => setDescription(serverRef.current.description)
      )
    }, 600)
    return () => {
      if (descDebounceRef.current) clearTimeout(descDebounceRef.current)
    }
  }, [description, props.canEdit, patch])

  async function onStatusChange(next: string) {
    const prev = serverRef.current.status
    setStatus(next)
    if (!props.canEdit) return
    await patch({ status: next }, () => setStatus(prev))
  }

  async function onTypeChange(next: string) {
    const prev = serverRef.current.type
    setType(next)
    if (!props.canEdit) return
    await patch({ type: next }, () => setType(prev))
  }

  async function onEpicChange(next: string) {
    const prev = serverRef.current.parentId
    setParentId(next)
    if (!props.canEdit) return
    await patch({ parentId: next ? next : null }, () => setParentId(prev))
  }

  async function onAssigneeChange(next: string) {
    const prev = serverRef.current.assigneeId
    setAssigneeId(next)
    if (!props.canEdit) return
    await patch({ assigneeId: next ? next : null }, () => setAssigneeId(prev))
  }

  async function onSprintChange(next: string) {
    const prev = serverRef.current.sprintId
    setSprintId(next)
    if (!props.canEdit) return
    await patch({ sprintId: next ? next : null }, () => setSprintId(prev))
  }

  async function onDisciplineChange(next: string) {
    const prev = serverRef.current.discipline
    setDiscipline(next)
    if (!props.canEdit) return
    await patch({ discipline: next }, () => setDiscipline(prev))
  }

  async function onDueDateChange(next: string) {
    const prev = serverRef.current.dueDate
    setDueDate(next)
    if (!props.canEdit) return
    await patch({ dueDate: next ? dateValueToIso(next) : null }, () => setDueDate(prev))
  }

  async function onHoursEstChange(next: string) {
    const prev = serverRef.current.hoursEst
    setHoursEst(next)
    if (!props.canEdit) return
    const n = next.trim() === "" ? null : Number(next)
    if (n !== null && (Number.isNaN(n) || n < 0)) return
    await patch({ hoursEst: n }, () => setHoursEst(prev))
  }

  async function onHoursActualChange(next: string) {
    const prev = serverRef.current.hoursActual
    setHoursActual(next)
    if (!props.canEdit) return
    const n = next.trim() === "" ? null : Number(next)
    if (n !== null && (Number.isNaN(n) || n < 0)) return
    await patch({ hoursActual: n }, () => setHoursActual(prev))
  }

  function onAssignToMe() {
    if (!props.currentUserId || !props.canEdit) return
    void onAssigneeChange(props.currentUserId)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6 min-w-0">
        <TicketDetailHeader
          workspaceSlug={props.workspaceSlug}
          baseHref={props.baseHref}
          ticket={props.ticket}
          canEdit={props.canEdit}
          currentUserId={props.currentUserId}
          assigneeId={assigneeId}
          status={status}
          title={title}
          saveState={saveState}
          onTitleInput={setTitle}
          onAssignToMe={onAssignToMe}
        />

        <div className="border border-border bg-surface-1 rounded-lg p-4">
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!props.canEdit}
            placeholder="Add a description…"
          />
        </div>

        <TicketSubtasksPanel
          workspaceId={props.workspaceId}
          workspaceSlug={props.workspaceSlug}
          baseHref={props.baseHref}
          ticketId={props.ticket.id}
          ticketType={type}
          canEdit={props.canEdit}
          subtasks={subtasks}
          onSubtaskCreated={(t) => setSubtasks((prev) => [...prev, t])}
        />

        <TicketAttachmentsPanel
          ticketId={props.ticket.id}
          canEdit={props.canEdit}
          attachments={attachments}
          onUploaded={(items) => setAttachments((prev) => [...items, ...prev])}
        />

        <TicketActivityPanel
          workspaceId={props.workspaceId}
          ticketId={props.ticket.id}
          canEdit={props.canEdit}
          initialComments={comments}
          initialEvents={props.activityEvents}
          members={props.members.map((m) => ({
            userId: m.id,
            name: m.name || m.email?.split("@")[0] || "User",
            email: m.email ?? null,
          }))}
        />
      </div>

      <TicketDetailSidebar
        workspaceSlug={props.workspaceSlug}
        baseHref={props.baseHref}
        ticket={props.ticket}
        members={props.members}
        epics={props.epics}
        sprints={props.sprints}
        canEdit={props.canEdit}
        showAdvanced={props.showAdvanced}
        currentUserId={props.currentUserId}
        type={type}
        status={status}
        parentId={parentId}
        assigneeId={assigneeId}
        sprintId={sprintId}
        discipline={discipline}
        dueDate={dueDate}
        hoursEst={hoursEst}
        hoursActual={hoursActual}
        onTypeChange={(v) => void onTypeChange(v)}
        onStatusChange={(v) => void onStatusChange(v)}
        onEpicChange={(v) => void onEpicChange(v)}
        onAssigneeChange={(v) => void onAssigneeChange(v)}
        onSprintChange={(v) => void onSprintChange(v)}
        onDisciplineChange={(v) => void onDisciplineChange(v)}
        onDueDateChange={(v) => void onDueDateChange(v)}
        onHoursEstInput={setHoursEst}
        onHoursEstChange={(v) => void onHoursEstChange(v)}
        onHoursActualInput={setHoursActual}
        onHoursActualChange={(v) => void onHoursActualChange(v)}
        onAssignToMe={onAssignToMe}
      />
    </div>
  )
}
