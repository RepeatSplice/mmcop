"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, ExternalLink } from "lucide-react"
import { Input, Textarea } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import {
  TICKET_TEMPLATES,
  TICKET_TEMPLATE_KINDS,
  type TicketTemplateKind,
} from "@/lib/ticket-templates"

const schema = z.object({
  title: z.string().min(2).max(200),
  discipline: z.enum([
    "Scripts",
    "GFX",
    "Imports",
    "Weapons",
    "Branding",
    "VFX",
    "Hosting",
    "Other",
  ]),
  description: z.string().min(10).max(8000),
})

type FormValues = z.infer<typeof schema>

export function NewTicketRequestForm(props: {
  workspaceId: string
  workspaceSlug: string
  canEdit: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [kind, setKind] = useState<TicketTemplateKind>("bug")
  const [submitted, setSubmitted] = useState<{ key: string } | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", discipline: "Other", description: "" },
  })

  const templates = useMemo(
    () => TICKET_TEMPLATES.filter((t) => t.kind === kind),
    [kind]
  )

  function applyTemplate(id: string) {
    const t = TICKET_TEMPLATES.find((x) => x.id === id)
    if (!t) return
    form.setValue("title", t.title)
    form.setValue("discipline", t.discipline)
    form.setValue("description", t.description)
  }

  async function onSubmit(values: FormValues) {
    setError(null)
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: props.workspaceId,
          ...values,
          status: "REQUESTED",
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as { ticket: { key: string } }
      setSubmitted({ key: data.ticket.key })
      form.reset({ title: "", discipline: "Other", description: "" })
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create request")
    }
  }

  function startAnother() {
    setSubmitted(null)
  }

  if (!props.canEdit) {
    return (
      <p className="text-sm text-fg-muted">
        You do not have permission to request work in this workspace.
      </p>
    )
  }

  if (submitted) {
    const ticketHref = `/workspace/${props.workspaceSlug}/tickets/${submitted.key}`
    return (
      <div className="border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-4 rounded-md">
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5"
            strokeWidth={1.75}
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-fg">Request {submitted.key} submitted</h3>
            <p className="mt-1 text-sm text-fg-muted">
              Staff will review and post a quote (if needed) into the request thread. You&apos;ll
              get a notification when there&apos;s an update, and the request will appear under{" "}
              <Link href={`/workspace/${props.workspaceSlug}/backlog`} className="underline hover:text-fg">
                Backlog → Requests
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={ticketHref}
            className="inline-flex h-8 items-center gap-1.5 px-3 rounded-sm border border-fg bg-fg text-surface text-[11px] font-medium uppercase tracking-[0.14em] hover:opacity-90"
          >
            Open request
            <ExternalLink className="h-3 w-3" strokeWidth={2} />
          </Link>
          <Link
            href={`/workspace/${props.workspaceSlug}/settings/billing`}
            className="inline-flex h-8 items-center gap-1.5 px-3 rounded-sm border border-border bg-surface text-[11px] font-medium text-fg-muted hover:text-fg hover:bg-surface-2"
          >
            Quotes & payment
          </Link>
          <button
            type="button"
            onClick={startAnother}
            className="inline-flex h-8 items-center gap-1.5 px-3 rounded-sm border border-border bg-surface text-[11px] font-medium text-fg-muted hover:text-fg hover:bg-surface-2"
          >
            Submit another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-border bg-surface-1 p-6 space-y-4">
      <div>
        <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
          Request work
        </h3>
        <p className="mt-1 text-sm text-fg-muted">
          Pick a request type, fill the details, and we&apos;ll review it in your backlog. Quotes
          flow through Stripe; bug reports / admin tasks go straight to the team.
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-display text-[11px] uppercase tracking-widest text-fg-subtle">
          Type
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TICKET_TEMPLATE_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              className={
                "text-[11px] px-2.5 py-1 rounded-sm border transition-colors " +
                (kind === k.id
                  ? "border-fg bg-fg text-surface"
                  : "border-border text-fg-muted hover:text-fg hover:bg-surface-2")
              }
              title={k.hint}
            >
              {k.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-fg-subtle">
          {TICKET_TEMPLATE_KINDS.find((k) => k.id === kind)?.hint}
        </p>
      </div>

      {templates.length > 0 ? (
        <div className="space-y-2">
          <p className="font-display text-[11px] uppercase tracking-widest text-fg-subtle">
            Templates
          </p>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                className="text-[11px] px-2.5 py-1 rounded-sm border border-border hover:border-fg/30 hover:bg-surface-2 transition-colors"
                onClick={() => applyTemplate(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

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
            {[
              "Scripts",
              "GFX",
              "Imports",
              "Weapons",
              "Branding",
              "VFX",
              "Hosting",
              "Other",
            ].map((d) => (
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

        {error ? <p className="text-xs text-red-400">{error}</p> : null}

        <Button type="submit" isLoading={form.formState.isSubmitting}>
          Submit request
        </Button>
      </form>
    </div>
  )
}
