"use client"

import Link from "next/link"
import { ArrowDown, ArrowUp, ArrowUpDown, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { ticketStatusLabel } from "@/lib/ticket-display"
import { laneOf, statusToneClass } from "@/lib/ticket-status"
import type { ListSortKey, ListTicketRow } from "@/components/list/list-types"

const COLUMNS: { key: ListSortKey | "_select"; label: string; className?: string }[] = [
  { key: "key", label: "Key", className: "w-[100px]" },
  { key: "itemType", label: "Type", className: "w-[72px]" },
  { key: "title", label: "Title" },
  { key: "status", label: "Status", className: "w-[140px]" },
  { key: "parent", label: "Parent", className: "w-[110px] hidden xl:table-cell" },
  { key: "discipline", label: "Discipline", className: "w-[100px] hidden lg:table-cell" },
  { key: "sprint", label: "Sprint", className: "w-[140px] hidden md:table-cell" },
  { key: "assignee", label: "Assignee", className: "w-[140px]" },
  { key: "position", label: "Order", className: "w-[72px] hidden sm:table-cell" },
  { key: "dueDate", label: "Due", className: "w-[100px]" },
  { key: "updatedAt", label: "Updated", className: "w-[110px]" },
]

function formatDate(iso: string | null) {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    })
  } catch {
    return "—"
  }
}

function isOverdue(row: ListTicketRow) {
  if (!row.dueDate || row.status === "DONE" || row.status === "CANCELLED") return false
  return new Date(row.dueDate).getTime() < Date.now()
}

function AssigneeCell({ name, image }: { name: string | null; image: string | null }) {
  if (!name) {
    return <span className="text-fg-subtle">Unassigned</span>
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-6 w-6 rounded-full border border-border object-cover" />
      ) : (
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-fg text-[9px] font-semibold text-surface">
          {initials || "?"}
        </span>
      )}
      <span className="truncate text-fg">{name}</span>
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  const lane = laneOf(status)
  return (
    <span
      className={cn(
        "inline-flex rounded-sm border bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        statusToneClass(status)
      )}
      title={lane === "billing" ? "Billing lane" : "Workflow lane"}
    >
      {ticketStatusLabel(status)}
    </span>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" strokeWidth={2} />
  return dir === "asc" ? (
    <ArrowUp className="h-3 w-3" strokeWidth={2} />
  ) : (
    <ArrowDown className="h-3 w-3" strokeWidth={2} />
  )
}

export function ListTable(props: {
  rows: ListTicketRow[]
  workspaceSlug: string
  sortKey: ListSortKey
  sortDir: "asc" | "desc"
  onSort: (key: ListSortKey) => void
  resultCount: number
  totalCount: number
  selectable?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
  onToggleSelectAll?: () => void
  allInViewSelected?: boolean
}) {
  const showSelect = Boolean(props.selectable && props.onToggleSelect)
  const totalColSpan = COLUMNS.length + (showSelect ? 1 : 0)

  return (
    <section className="bg-surface-1 overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3">
        <p className="text-xs text-fg-muted">
          Showing <span className="font-medium text-fg tabular-nums">{props.resultCount}</span>
          {props.resultCount !== props.totalCount ? (
            <>
              {" "}
              of <span className="font-medium text-fg tabular-nums">{props.totalCount}</span>
            </>
          ) : null}{" "}
          items
        </p>
      </div>

      <div className="overflow-x-auto overscroll-x-contain">
        <table className="min-w-[960px] w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2/40">
              {showSelect ? (
                <th className="w-[36px] px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all in view"
                    checked={props.allInViewSelected ?? false}
                    onChange={() => props.onToggleSelectAll?.()}
                    className="accent-fg"
                  />
                </th>
              ) : null}
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "text-left px-4 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle",
                    col.className
                  )}
                >
                  <button
                    type="button"
                    onClick={() => props.onSort(col.key as ListSortKey)}
                    className="inline-flex items-center gap-1 hover:text-fg transition-colors"
                  >
                    {col.label}
                    <SortIcon active={props.sortKey === col.key} dir={props.sortDir} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.rows.length === 0 ? (
              <tr>
                <td colSpan={totalColSpan} className="px-4 py-16 text-center">
                  <p className="text-sm font-medium text-fg">No tickets found</p>
                  <p className="mt-1 text-xs text-fg-muted">
                    Try a different search, lane, type, or status filter.
                  </p>
                </td>
              </tr>
            ) : (
              props.rows.map((t) => {
                const href = `/workspace/${props.workspaceSlug}/tickets/${t.key}`
                const overdue = isOverdue(t)
                const selected = props.selectedIds?.has(t.id) ?? false
                const parentLabel = t.parentEpicKey ?? t.subtaskOfKey ?? null
                const parentHref = parentLabel
                  ? `/workspace/${props.workspaceSlug}/tickets/${parentLabel}`
                  : null
                return (
                  <tr
                    key={t.id}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors group",
                      selected ? "bg-fg/[0.04] hover:bg-fg/[0.06]" : "hover:bg-surface-2/60"
                    )}
                  >
                    {showSelect ? (
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${t.key}`}
                          checked={selected}
                          onChange={() => props.onToggleSelect?.(t.id)}
                          className="accent-fg"
                        />
                      </td>
                    ) : null}
                    <td className="px-4 py-3">
                      <Link
                        href={href}
                        className="text-[11px] font-semibold text-fg tabular-nums hover:underline"
                      >
                        {t.key}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-fg-muted">
                      {t.itemType === "EPIC" ? "Epic" : t.subtaskOfId ? "Subtask" : "Ticket"}
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <Link href={href} className="text-fg font-medium line-clamp-1 hover:underline">
                        {t.title}
                        {t.itemType === "EPIC" && t.childCount > 0 ? (
                          <span className="ml-1.5 text-fg-subtle font-normal">
                            · {t.childCount} ticket{t.childCount === 1 ? "" : "s"}
                          </span>
                        ) : null}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-fg-muted hidden xl:table-cell">
                      {parentHref && parentLabel ? (
                        <Link
                          href={parentHref}
                          className="font-mono text-[11px] text-fg-muted hover:text-fg hover:underline"
                          title={t.subtaskOfKey ? "Parent ticket" : "Parent epic"}
                        >
                          {parentLabel}
                        </Link>
                      ) : (
                        <span className="text-fg-subtle">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-fg-muted hidden lg:table-cell">
                      {t.discipline}
                    </td>
                    <td className="px-4 py-3 text-xs text-fg-muted truncate max-w-[140px] hidden md:table-cell">
                      {t.sprint?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <AssigneeCell name={t.assigneeName} image={t.assigneeImage} />
                    </td>
                    <td className="px-4 py-3 text-xs text-fg-muted tabular-nums hidden sm:table-cell">
                      {t.position}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {t.dueDate ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 tabular-nums",
                            overdue ? "text-fg font-medium" : "text-fg-muted"
                          )}
                        >
                          {overdue ? (
                            <Calendar className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                          ) : null}
                          {formatDate(t.dueDate)}
                        </span>
                      ) : (
                        <span className="text-fg-subtle">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-fg-muted tabular-nums">
                      {formatDate(t.updatedAt)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
