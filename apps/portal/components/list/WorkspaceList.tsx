"use client"

import { useMemo, useState } from "react"
import { Loader2, Plus, Search, Users, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ticketStatusLabel } from "@/lib/ticket-display"
import {
  BILLING_STATUSES,
  WORKFLOW_STATUSES,
  laneOf,
  transitionsFor,
} from "@/lib/ticket-status"
import { PageShell } from "@/components/layout/PageShell"
import { ListCreatePanel } from "@/components/list/ListCreatePanel"
import { ListHeader } from "@/components/list/ListHeader"
import { ListTable } from "@/components/list/ListTable"
import type {
  ListLaneFilter,
  ListMember,
  ListSortKey,
  ListSprintLite,
  ListStatusFilter,
  ListTicketRow,
  ListTypeFilter,
} from "@/components/list/list-types"

const WORKFLOW_FILTERS: ListStatusFilter[] = ["all", ...WORKFLOW_STATUSES]
const BILLING_FILTERS: ListStatusFilter[] = ["all", ...BILLING_STATUSES]

const CLOSED_STATUSES = new Set(["DONE", "CANCELLED"])

const TYPE_FILTERS: { id: ListTypeFilter; label: string }[] = [
  { id: "tickets", label: "Tickets" },
  { id: "epics", label: "Epics" },
  { id: "all", label: "All" },
]

const LANE_FILTERS: { id: ListLaneFilter; label: string }[] = [
  { id: "all", label: "All lanes" },
  { id: "workflow", label: "Workflow" },
  { id: "billing", label: "Billing" },
]

function assigneeName(row: ListTicketRow) {
  return row.assigneeName ?? "Unassigned"
}

function sortValue(row: ListTicketRow, key: ListSortKey): string | number {
  switch (key) {
    case "assignee":
      return assigneeName(row).toLowerCase()
    case "sprint":
      return (row.sprint?.name ?? "").toLowerCase()
    case "dueDate":
      return row.dueDate ?? ""
    case "updatedAt":
      return row.updatedAt
    case "position":
      return row.position
    case "itemType":
      return row.itemType
    case "parent":
      return (row.parentEpicKey ?? row.subtaskOfKey ?? "").toLowerCase()
    default:
      return String(row[key as keyof ListTicketRow] ?? "").toLowerCase()
  }
}

export function WorkspaceList(props: {
  canEdit: boolean
  workspaceId: string
  workspaceSlug: string
  baseHref: string
  tickets: ListTicketRow[]
  sprints: ListSprintLite[]
  members: ListMember[]
}) {
  const [q, setQ] = useState("")
  const [typeFilter, setTypeFilter] = useState<ListTypeFilter>("tickets")
  const [laneFilter, setLaneFilter] = useState<ListLaneFilter>("all")
  const [statusFilter, setStatusFilter] = useState<ListStatusFilter>("all")
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [sortKey, setSortKey] = useState<ListSortKey>("updatedAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDiscipline, setNewDiscipline] = useState<
    "Scripts" | "GFX" | "Imports" | "Weapons" | "Branding" | "VFX" | "Hosting" | "Other"
  >("Other")
  const [newSprintId, setNewSprintId] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<ListTicketRow[]>(props.tickets)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)

  const stats = useMemo(() => {
    let openCount = 0
    let unassignedCount = 0
    let overdueCount = 0
    const now = Date.now()
    for (const t of rows) {
      if (t.itemType !== "TICKET") continue
      if (!CLOSED_STATUSES.has(t.status)) openCount++
      if (!t.assigneeName) unassignedCount++
      if (
        t.dueDate &&
        !CLOSED_STATUSES.has(t.status) &&
        new Date(t.dueDate).getTime() < now
      ) {
        overdueCount++
      }
    }
    return { openCount, unassignedCount, overdueCount }
  }, [rows])

  const statusFilters = laneFilter === "billing" ? BILLING_FILTERS : WORKFLOW_FILTERS

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((t) => {
      if (typeFilter === "tickets" && t.itemType !== "TICKET") return false
      if (typeFilter === "epics" && t.itemType !== "EPIC") return false
      if (!showSubtasks && t.subtaskOfId) return false
      if (laneFilter !== "all" && t.itemType === "TICKET" && laneOf(t.status) !== laneFilter)
        return false
      if (statusFilter !== "all" && t.status !== statusFilter) return false
      if (!needle) return true
      return (
        t.key.toLowerCase().includes(needle) ||
        t.title.toLowerCase().includes(needle) ||
        t.status.toLowerCase().includes(needle) ||
        t.discipline.toLowerCase().includes(needle) ||
        ticketStatusLabel(t.status).toLowerCase().includes(needle) ||
        assigneeName(t).toLowerCase().includes(needle) ||
        (t.sprint?.name ?? "").toLowerCase().includes(needle) ||
        (t.parentEpicKey ?? "").toLowerCase().includes(needle) ||
        (t.subtaskOfKey ?? "").toLowerCase().includes(needle)
      )
    })
  }, [rows, q, typeFilter, statusFilter, laneFilter, showSubtasks])

  const sorted = useMemo(() => {
    const list = [...filtered]
    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      const av = sortValue(a, sortKey)
      const bv = sortValue(b, sortKey)
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
    return list
  }, [filtered, sortDir, sortKey])

  const visibleIds = useMemo(() => sorted.map((r) => r.id), [sorted])
  const selectedInView = useMemo(
    () => visibleIds.filter((id) => selectedIds.has(id)).length,
    [visibleIds, selectedIds]
  )
  const allInViewSelected =
    visibleIds.length > 0 && selectedInView === visibleIds.length

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleSelectAllInView() {
    setSelectedIds((prev) => {
      if (allInViewSelected) {
        const next = new Set(prev)
        for (const id of visibleIds) next.delete(id)
        return next
      }
      const next = new Set(prev)
      for (const id of visibleIds) next.add(id)
      return next
    })
  }
  function clearSelection() {
    setSelectedIds(new Set())
  }

  function toggleSort(next: ListSortKey) {
    if (sortKey === next) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(next)
    setSortDir("asc")
  }

  async function createTicket() {
    if (!props.canEdit) return
    const title = newTitle.trim()
    if (title.length < 2) return

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: props.workspaceId,
          title,
          discipline: newDiscipline,
          sprintId: newSprintId || undefined,
          type: "TICKET",
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as {
        ticket: {
          id: string
          key: string
          title: string
          status: string
          discipline: string
          sprintId: string | null
          createdAt: string
        }
      }
      const sprint = newSprintId ? props.sprints.find((s) => s.id === newSprintId) ?? null : null
      setRows((prev) => [
        {
          id: data.ticket.id,
          key: data.ticket.key,
          title: data.ticket.title,
          itemType: "TICKET",
          status: data.ticket.status,
          discipline: data.ticket.discipline,
          position: 1000,
          dueDate: null,
          updatedAt: data.ticket.createdAt,
          sprint: sprint ? { id: sprint.id, name: sprint.name, status: sprint.status } : null,
          assigneeId: null,
          assigneeName: null,
          assigneeImage: null,
          childCount: 0,
          subtaskOfId: null,
          subtaskOfKey: null,
          parentEpicId: null,
          parentEpicKey: null,
        },
        ...prev,
      ])
      setNewTitle("")
      setNewSprintId("")
      setShowCreate(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create ticket")
    } finally {
      setSaving(false)
    }
  }

  async function bulkUpdate(payloadBuilder: (row: ListTicketRow) => Record<string, unknown> | null) {
    if (selectedIds.size === 0) return
    setBulkSaving(true)
    setBulkError(null)
    const targetRows = rows.filter((r) => selectedIds.has(r.id))
    const results = await Promise.allSettled(
      targetRows.map(async (row) => {
        const payload = payloadBuilder(row)
        if (!payload) return { id: row.id, skipped: true as const }
        const res = await fetch(`/api/tickets/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId: props.workspaceId, ...payload }),
        })
        if (!res.ok) throw new Error(await res.text())
        return { id: row.id, skipped: false as const, payload }
      })
    )
    const updates = new Map<string, Record<string, unknown>>()
    let failures = 0
    for (const r of results) {
      if (r.status === "fulfilled" && !r.value.skipped) {
        updates.set(r.value.id, r.value.payload)
      } else if (r.status === "rejected") {
        failures++
      }
    }
    setRows((prev) =>
      prev.map((row) => {
        const u = updates.get(row.id)
        if (!u) return row
        const next: ListTicketRow = { ...row }
        if (typeof u.status === "string") next.status = u.status
        if ("assigneeId" in u) {
          const id = u.assigneeId as string | null
          next.assigneeId = id
          const m = id ? props.members.find((m) => m.id === id) ?? null : null
          next.assigneeName = m?.name ?? m?.email?.split("@")[0] ?? null
          next.assigneeImage = null
        }
        return next
      })
    )
    if (failures > 0) {
      setBulkError(`${failures} ticket(s) couldn't be updated. Check transitions and try again.`)
    }
    setBulkSaving(false)
  }

  async function bulkSetStatus(status: string) {
    await bulkUpdate((row) => {
      if (row.itemType !== "TICKET") return null
      if (row.status === status) return null
      const allowed = transitionsFor(row.status)
      if (!allowed.includes(status as never)) return null
      return { status }
    })
  }

  async function bulkAssign(assigneeId: string | null) {
    await bulkUpdate((row) => {
      if (row.itemType !== "TICKET") return null
      if (row.assigneeId === assigneeId) return null
      return { assigneeId }
    })
  }

  return (
    <PageShell>
      <ListHeader
        baseHref={props.baseHref}
        total={rows.length}
        openCount={stats.openCount}
        unassignedCount={stats.unassignedCount}
        overdueCount={stats.overdueCount}
      />

      <section className="rounded-lg border border-border bg-surface-1 overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1 max-w-xl">
            <label
              htmlFor="list-search"
              className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-subtle"
            >
              Search
            </label>
            <div className="relative mt-1.5">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle pointer-events-none"
                strokeWidth={1.75}
              />
              <input
                id="list-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by key, title, status, assignee, epic…"
                className="w-full rounded-md border border-border bg-surface pl-9 pr-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-fg/25 transition-shadow"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex flex-wrap p-0.5 rounded-lg border border-border bg-surface gap-0.5">
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTypeFilter(f.id)}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors",
                    typeFilter === f.id
                      ? "bg-fg text-surface"
                      : "text-fg-muted hover:text-fg hover:bg-surface-2"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="inline-flex flex-wrap p-0.5 rounded-lg border border-border bg-surface gap-0.5">
              {LANE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setLaneFilter(f.id)
                    setStatusFilter("all")
                  }}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors",
                    laneFilter === f.id
                      ? "bg-fg text-surface"
                      : "text-fg-muted hover:text-fg hover:bg-surface-2"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-border bg-surface px-2 text-[11px] text-fg-muted hover:text-fg focus:outline-none"
              title="Filter by status"
            >
              {statusFilters.map((f) => (
                <option key={f} value={f}>
                  {f === "all" ? "All statuses" : ticketStatusLabel(f as string)}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-1.5 text-[11px] text-fg-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showSubtasks}
                onChange={(e) => setShowSubtasks(e.target.checked)}
                className="accent-fg"
              />
              Show subtasks
            </label>

            {props.canEdit ? (
              <button
                type="button"
                onClick={() => setShowCreate((v) => !v)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[11px] font-medium transition-colors",
                  showCreate
                    ? "border-fg bg-fg text-surface"
                    : "border-border bg-surface text-fg-muted hover:text-fg hover:bg-surface-2"
                )}
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                {showCreate ? "Close" : "Create"}
              </button>
            ) : null}
          </div>
        </div>

        {showCreate && props.canEdit ? (
          <div className="px-5 pb-5 border-b border-border">
            <ListCreatePanel
              sprints={props.sprints}
              title={newTitle}
              discipline={newDiscipline}
              sprintId={newSprintId}
              saving={saving}
              error={error}
              onTitleChange={setNewTitle}
              onDisciplineChange={setNewDiscipline}
              onSprintIdChange={setNewSprintId}
              onSubmit={createTicket}
              onClose={() => setShowCreate(false)}
            />
          </div>
        ) : null}

        {props.canEdit && selectedIds.size > 0 ? (
          <div className="px-5 py-3 border-b border-border bg-surface-2/40 flex flex-wrap items-center gap-2">
            <span className="text-xs text-fg font-medium tabular-nums">
              {selectedIds.size} selected
            </span>
            <select
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value
                if (v) void bulkSetStatus(v)
                e.currentTarget.selectedIndex = 0
              }}
              className="h-7 rounded-sm border border-border bg-surface px-2 text-[11px] text-fg-muted hover:text-fg focus:outline-none"
            >
              <option value="">Set status…</option>
              {[...WORKFLOW_STATUSES, ...BILLING_STATUSES].map((s) => (
                <option key={s} value={s}>
                  {ticketStatusLabel(s)}
                </option>
              ))}
            </select>
            <select
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value
                void bulkAssign(v || null)
                e.currentTarget.selectedIndex = 0
              }}
              className="h-7 rounded-sm border border-border bg-surface px-2 text-[11px] text-fg-muted hover:text-fg focus:outline-none"
            >
              <option value="">Assign…</option>
              <option value="">Unassign</option>
              {props.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.email ?? "Member"}
                </option>
              ))}
            </select>
            {bulkSaving ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-fg-muted">
                <Loader2 className="h-3 w-3 animate-spin" />
                Updating…
              </span>
            ) : null}
            {bulkError ? (
              <span className="text-[11px] text-red-500 dark:text-red-400 truncate max-w-[260px]">
                {bulkError}
              </span>
            ) : null}
            <button
              type="button"
              onClick={clearSelection}
              className="ml-auto inline-flex h-7 items-center gap-1 px-2 text-[11px] text-fg-muted hover:text-fg"
            >
              <X className="h-3 w-3" strokeWidth={1.75} />
              Clear
            </button>
            <Users className="h-3.5 w-3.5 text-fg-subtle" strokeWidth={1.75} aria-hidden />
          </div>
        ) : null}
      </section>

      <ListTable
        rows={sorted}
        workspaceSlug={props.workspaceSlug}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
        resultCount={sorted.length}
        totalCount={rows.length}
        selectable={props.canEdit}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAllInView}
        allInViewSelected={allInViewSelected}
      />
    </PageShell>
  )
}
