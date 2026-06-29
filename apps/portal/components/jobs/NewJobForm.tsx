"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input, Textarea } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

const schema = z.object({
  title: z.string().min(2).max(200),
  discipline: z.enum(["Scripts", "GFX", "Imports", "Weapons", "Branding", "VFX", "Hosting", "Other"]),
  description: z.string().min(10).max(8000),
})

export function NewJobForm(props: { workspaceId: string; canEdit: boolean }) {
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", discipline: "Other", description: "" },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    setError(null)
    setOk(false)
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: props.workspaceId, ...values }),
      })
      if (!res.ok) throw new Error(await res.text())
      setOk(true)
      form.reset({ title: "", discipline: "Other", description: "" })
      // server components will refresh on navigation; keeping simple for now
    } catch (e: any) {
      setError(e?.message || "Failed to create job")
    }
  }

  if (!props.canEdit) return null

  return (
    <div className="border border-border bg-surface-1 p-6">
      <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-fg-subtle mb-4">
        New job request
      </h3>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="title"
          label="Title *"
          {...form.register("title")}
          error={form.formState.errors.title?.message}
        />

        <div className="flex flex-col gap-1">
          <label className="font-display text-[11px] uppercase tracking-widest text-fg-subtle">
            Discipline
          </label>
          <select
            className="bg-surface border border-border px-3 py-2 text-sm text-fg focus:outline-none focus:border-monarch-500 transition-colors"
            {...form.register("discipline")}
          >
            {["Scripts", "GFX", "Imports", "Weapons", "Branding", "VFX", "Hosting", "Other"].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <Textarea
          id="description"
          label="Description *"
          {...form.register("description")}
          error={form.formState.errors.description?.message}
        />

        {error && <p className="text-xs text-red-400">{error}</p>}
        {ok && <p className="text-xs text-emerald-300">Job created.</p>}

        <Button type="submit" isLoading={form.formState.isSubmitting}>
          Submit
        </Button>
      </form>
    </div>
  )
}

