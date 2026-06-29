import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function SettingsPageHeader(props: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="px-5 py-5 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-medium text-fg tracking-tight">{props.title}</h2>
        {props.description ? (
          <p className="mt-1.5 text-sm text-fg-muted max-w-xl">{props.description}</p>
        ) : null}
      </div>
      {props.action ? <div className="shrink-0">{props.action}</div> : null}
    </div>
  )
}

export function SettingsSection(props: {
  title: string
  description?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <section className={cn("px-5 py-5 border-b border-border last:border-b-0", props.className)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-fg">{props.title}</h3>
          {props.description ? (
            <p className="mt-1 text-xs text-fg-muted max-w-lg">{props.description}</p>
          ) : null}
        </div>
        {props.action}
      </div>
      {props.children}
    </section>
  )
}

export function SettingsCard(props: {
  children: ReactNode
  className?: string
  padding?: "sm" | "md"
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface",
        props.padding === "sm" ? "p-3" : "p-4",
        props.className
      )}
    >
      {props.children}
    </div>
  )
}

export function SettingsStatGrid(props: {
  items: Array<{ label: string; value: string | number; hint?: string }>
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {props.items.map((s) => (
        <div key={s.label} className="rounded-lg border border-border bg-surface px-3 py-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
            {s.label}
          </p>
          <p className="mt-1 text-lg font-medium text-fg tabular-nums">{s.value}</p>
          {s.hint ? <p className="mt-0.5 text-[11px] text-fg-muted">{s.hint}</p> : null}
        </div>
      ))}
    </div>
  )
}

export function SettingsAlert(props: {
  variant: "success" | "error" | "info"
  children: ReactNode
}) {
  const styles =
    props.variant === "success"
      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
      : props.variant === "error"
        ? "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400"
        : "border-border bg-surface-2 text-fg-muted"

  return (
    <p className={cn("rounded-md border px-3 py-2 text-xs", styles)} role="status">
      {props.children}
    </p>
  )
}
