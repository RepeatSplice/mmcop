import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function OpsPageHeader(props: {
  eyebrow?: string
  title: string
  description?: string
  meta?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  const eyebrow = props.eyebrow ?? "Operations"
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-border px-5 py-6 sm:px-8 sm:py-7 md:flex-row md:items-end md:justify-between",
        props.className
      )}
    >
      <div className="min-w-0">
        <p className="font-display text-[11px] uppercase tracking-[0.2em] text-fg-subtle">{eyebrow}</p>
        <h1 className="mt-1 font-display text-2xl uppercase tracking-wide text-fg">{props.title}</h1>
        {props.description ? (
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">{props.description}</p>
        ) : null}
        {props.meta ? <div className="mt-3 flex flex-wrap gap-2">{props.meta}</div> : null}
      </div>
      {props.actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{props.actions}</div> : null}
    </header>
  )
}

export function OpsMetaPill(props: { children: ReactNode; tone?: "default" | "success" | "warn" }) {
  const tone =
    props.tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : props.tone === "warn"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
        : "border-border bg-surface text-fg-muted"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 font-display text-[10px] uppercase tracking-widest",
        tone
      )}
    >
      {props.children}
    </span>
  )
}
