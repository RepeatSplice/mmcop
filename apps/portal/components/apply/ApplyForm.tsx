"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input, Textarea } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { ApplicationStatusPill } from "@/components/portal/ApplicationStatusBlock"
import {
  PortalAccountPanel,
  PortalCard,
  PortalSection,
} from "@/components/portal/PortalPage"

const schema = z.object({
  serverName: z.string().min(2, "Server name is required").max(120),
  serverDiscord: z
    .string()
    .min(4, "Server Discord link is required")
    .max(200)
    .refine((v) => {
      const s = v.trim()
      return (
        /^https?:\/\//i.test(s) ||
        /^discord\.gg\//i.test(s) ||
        /^www\.discord\.gg\//i.test(s) ||
        /^discord\.com\/invite\//i.test(s)
      )
    }, "Use a full URL, discord.gg/…, or discord.com/invite/… link"),
  desired: z.enum(["RETAINER", "PAYG", "UNSURE"]),
  notes: z.string().max(2000).optional(),
})

type FormValues = z.infer<typeof schema>

export function ApplyForm(props: {
  profile: {
    email: string
    name: string | null
    discordLinked: boolean
    discordLabel: string | null
  }
  initial: {
    serverName: string
    serverDiscord: string
    desired: "RETAINER" | "PAYG" | "UNSURE"
    notes: string
    status: "SUBMITTED" | "APPROVED" | "REJECTED" | null
  }
}) {
  const { initial, profile } = props
  const router = useRouter()
  const [saved, setSaved] = useState<null | "submitted" | "requeued">(null)
  const [error, setError] = useState<string | null>(null)

  const defaultValues = useMemo<FormValues>(
    () => ({
      serverName: initial.serverName,
      serverDiscord: initial.serverDiscord,
      desired: initial.desired,
      notes: initial.notes,
    }),
    [initial]
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onBlur",
  })

  /** Only rejected applications are fully locked; approved requests stay editable until staff provisions. */
  const locked = initial.status === "REJECTED"
  const readOnlyApproved = initial.status === "APPROVED"

  async function onSubmit(values: FormValues) {
    setError(null)
    setSaved(null)

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || "Failed to submit")
      }
      const data = (await res.json()) as { application?: { status?: string } }
      setSaved(data.application?.status === "SUBMITTED" && initial.status === "APPROVED" ? "requeued" : "submitted")
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit. Please try again.")
    }
  }

  return (
    <PortalCard>
      <PortalSection
        title="Your account"
        description="Pulled from your sign-in. Staff uses this to contact you."
        actions={initial.status ? <ApplicationStatusPill status={initial.status} /> : null}
      >
        <PortalAccountPanel
          email={profile.email}
          name={profile.name}
          discordLabel={profile.discordLabel}
          discordLinked={profile.discordLinked}
          connectDiscordAction={
            !profile.discordLinked ? (
              <button
                type="button"
                onClick={() => signIn("discord", { callbackUrl: "/apply" })}
                className="text-[11px] font-display uppercase tracking-widest text-fg-muted hover:text-fg underline underline-offset-2"
              >
                Connect your Discord account →
              </button>
            ) : null
          }
        />
      </PortalSection>

      <PortalSection
        title="Server details"
        description="Your community Discord and server name for provisioning."
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {readOnlyApproved ? (
            <p className="text-xs text-fg-muted rounded-md border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3">
              This request is approved. You can still update server details here until your workspace appears.
            </p>
          ) : null}
          <Input
            id="serverName"
            label="Server name *"
            placeholder="e.g. Operation Monarch"
            disabled={locked}
            error={form.formState.errors.serverName?.message}
            {...form.register("serverName")}
          />

          <Input
            id="serverDiscord"
            label="Server Discord invite *"
            placeholder="https://discord.gg/your-server"
            disabled={locked}
            error={form.formState.errors.serverDiscord?.message}
            {...form.register("serverDiscord")}
          />

          <div className="flex flex-col gap-1">
            <label
              htmlFor="desired"
              className="font-display text-[11px] uppercase tracking-widest text-fg-subtle"
            >
              Interested in
            </label>
            <select
              id="desired"
              disabled={locked}
              className="rounded-md bg-surface border border-border px-3 py-2 text-sm text-fg focus:outline-none focus:border-monarch-500 transition-colors disabled:opacity-50"
              {...form.register("desired")}
            >
              <option value="UNSURE">Not sure yet</option>
              <option value="RETAINER">Retainer</option>
              <option value="PAYG">Pay-as-you-go</option>
            </select>
          </div>

          <Textarea
            id="notes"
            label="Anything to flag for us? (optional)"
            placeholder="Anything we should know before setting up your workspace…"
            disabled={locked}
            error={form.formState.errors.notes?.message}
            {...form.register("notes")}
          />

          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          {saved === "requeued" ? (
            <p className="text-xs text-emerald-300">
              Saved. Our team will take another look and get back to you.
            </p>
          ) : null}
          {saved === "submitted" ? (
            <p className="text-xs text-emerald-300">
              Got it — we&apos;ll review your request and reach out within one business day to get your workspace set up.
            </p>
          ) : null}

          {!locked ? (
            <div className="flex flex-wrap gap-3 pt-1">
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                Submit request
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => form.reset(defaultValues)}
                disabled={form.formState.isSubmitting}
              >
                Reset
              </Button>
            </div>
          ) : null}
        </form>
      </PortalSection>
    </PortalCard>
  )
}
