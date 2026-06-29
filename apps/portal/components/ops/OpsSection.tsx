import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function OpsSection(props: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  danger?: boolean
}) {
  return (
    <section className={cn("border-b border-border last:border-b-0", props.className)}>
      <div
        className={cn(
          "flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8",
          props.danger && "border-red-500/20 bg-red-500/[0.03]"
        )}
      >
        <div>
          <h2
            className={cn(
              "font-display text-[11px] uppercase tracking-[0.2em]",
              props.danger ? "text-red-300/90" : "text-fg-subtle"
            )}
          >
            {props.title}
          </h2>
          {props.description ? (
            <p className="mt-1 text-xs text-fg-muted max-w-xl">{props.description}</p>
          ) : null}
        </div>
        {props.actions ? <div className="flex flex-wrap gap-2">{props.actions}</div> : null}
      </div>
      <div className="px-5 py-5 sm:px-8 sm:py-6">{props.children}</div>
    </section>
  )
}

export function OpsEmpty(props: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-fg-muted">
      {props.children}
    </div>
  )
}
