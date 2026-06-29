"use client"

import { useEffect, useMemo, useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Check, Inbox, Loader2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageShell } from "@/components/layout/PageShell"
import { BacklogCreatePanel, type BacklogCreateValues } from "@/components/backlog/BacklogCreatePanel"
import { BacklogEpicsPanel, type BacklogEpic } from "@/components/backlog/BacklogEpicsPanel"
import { BacklogHeader } from "@/components/backlog/BacklogHeader"
import {
  BacklogTicketCard,
  BacklogTicketCardPreview,
  BacklogTicketCardStatic,
} from "@/components/backlog/BacklogTicketCard"
import type { BacklogFilter, BacklogTicket } from "@/components/backlog/backlog-types"
import { laneOf } from "@/lib/ticket-status"

const FILTERS: { id: BacklogFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "workflow", label: "Workflow" },
  { id: "requests", label: "Requests" },
]

export function BacklogClient(props: {
  workspaceId: string
  workspaceSlug: string
  baseHref: string
  sprints: { id: string; name: string; status: string; label: string }[]
  activeSprintId: string
  epics: BacklogEpic[]
  initialTickets: BacklogTicket[]
  canEdit: boolean
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const [tickets, setTickets] = useState<BacklogTicket[]>(props.initialTickets)
  const [epics, setEpics] = useState<BacklogEpic[]>(props.epics)

  useEffect(() => {
    setTickets(props.initialTickets)
  }, [props.initialTickets])

  useEffect(() => {
    setEpics(props.epics)
  }, [props.epics])
  const [filter, setFilter] = useState<BacklogFilter>("all")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (filter === "all") return tickets
    if (filter === "workflow") return tickets.filter((t) => laneOf(t.status) === "workflow")
    return tickets.filter((t) => laneOf(t.status) === "billing")
  }, [tickets, filter])

  const orderedIds = useMemo(() => filtered.map((t) => t.id), [filtered])

  const activeTicket = useMemo(
    () => (activeId ? tickets.find((t) => t.id === activeId) ?? null : null),
    [activeId, tickets]
  )

  const stats = useMemo(() => {
    let workflowCount = 0
    let requestCount = 0
    let inSprintCount = 0
    for (const t of tickets) {
      const lane = laneOf(t.status)
      if (lane === "workflow") workflowCount++
      else requestCount++
      if (t.sprintId) inSprintCount++
    }
    return { workflowCount, requestCount, inSprintCount }
  }, [tickets])

  async function moveToSprint(ticketId: string, sprintId: string | null) {
    setError(null)
    setSaving(true)
    const prev = tickets
    setTickets((curr) =>
      curr.map((t) =>
        t.id === ticketId
          ? { ...t, sprintId, sprintName: sprintId ? sprintName(sprintId) : null }
          : t
      )
    )
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: props.workspaceId, sprintId }),
      })
      if (!res.ok) throw new Error(await res.text())
    } catch (e: unknown) {
      setTickets(prev)
      setError(e instanceof Error ? e.message : "Failed to move ticket")
    } finally {
      setSaving(false)
    }
  }

  function sprintName(id: string | null | undefined) {
    if (!id) return null
    return props.sprints.find((s) => s.id === id)?.name ?? null
  }

  function epicKey(parentId: string | null | undefined) {
    if (!parentId) return null
    return epics.find((e) => e.id === parentId)?.key ?? null
  }

  async function createTicket(values: BacklogCreateValues) {
    setError(null)
    setCreateSuccess(null)
    setSaving(true)
    try {
      const isEpic = values.type === "EPIC"
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: props.workspaceId,
          title: values.title,
          discipline: values.discipline,
          description: values.description,
          type: values.type,
          ...(isEpic
            ? {}
            : {
                sprintId: values.sprintId || undefined,
                parentId: values.parentId || undefined,
              }),
        }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => null)
        const msg =
          errBody && typeof errBody === "object" && "error" in errBody
            ? String((errBody as { error: unknown }).error)
            : await res.text()
        throw new Error(msg || "Failed to create work item")
      }
      const data = (await res.json()) as {
        ticket: {
          id: string
          key: string
          title: string
          discipline: string
          status: string
          parentId: string | null
          sprintId: string | null
        }
      }
      if (isEpic) {
        setEpics((prev) => [
          { id: data.ticket.id, key: data.ticket.key, title: data.ticket.title, childCount: 0 },
          ...prev,
        ])
        setCreateSuccess(`Epic ${data.ticket.key} created — link tickets to it when creating backlog items.`)
      } else {
        setTickets((prev) => [
          {
            id: data.ticket.id,
            key: data.ticket.key,
            title: data.ticket.title,
            discipline: data.ticket.discipline,
            status: data.ticket.status,
            sprintId: data.ticket.sprintId,
            sprintName: sprintName(data.ticket.sprintId),
            position: 0,
            parentId: data.ticket.parentId,
            parentKey: epicKey(data.ticket.parentId),
            commentsCount: 0,
          },
          ...prev,
        ])
        setCreateSuccess(`Ticket ${data.ticket.key} added to the backlog queue.`)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create work item")
    } finally {
      setSaving(false)
    }
  }

  async function persistOrder(next: BacklogTicket[]) {
    const ids = next.map((t) => t.id)
    if (ids.length === 0) return

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/tickets/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: props.workspaceId,
          orderedIds: ids,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to reorder")
    } finally {
      setSaving(false)
    }
  }

  function onDragStart(e: DragStartEvent) {
    if (!props.canEdit) return
    setActiveId(String(e.active.id))
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    if (!props.canEdit) return

    const activeIdStr = String(e.active.id)
    const overId = e.over?.id ? String(e.over.id) : null
    if (!overId || activeIdStr === overId) return

    const oldIndex = tickets.findIndex((t) => t.id === activeIdStr)
    const newIndex = tickets.findIndex((t) => t.id === overId)
    if (oldIndex < 0 || newIndex < 0) return

    const next = [...tickets]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved!)
    setTickets(next)
    await persistOrder(next)
  }

  const listSection = (
    <section className="bg-surface-1 overflow-hidden min-w-0">
      <div className="px-5 py-4 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-fg">Prioritized queue</h2>
          <p className="mt-0.5 text-xs text-fg-muted">
            {filtered.length} item{filtered.length === 1 ? "" : "s"}
            {filter !== "all" ? ` · ${FILTERS.find((f) => f.id === filter)?.label}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-0.5 rounded-lg border border-border bg-surface gap-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  filter === f.id
                    ? "bg-fg text-surface"
                    : "text-fg-muted hover:text-fg hover:bg-surface-2"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
              saving
                ? "border-border bg-surface-2 text-fg-muted"
                : error
                  ? "border-red-500/40 bg-red-500/5 text-red-600 dark:text-red-400"
                  : "border-border bg-surface text-fg-subtle"
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                Saving…
              </>
            ) : error ? (
              <span className="truncate max-w-[200px]">{error}</span>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 text-fg" strokeWidth={2} />
                Synced
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
            <Inbox className="mx-auto h-8 w-8 text-fg-subtle/40" strokeWidth={1.25} />
            <p className="mt-3 text-sm font-medium text-fg">No tickets here</p>
            <p className="mt-1 text-xs text-fg-muted max-w-sm mx-auto">
              {filter === "all"
                ? "Create a ticket to start building your backlog."
                : `No ${filter === "workflow" ? "workflow items" : "requests"} right now.`}
            </p>
          </div>
        ) : props.canEdit ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {filtered.map((t) => (
                  <BacklogTicketCard
                    key={t.id}
                    ticket={t}
                    workspaceSlug={props.workspaceSlug}
                    sprints={props.sprints}
                    onMoveToSprint={moveToSprint}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
              {activeTicket ? (
                <div className="max-w-xl">
                  <BacklogTicketCardPreview
                    ticket={activeTicket}
                    workspaceSlug={props.workspaceSlug}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => (
              <BacklogTicketCardStatic key={t.id} ticket={t} workspaceSlug={props.workspaceSlug} />
            ))}
          </div>
        )}

        {props.canEdit && filtered.length > 0 ? (
          <p className="mt-4 text-[11px] text-fg-subtle text-center sm:text-left">
            Drag by the grip to reorder · click key or title to open
          </p>
        ) : null}
      </div>
    </section>
  )

  return (
    <PageShell>
      <BacklogHeader
        baseHref={props.baseHref}
        total={tickets.length}
        workflowCount={stats.workflowCount}
        requestCount={stats.requestCount}
        inSprintCount={stats.inSprintCount}
        epicCount={epics.length}
      />

      <div className="lg:grid lg:grid-cols-[minmax(280px,340px)_1fr] lg:items-start lg:divide-x lg:divide-border">
        {props.canEdit ? (
          <>
            <div className="lg:sticky lg:top-24 space-y-3 px-4 sm:px-5 py-4 lg:py-5">
              <BacklogEpicsPanel epics={epics} workspaceSlug={props.workspaceSlug} />
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setShowCreate((v) => !v)}
                  className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface-1 text-sm font-medium text-fg hover:bg-surface-2 transition-colors"
                >
                  <Plus className="h-4 w-4" strokeWidth={2} />
                  {showCreate ? "Hide create form" : "New work item"}
                </button>
              </div>
              <div className={cn(showCreate ? "block" : "hidden", "lg:block")}>
                <BacklogCreatePanel
                  sprints={props.sprints}
                  epics={epics}
                  saving={saving}
                  error={error}
                  success={createSuccess}
                  onSubmit={createTicket}
                />
              </div>
            </div>
            {listSection}
          </>
        ) : (
          <>
            <div className="px-4 sm:px-5 py-4 lg:py-5 lg:max-w-sm">
              <BacklogEpicsPanel epics={epics} workspaceSlug={props.workspaceSlug} />
            </div>
            {listSection}
          </>
        )}
      </div>
    </PageShell>
  )
}
