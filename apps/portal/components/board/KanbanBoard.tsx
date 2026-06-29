"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { Check, Columns3, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { KanbanCard } from "@/components/board/KanbanCard"
import { KanbanColumn, KanbanColumnStatic } from "@/components/board/KanbanColumn"
import { BoardColumnSettings } from "@/components/board/BoardColumnSettings"
import type { BoardColumnDto } from "@/lib/board-columns"
import { resolveTicketBoardColumnId } from "@/lib/board-columns"
import type { BoardColumnConfig, KanbanTicket } from "@/components/board/kanban-types"

export type { KanbanTicket } from "@/components/board/kanban-types"

type BoardFilterState = {
  mineOnly: boolean
  epicId: string
  discipline: string
  hideSubtasks: boolean
}

const DEFAULT_FILTERS: BoardFilterState = {
  mineOnly: false,
  epicId: "",
  discipline: "",
  hideSubtasks: true,
}

function buildColumns(
  columns: BoardColumnConfig[],
  tickets: KanbanTicket[]
): Record<string, KanbanTicket[]> {
  const base: Record<string, KanbanTicket[]> = {}
  for (const c of columns) base[c.id] = []

  const sorted = [...tickets].sort((a, b) => a.position - b.position)
  for (const t of sorted) {
    const colId = resolveTicketBoardColumnId(
      { boardColumnId: t.boardColumnId, status: t.status },
      columns
    )
    if (!base[colId]) base[colId] = []
    base[colId].push({ ...t, boardColumnId: colId })
  }
  return base
}

export function KanbanBoard(props: {
  workspaceId: string
  sprintId: string
  workspaceSlug?: string
  backlogHref?: string
  canEdit?: boolean
  canManageColumns?: boolean
  currentUserId?: string | null
  initialColumns: BoardColumnDto[]
  initialTickets: KanbanTicket[]
  epics?: Array<{ id: string; key: string; title: string }>
  disciplines?: string[]
}) {
  const router = useRouter()
  const [filters, setFilters] = useState<BoardFilterState>(DEFAULT_FILTERS)
  const columnConfigs = useMemo<BoardColumnConfig[]>(
    () =>
      [...props.initialColumns]
        .sort((a, b) => a.position - b.position)
        .map((c) => ({
          id: c.id,
          label: c.label,
          status: c.status,
          position: c.position,
          color: c.color,
          isSystem: c.isSystem,
        })),
    [props.initialColumns]
  )

  const columnIds = useMemo(() => columnConfigs.map((c) => c.id), [columnConfigs])
  const columnById = useMemo(() => {
    const m = new Map<string, BoardColumnConfig>()
    for (const c of columnConfigs) m.set(c.id, c)
    return m
  }, [columnConfigs])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const [columns, setColumns] = useState<BoardColumnDto[]>(props.initialColumns)
  const [columnTickets, setColumnTickets] = useState(() =>
    buildColumns(columnConfigs, props.initialTickets)
  )

  const filteredColumnTickets = useMemo(() => {
    const out: Record<string, KanbanTicket[]> = {}
    for (const colId of columnIds) {
      const list = columnTickets[colId] ?? []
      out[colId] = list.filter((t) => {
        if (filters.hideSubtasks && t.subtaskOfId) return false
        if (filters.mineOnly && props.currentUserId && t.assigneeId !== props.currentUserId)
          return false
        if (filters.epicId && t.parentId !== filters.epicId) return false
        if (filters.discipline && t.discipline !== filters.discipline) return false
        return true
      })
    }
    return out
  }, [columnTickets, columnIds, filters, props.currentUserId])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const columnsSnapshot = useRef<Record<string, KanbanTicket[]> | null>(null)

  const sortedConfigs = useMemo(
    () =>
      [...columns]
        .sort((a, b) => a.position - b.position)
        .map((c) => ({
          id: c.id,
          label: c.label,
          status: c.status,
          position: c.position,
          color: c.color,
          isSystem: c.isSystem,
        })),
    [columns]
  )

  useEffect(() => {
    setColumns(props.initialColumns)
    setColumnTickets(buildColumns(columnConfigs, props.initialTickets))
  }, [props.initialTickets, props.initialColumns, columnConfigs])

  const onColumnsChange = useCallback((next: BoardColumnDto[]) => {
    setColumns(next)
    setColumnTickets((prev) => {
      const flat = Object.values(prev).flat()
      const configs = next
        .sort((a, b) => a.position - b.position)
        .map((c) => ({
          id: c.id,
          label: c.label,
          status: c.status,
          position: c.position,
          color: c.color,
          isSystem: c.isSystem,
        }))
      return buildColumns(configs, flat)
    })
  }, [])

  const activeTicket = useMemo(() => {
    if (!activeId) return null
    for (const colId of columnIds) {
      const found = columnTickets[colId]?.find((t) => t.id === activeId)
      if (found) {
        const col = columnById.get(colId)
        return col ? { ticket: found, column: col } : null
      }
    }
    return null
  }, [activeId, columnTickets, columnIds, columnById])

  function findContainer(id: string): string | null {
    if (columnIds.includes(id)) return id
    for (const colId of columnIds) {
      if (columnTickets[colId]?.some((t) => t.id === id)) return colId
    }
    return null
  }

  async function patchTicket(ticketId: string, payload: Record<string, unknown>) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: props.workspaceId, ...payload }),
      })
      if (!res.ok) throw new Error(await res.text())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save")
      throw e
    } finally {
      setSaving(false)
    }
  }

  async function persistOrder(columnId: string, ordered: KanbanTicket[]) {
    if (ordered.length === 0) return
    const col = columnById.get(columnId)
    if (!col) return

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/tickets/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: props.workspaceId,
          sprintId: props.sprintId,
          boardColumnId: columnId,
          status: col.status,
          orderedIds: ordered.map((t) => t.id),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to reorder")
      throw e
    } finally {
      setSaving(false)
    }
  }

  async function addCard(columnId: string, title: string) {
    const col = columnById.get(columnId)
    if (!col) return

    setError(null)
    setSaving(true)
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: props.workspaceId,
          sprintId: props.sprintId,
          title,
          discipline: "Other",
          status: col.status,
          boardColumnId: columnId,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as {
        ticket: {
          id: string
          key: string
          title: string
          status: KanbanTicket["status"]
          discipline: string
        }
      }
      const newTicket: KanbanTicket = {
        id: data.ticket.id,
        key: data.ticket.key,
        title: data.ticket.title,
        discipline: data.ticket.discipline,
        status: data.ticket.status,
        boardColumnId: columnId,
        position: 1000,
        commentsCount: 0,
        attachmentsCount: 0,
      }
      setColumnTickets((prev) => ({
        ...prev,
        [columnId]: [...(prev[columnId] ?? []), newTicket],
      }))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create card")
      throw e
    } finally {
      setSaving(false)
    }
  }

  function onDragStart(e: DragStartEvent) {
    columnsSnapshot.current = { ...columnTickets }
    setActiveId(String(e.active.id))
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const id = String(e.active.id)
    const overId = e.over?.id ? String(e.over.id) : null
    if (!overId) return

    const from = findContainer(id)
    const to = findContainer(overId)
    if (!from || !to || from === to) {
      if (from && to && from === to) {
        const fromItems = columnTickets[from] ?? []
        const activeIndex = fromItems.findIndex((t) => t.id === id)
        const overIndex = fromItems.findIndex((t) => t.id === overId)
        if (activeIndex < 0) return
        if (overIndex < 0) {
          const next = [...fromItems]
          const [moved] = next.splice(activeIndex, 1)
          next.push(moved!)
          setColumnTickets((prev) => ({ ...prev, [from]: next }))
          await persistOrder(from, next)
          return
        }
        const next = arrayMove(fromItems, activeIndex, overIndex)
        setColumnTickets((prev) => ({ ...prev, [from]: next }))
        await persistOrder(from, next)
      }
      return
    }

    const targetCol = columnById.get(to)
    if (!targetCol) return

    const fromItems = columnTickets[from] ?? []
    const toItems = columnTickets[to] ?? []
    const activeIndex = fromItems.findIndex((t) => t.id === id)
    if (activeIndex < 0) return

    const moved = fromItems[activeIndex]!
    const nextFrom = fromItems.filter((t) => t.id !== id)
    const overIndex = toItems.findIndex((t) => t.id === overId)
    const insertIndex = overIndex < 0 ? toItems.length : overIndex
    const nextTo = [...toItems]
    nextTo.splice(insertIndex, 0, {
      ...moved,
      status: targetCol.status,
      boardColumnId: to,
    })

    setColumnTickets((prev) => ({ ...prev, [from]: nextFrom, [to]: nextTo }))

    try {
      await patchTicket(id, { boardColumnId: to, status: targetCol.status })
      await Promise.all([persistOrder(from, nextFrom), persistOrder(to, nextTo)])
    } catch {
      if (columnsSnapshot.current) setColumnTickets(columnsSnapshot.current)
    }
  }

  const columnList = (
    <div className="flex gap-3 min-w-min pb-2 px-4">
      {sortedConfigs.map((col) =>
        props.canEdit ? (
          <KanbanColumn
            key={col.id}
            column={col}
            tickets={filteredColumnTickets[col.id] ?? []}
            workspaceSlug={props.workspaceSlug}
            backlogHref={props.backlogHref}
            canEdit
            onAddCard={addCard}
          />
        ) : (
          <KanbanColumnStatic
            key={col.id}
            column={col}
            tickets={filteredColumnTickets[col.id] ?? []}
            workspaceSlug={props.workspaceSlug}
            backlogHref={props.backlogHref}
          />
        )
      )}
    </div>
  )

  const filtersActive =
    filters.mineOnly ||
    filters.epicId.length > 0 ||
    filters.discipline.length > 0 ||
    !filters.hideSubtasks

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tgt = e.target as HTMLElement | null
      if (tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable))
        return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const slug = props.workspaceSlug
      if (!slug) return
      switch (e.key.toLowerCase()) {
        case "b":
          router.push(`/workspace/${slug}/backlog`)
          break
        case "l":
          router.push(`/workspace/${slug}/list`)
          break
        case "t":
          router.push(`/workspace/${slug}/timeline`)
          break
        case "g":
          router.push(`/workspace/${slug}/summary`)
          break
        case "m":
          setFilters((f) => ({ ...f, mineOnly: !f.mineOnly }))
          break
        case "escape":
          setFilters(DEFAULT_FILTERS)
          break
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [router, props.workspaceSlug])

  return (
    <div className="w-full min-w-0 flex flex-col bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-border bg-surface-1 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium",
              saving
                ? "border-border bg-surface-2 text-fg-muted"
                : error
                  ? "border-red-500/40 bg-red-500/5 text-red-600 dark:text-red-400"
                  : "border-border bg-surface text-fg-subtle"
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving…
              </>
            ) : error ? (
              <span className="truncate max-w-[240px]">{error}</span>
            ) : (
              <>
                <Check className="h-3 w-3 text-fg" />
                Synced
              </>
            )}
          </div>

          {props.currentUserId ? (
            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...f, mineOnly: !f.mineOnly }))}
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-sm border px-2 text-[11px] font-medium transition-colors",
                filters.mineOnly
                  ? "border-fg bg-fg text-surface"
                  : "border-border bg-surface text-fg-muted hover:text-fg hover:bg-surface-2"
              )}
              title="Toggle: only show tickets assigned to me (m)"
            >
              Mine
            </button>
          ) : null}

          {props.epics && props.epics.length > 0 ? (
            <select
              value={filters.epicId}
              onChange={(e) => setFilters((f) => ({ ...f, epicId: e.target.value }))}
              className="h-7 rounded-sm border border-border bg-surface px-2 text-[11px] text-fg-muted hover:text-fg focus:outline-none"
              title="Filter by epic"
            >
              <option value="">All epics</option>
              {props.epics.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.key} — {ep.title.length > 30 ? `${ep.title.slice(0, 28)}…` : ep.title}
                </option>
              ))}
            </select>
          ) : null}

          {props.disciplines && props.disciplines.length > 0 ? (
            <select
              value={filters.discipline}
              onChange={(e) => setFilters((f) => ({ ...f, discipline: e.target.value }))}
              className="h-7 rounded-sm border border-border bg-surface px-2 text-[11px] text-fg-muted hover:text-fg focus:outline-none"
              title="Filter by discipline"
            >
              <option value="">All disciplines</option>
              {props.disciplines.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          ) : null}

          <label className="inline-flex items-center gap-1 text-[11px] text-fg-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.hideSubtasks}
              onChange={(e) => setFilters((f) => ({ ...f, hideSubtasks: e.target.checked }))}
              className="accent-fg"
            />
            Hide subtasks
          </label>

          {filtersActive ? (
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="inline-flex h-7 items-center gap-1 rounded-sm border border-border bg-surface px-2 text-[11px] text-fg-muted hover:text-fg hover:bg-surface-2"
              title="Clear filters (esc)"
            >
              <X className="h-3 w-3" strokeWidth={1.75} />
              Clear
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <p className="text-[11px] text-fg-subtle hidden md:block">
            {props.canEdit ? "Drag · m mine · b backlog · l list · t timeline" : "View only"}
          </p>
          {props.canManageColumns ? (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="inline-flex h-7 items-center gap-1 rounded-sm border border-border bg-surface px-2 text-[11px] font-medium text-fg-muted hover:text-fg hover:bg-surface-2"
            >
              <Columns3 className="h-3.5 w-3.5" strokeWidth={1.75} />
              Columns
            </button>
          ) : null}
        </div>
      </div>

      {props.canEdit ? (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex-1 overflow-x-auto overscroll-x-contain py-3">{columnList}</div>
          <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
            {activeTicket ? (
              <div className="w-[280px] cursor-grabbing rotate-[1deg]">
                <KanbanCard
                  ticket={activeTicket.ticket}
                  columnColor={activeTicket.column.color}
                  workspaceSlug={props.workspaceSlug}
                  dragging
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="flex-1 overflow-x-auto overscroll-x-contain py-3">{columnList}</div>
      )}

      <BoardColumnSettings
        workspaceId={props.workspaceId}
        columns={columns}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onColumnsChange={onColumnsChange}
      />
    </div>
  )
}
