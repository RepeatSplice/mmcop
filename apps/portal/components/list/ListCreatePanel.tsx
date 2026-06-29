"use client"

import { Plus } from "lucide-react"
import { BacklogInput, BacklogSelect } from "@/components/backlog/BacklogField"
import type { ListSprintLite } from "@/components/list/list-types"

const DISCIPLINES = ["Scripts", "GFX", "Imports", "Weapons", "Branding", "VFX", "Hosting", "Other"] as const

export function ListCreatePanel(props: {
  sprints: ListSprintLite[]
  title: string
  discipline: (typeof DISCIPLINES)[number]
  sprintId: string
  saving: boolean
  error: string | null
  onTitleChange: (v: string) => void
  onDisciplineChange: (v: (typeof DISCIPLINES)[number]) => void
  onSprintIdChange: (v: string) => void
  onSubmit: () => void
  onClose: () => void
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-fg">New ticket</h3>
        <button
          type="button"
          onClick={props.onClose}
          className="text-[11px] text-fg-muted hover:text-fg transition-colors"
        >
          Cancel
        </button>
      </div>

      <BacklogInput
        label="Title"
        placeholder="e.g. Add new trader UI"
        value={props.title}
        onChange={(e) => props.onTitleChange(e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <BacklogSelect
          label="Discipline"
          value={props.discipline}
          onChange={(e) => props.onDisciplineChange(e.target.value as (typeof DISCIPLINES)[number])}
        >
          {DISCIPLINES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </BacklogSelect>

        <BacklogSelect
          label="Sprint"
          value={props.sprintId}
          onChange={(e) => props.onSprintIdChange(e.target.value)}
        >
          <option value="">No sprint</option>
          {props.sprints.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.status})
            </option>
          ))}
        </BacklogSelect>
      </div>

      {props.error ? (
        <p className="text-[11px] text-red-600 dark:text-red-400" role="alert">
          {props.error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={props.saving || props.title.trim().length < 2}
        onClick={props.onSubmit}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-fg bg-fg px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-surface hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
        {props.saving ? "Creating…" : "Create ticket"}
      </button>
    </div>
  )
}
