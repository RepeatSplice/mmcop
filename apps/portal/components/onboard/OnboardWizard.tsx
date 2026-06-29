"use client"

import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  Columns3,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react"

type StepId = "welcome" | "discord" | "request" | "tour"

export function OnboardWizard(props: {
  workspaceId: string
  workspaceSlug: string
  workspaceName: string
  hasDiscordLinked: boolean
}) {
  const router = useRouter()
  const [stepId, setStepId] = useState<StepId>("welcome")
  const [busy, setBusy] = useState(false)

  const steps = useMemo(
    () =>
      [
        { id: "welcome" as const, label: "Welcome" },
        { id: "discord" as const, label: "Connect Discord" },
        { id: "request" as const, label: "First request" },
        { id: "tour" as const, label: "Tour the board" },
      ] satisfies Array<{ id: StepId; label: string }>,
    []
  )

  const stepIndex = steps.findIndex((s) => s.id === stepId)

  async function finish(goTo: string) {
    setBusy(true)
    try {
      await fetch("/api/me/onboarded", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: props.workspaceId }),
      })
    } catch {
      /* if this fails, the wizard will just show again next visit */
    } finally {
      setBusy(false)
      router.push(goTo)
    }
  }

  function next() {
    const cur = steps.findIndex((s) => s.id === stepId)
    const nxt = steps[cur + 1]
    if (nxt) setStepId(nxt.id)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-surface-1 shadow-xl overflow-hidden">
        <header className="px-6 py-5 border-b border-border">
          <p className="text-[11px] uppercase tracking-widest text-fg-subtle">
            Welcome to Monarch Portal
          </p>
          <h1 className="mt-1 text-lg font-medium text-fg">{props.workspaceName}</h1>
          <div className="mt-4 flex items-center gap-1.5">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className={
                  "h-1.5 flex-1 rounded-full " +
                  (i <= stepIndex ? "bg-fg" : "bg-surface-2")
                }
                title={s.label}
              />
            ))}
          </div>
        </header>

        <div className="px-6 py-6">
          {stepId === "welcome" ? (
            <StepWelcome workspaceName={props.workspaceName} />
          ) : null}
          {stepId === "discord" ? (
            <StepDiscord
              hasDiscordLinked={props.hasDiscordLinked}
              onConnect={() => void signIn("discord", { callbackUrl: "/onboard" })}
              onSkip={next}
            />
          ) : null}
          {stepId === "request" ? (
            <StepRequest workspaceSlug={props.workspaceSlug} />
          ) : null}
          {stepId === "tour" ? <StepTour /> : null}
        </div>

        <footer className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 bg-surface-2/30">
          <button
            type="button"
            onClick={() =>
              void finish(`/workspace/${encodeURIComponent(props.workspaceSlug)}/summary`)
            }
            disabled={busy}
            className="text-xs text-fg-muted hover:text-fg disabled:opacity-50"
          >
            Skip for now
          </button>
          <div className="flex items-center gap-2">
            {stepIndex < steps.length - 1 ? (
              <button
                type="button"
                onClick={next}
                disabled={busy}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-fg bg-fg px-3 text-[11px] font-medium uppercase tracking-widest text-surface disabled:opacity-50"
              >
                Next
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  void finish(`/workspace/${encodeURIComponent(props.workspaceSlug)}/summary`)
                }
                disabled={busy}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-fg bg-fg px-3 text-[11px] font-medium uppercase tracking-widest text-surface disabled:opacity-50"
              >
                Open workspace
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}

function StepWelcome({ workspaceName }: { workspaceName: string }) {
  return (
    <div className="space-y-3">
      <Sparkles className="h-6 w-6 text-fg" strokeWidth={1.5} />
      <h2 className="text-base font-medium text-fg">Welcome to {workspaceName}</h2>
      <p className="text-sm text-fg-muted">
        This is your control surface for tracking work, talking to the team, and
        watching what your server / project is up to. We&apos;ll walk you through three
        quick steps:
      </p>
      <ul className="text-sm text-fg-muted space-y-1 list-disc list-inside">
        <li>Connect Discord so chat works across both apps.</li>
        <li>File your first request — bug, content drop, or question.</li>
        <li>Take a peek at the board so you know where work lives.</li>
      </ul>
    </div>
  )
}

function StepDiscord(props: {
  hasDiscordLinked: boolean
  onConnect: () => void
  onSkip: () => void
}) {
  return (
    <div className="space-y-3">
      <MessageSquare className="h-6 w-6 text-fg" strokeWidth={1.5} />
      <h2 className="text-base font-medium text-fg">Connect Discord</h2>
      <p className="text-sm text-fg-muted">
        Chat in this portal and your Discord channel are mirrored, so the team
        sees your messages either way. Connecting your Discord here also unlocks
        @mentions and notifications.
      </p>
      {props.hasDiscordLinked ? (
        <p className="text-sm text-emerald-500 inline-flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
          Discord already connected.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={props.onConnect}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-fg bg-fg px-3 text-[11px] font-medium uppercase tracking-widest text-surface"
          >
            Connect Discord
          </button>
          <button
            type="button"
            onClick={props.onSkip}
            className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-[11px] font-medium text-fg-muted hover:text-fg hover:bg-surface-2"
          >
            Maybe later
          </button>
        </div>
      )}
    </div>
  )
}

function StepRequest({ workspaceSlug }: { workspaceSlug: string }) {
  return (
    <div className="space-y-3">
      <Send className="h-6 w-6 text-fg" strokeWidth={1.5} />
      <h2 className="text-base font-medium text-fg">File your first request</h2>
      <p className="text-sm text-fg-muted">
        Requests go through a quick billing review so we can quote it, then flow
        onto the sprint board once approved. Open the request form when you have
        something — it&apos;s never urgent on day one.
      </p>
      <Link
        href={`/workspace/${encodeURIComponent(workspaceSlug)}/request`}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[11px] font-medium text-fg hover:bg-surface-2"
      >
        Open request form
      </Link>
    </div>
  )
}

function StepTour() {
  return (
    <div className="space-y-3">
      <Columns3 className="h-6 w-6 text-fg" strokeWidth={1.5} />
      <h2 className="text-base font-medium text-fg">Three things to remember</h2>
      <ul className="text-sm text-fg-muted space-y-2">
        <li>
          <strong className="text-fg">Summary</strong> shows what needs you, what
          shipped, and what&apos;s blocking. Start here every morning.
        </li>
        <li>
          <strong className="text-fg">Board</strong> is what the team is working
          on right now — sprint kanban with filters for &quot;mine&quot;.
        </li>
        <li>
          <strong className="text-fg">Chat</strong> is two-way with Discord. Mention
          someone with <code className="font-mono text-[12px]">@name</code> to ping them.
        </li>
      </ul>
    </div>
  )
}
