"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input, Textarea } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

const schema = z.object({
  type: z.enum(["FIXED", "HOURLY_ESTIMATE"]),
  amount: z.string().min(1),
  currency: z.string().min(3).max(8),
  scope: z.string().min(10).max(8000),
  timeline: z.string().max(2000).optional(),
})

export function CreateQuoteForm({ jobId }: { jobId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { type: "FIXED", amount: "", currency: "usd", scope: "", timeline: "" },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    setError(null)
    setOk(false)
    try {
      const cents = Math.round(Number(values.amount) * 100)
      if (!Number.isFinite(cents) || cents <= 0) throw new Error("Amount must be a positive number")

      const res = await fetch(`/api/ops/jobs/${jobId}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: values.type,
          amountCents: cents,
          currency: values.currency.toLowerCase(),
          scope: values.scope,
          timeline: values.timeline || undefined,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setOk(true)
      form.reset({ type: "FIXED", amount: "", currency: "usd", scope: "", timeline: "" })
    } catch (e: any) {
      setError(e?.message || "Failed")
    }
  }

  return (
    <div className="border border-border bg-surface p-4">
      <h4 className="font-display text-[11px] uppercase tracking-[0.2em] text-fg-subtle mb-3">
        Create quote
      </h4>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="font-display text-[11px] uppercase tracking-widest text-fg-subtle">
              Type
            </label>
            <select
              className="bg-surface border border-border px-3 py-2 text-sm text-fg focus:outline-none focus:border-monarch-500 transition-colors"
              {...form.register("type")}
            >
              <option value="FIXED">Fixed</option>
              <option value="HOURLY_ESTIMATE">Hourly estimate</option>
            </select>
          </div>
          <Input
            id="amount"
            label="Amount"
            placeholder="e.g. 1200"
            {...form.register("amount")}
            error={form.formState.errors.amount?.message}
          />
          <Input
            id="currency"
            label="Currency"
            placeholder="usd"
            {...form.register("currency")}
            error={form.formState.errors.currency?.message}
          />
        </div>

        <Textarea
          id="scope"
          label="Scope *"
          {...form.register("scope")}
          error={form.formState.errors.scope?.message}
        />
        <Textarea id="timeline" label="Timeline (optional)" {...form.register("timeline")} />

        {error && <p className="text-xs text-red-400">{error}</p>}
        {ok && <p className="text-xs text-emerald-300">Quote created.</p>}

        <Button type="submit" isLoading={form.formState.isSubmitting}>
          Send quote
        </Button>
      </form>
    </div>
  )
}

