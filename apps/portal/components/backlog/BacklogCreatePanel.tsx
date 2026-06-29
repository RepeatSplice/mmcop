"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Layers, Plus, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"
import { BacklogInput, BacklogSelect, BacklogTextarea } from "@/components/backlog/BacklogField"

const createSchema = z.object({
  title: z.string().min(2).max(200),
  discipline: z.enum(["Scripts", "GFX", "Imports", "Weapons", "Branding", "VFX", "Hosting", "Other"]),
  description: z.string().max(8000).optional(),
  sprintId: z.string().optional(),
  type: z.enum(["TICKET", "EPIC"]),
  parentId: z.string().optional(),
})

export type BacklogCreateValues = z.infer<typeof createSchema>

const DISCIPLINES = ["Scripts", "GFX", "Imports", "Weapons", "Branding", "VFX", "Hosting", "Other"] as const

export function BacklogCreatePanel(props: {
  sprints: { id: string; name: string; status: string; label: string }[]
  epics: { id: string; key: string; title: string }[]
  saving: boolean
  error: string | null
  success: string | null
  onSubmit: (values: BacklogCreateValues) => Promise<void>
}) {
  const form = useForm<BacklogCreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      title: "",
      discipline: "Other",
      description: "",
      sprintId: "",
      type: "TICKET",
      parentId: "",
    },
  })

  const itemType = form.watch("type")

  return (
    <section className="border border-border bg-surface-1 overflow-hidden rounded-md">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-medium text-fg">Create work item</h2>
        <p className="mt-1 text-xs text-fg-muted">
          {itemType === "EPIC"
            ? "Create an epic to group related tickets."
            : "Create a ticket for the prioritized backlog queue."}
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit((v) => props.onSubmit(v))}
        className="p-5 space-y-4"
      >
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
            Type
          </span>
          <div className="inline-flex p-1 rounded-lg border border-border bg-surface gap-0.5 w-full">
            <button
              type="button"
              onClick={() => form.setValue("type", "TICKET")}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors",
                itemType === "TICKET"
                  ? "bg-fg text-surface"
                  : "text-fg-muted hover:text-fg hover:bg-surface-2"
              )}
            >
              <Ticket className="h-3.5 w-3.5" strokeWidth={1.75} />
              Ticket
            </button>
            <button
              type="button"
              onClick={() => form.setValue("type", "EPIC")}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors",
                itemType === "EPIC"
                  ? "bg-fg text-surface"
                  : "text-fg-muted hover:text-fg hover:bg-surface-2"
              )}
            >
              <Layers className="h-3.5 w-3.5" strokeWidth={1.75} />
              Epic
            </button>
          </div>
        </div>

        <BacklogInput
          label="Title"
          placeholder="e.g. Add new trader UI"
          {...form.register("title")}
          error={form.formState.errors.title?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BacklogSelect label="Discipline" {...form.register("discipline")}>
            {DISCIPLINES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </BacklogSelect>

          {itemType === "TICKET" ? (
            <BacklogSelect label="Sprint" {...form.register("sprintId")}>
              <option value="">No sprint</option>
              {props.sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </BacklogSelect>
          ) : (
            <div className="hidden sm:block" aria-hidden="true" />
          )}
        </div>

        {itemType === "TICKET" ? (
          <BacklogSelect label="Epic" {...form.register("parentId")}>
            <option value="">No epic</option>
            {props.epics.map((e) => (
              <option key={e.id} value={e.id}>
                {e.key}: {e.title}
              </option>
            ))}
          </BacklogSelect>
        ) : null}

        <BacklogTextarea
          label="Description"
          placeholder="Context, acceptance criteria, links…"
          {...form.register("description")}
        />

        {props.success ? (
          <p className="text-[11px] text-fg" role="status">
            {props.success}
          </p>
        ) : null}

        {props.error ? (
          <p className="text-[11px] text-red-600 dark:text-red-400" role="alert">
            {props.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={props.saving}
          className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-md border border-fg bg-fg text-surface text-[11px] font-medium uppercase tracking-[0.1em] hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          {props.saving ? "Creating…" : "Create"}
        </button>
      </form>
    </section>
  )
}
