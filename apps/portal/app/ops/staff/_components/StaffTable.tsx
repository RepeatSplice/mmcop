"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Trash2, UserCheck, UserX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { OpsEmpty } from "@/components/ops/OpsSection"

export type StaffRow = {
  userId: string
  name: string | null
  email: string | null
  image: string | null
  discordUserId: string | null
  role: "STAFF" | "OPS_ADMIN" | "FINANCE"
  active: boolean
  createdAt: string
}

const ROLE_LABELS: Record<StaffRow["role"], string> = {
  OPS_ADMIN: "Ops Admin",
  FINANCE: "Finance",
  STAFF: "Staff",
}

const ROLE_BADGE: Record<StaffRow["role"], string> = {
  OPS_ADMIN: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  FINANCE: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  STAFF: "border-border bg-surface text-fg-muted",
}

function RoleBadge({ role }: { role: StaffRow["role"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 font-display text-[10px] uppercase tracking-widest",
        ROLE_BADGE[role]
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}

function RoleEditor({
  row,
  onDone,
}: {
  row: StaffRow
  onDone: () => void
}) {
  const router = useRouter()
  const [role, setRole] = useState<StaffRow["role"]>(row.role)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (role === row.role) { onDone(); return }
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/ops/staff/${row.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? "Failed to update role"); return }
      router.refresh()
      onDone()
    })
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as StaffRow["role"])}
        className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg focus:border-monarch-500 focus:outline-none"
        disabled={isPending}
      >
        <option value="STAFF">Staff</option>
        <option value="OPS_ADMIN">Ops Admin</option>
        <option value="FINANCE">Finance</option>
      </select>
      <Button size="sm" onClick={save} isLoading={isPending}>
        Save
      </Button>
      <button
        onClick={onDone}
        className="text-xs text-fg-muted hover:text-fg"
        disabled={isPending}
      >
        Cancel
      </button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  )
}

function StaffRowActions({
  row,
  currentUserId,
}: {
  row: StaffRow
  currentUserId: string
}) {
  const router = useRouter()
  const [editingRole, setEditingRole] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isSelf = row.userId === currentUserId

  function toggleActive() {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/ops/staff/${row.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !row.active }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? "Failed to update status"); return }
      router.refresh()
    })
  }

  function remove() {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/ops/staff/${row.userId}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? "Failed to remove staff"); return }
      router.refresh()
      setConfirmRemove(false)
    })
  }

  if (editingRole) {
    return <RoleEditor row={row} onDone={() => setEditingRole(false)} />
  }

  if (confirmRemove) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-fg-muted">Remove {row.name ?? row.email}?</span>
        <Button size="sm" variant="danger" onClick={remove} isLoading={isPending}>
          Confirm
        </Button>
        <button
          onClick={() => setConfirmRemove(false)}
          className="text-xs text-fg-muted hover:text-fg"
          disabled={isPending}
        >
          Cancel
        </button>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {error ? <p className="mr-2 text-xs text-red-400">{error}</p> : null}
      {!isSelf && (
        <>
          <button
            onClick={() => setEditingRole(true)}
            className="inline-flex h-8 items-center rounded-md border border-border px-2.5 text-[10px] font-display uppercase tracking-widest text-fg-muted hover:bg-surface hover:text-fg transition-colors"
            title="Change role"
          >
            Change role
          </button>
          <button
            onClick={toggleActive}
            disabled={isPending}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent transition-colors disabled:opacity-50",
              row.active
                ? "text-fg-muted hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-200"
                : "text-fg-muted hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
            )}
            title={row.active ? "Deactivate" : "Reactivate"}
          >
            {row.active ? (
              <UserX className="h-3.5 w-3.5" strokeWidth={1.5} />
            ) : (
              <UserCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
          </button>
          <button
            onClick={() => setConfirmRemove(true)}
            disabled={isPending}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-fg-muted transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
            title="Remove staff"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </>
      )}
      {isSelf && (
        <span className="text-[10px] font-display uppercase tracking-widest text-fg-subtle">You</span>
      )}
    </div>
  )
}

export function StaffTable({
  rows,
  currentUserId,
  isAdmin,
}: {
  rows: StaffRow[]
  currentUserId: string
  isAdmin: boolean
}) {
  if (rows.length === 0) {
    return <OpsEmpty>No staff members yet.</OpsEmpty>
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface font-display text-[10px] uppercase tracking-widest text-fg-subtle">
            <th className="px-4 py-3 font-normal">Member</th>
            <th className="px-4 py-3 font-normal">Discord</th>
            <th className="px-4 py-3 font-normal">Role</th>
            <th className="px-4 py-3 font-normal">Status</th>
            {isAdmin ? <th className="px-4 py-3 font-normal text-right">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface-1">
          {rows.map((row) => (
            <tr key={row.userId} className="group transition-colors hover:bg-surface-2/80">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {row.image ? (
                    <Image
                      src={row.image}
                      alt={row.name ?? ""}
                      width={32}
                      height={32}
                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-[11px] font-display uppercase text-fg-muted">
                      {(row.name ?? row.email ?? "?")[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-fg">{row.name ?? "—"}</p>
                    <p className="truncate text-[11px] text-fg-muted">{row.email ?? "—"}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                {row.discordUserId ? (
                  <span className="font-mono text-[11px] text-fg-muted">{row.discordUserId}</span>
                ) : (
                  <span className="text-[11px] text-fg-subtle">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <RoleBadge role={row.role} />
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 font-display text-[10px] uppercase tracking-widest",
                    row.active
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-border text-fg-subtle"
                  )}
                >
                  {row.active ? "Active" : "Inactive"}
                </span>
              </td>
              {isAdmin ? (
                <td className="px-4 py-3">
                  <StaffRowActions row={row} currentUserId={currentUserId} />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
