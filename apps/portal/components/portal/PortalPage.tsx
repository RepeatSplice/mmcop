import Link from "next/link"
import type { ReactNode } from "react"
import { GoBackLink } from "@/components/nav/GoBackLink"
import {
  pageContentMaxWidthClass,
  pageGutterClass,
  pageTopPaddingClass,
} from "@/components/layout/PageShell"
import { cn } from "@/lib/utils"

export function PortalPageLayout(props: {
  backHref?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "min-h-[calc(100vh-3rem)] bg-surface text-fg",
        pageGutterClass,
        pageTopPaddingClass,
        "pb-12",
        props.className
      )}
    >
      <div className={cn(pageContentMaxWidthClass, "space-y-6")}>
        {props.backHref ? <GoBackLink href={props.backHref} /> : null}
        {props.children}
      </div>
    </div>
  )
}

export function PortalPageHeader(props: {
  eyebrow?: string
  title: string
  description?: string
  meta?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {props.eyebrow ? (
          <p className="font-display text-[11px] uppercase tracking-[0.2em] text-fg-subtle">{props.eyebrow}</p>
        ) : null}
        <h1 className="mt-2 font-display text-2xl uppercase tracking-wide text-fg">{props.title}</h1>
        {props.description ? (
          <p className="mt-2 text-sm text-fg-muted leading-relaxed max-w-xl">{props.description}</p>
        ) : null}
        {props.meta ? <div className="mt-3 flex flex-wrap gap-2">{props.meta}</div> : null}
      </div>
      {props.actions ? <div className="flex shrink-0 flex-wrap gap-2">{props.actions}</div> : null}
    </header>
  )
}

export function PortalMetaPill(props: {
  children: ReactNode
  tone?: "default" | "success" | "warn"
}) {
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

export function PortalCard(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface-1 overflow-hidden divide-y divide-border",
        props.className
      )}
    >
      {props.children}
    </div>
  )
}

export function PortalSection(props: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={props.className}>
      {(props.title || props.description || props.actions) && (
        <div className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-display text-[11px] uppercase tracking-[0.2em] text-fg-subtle">{props.title}</h2>
            {props.description ? (
              <p className="mt-1 text-xs text-fg-muted leading-relaxed max-w-lg">{props.description}</p>
            ) : null}
          </div>
          {props.actions ? <div className="flex flex-wrap gap-2 shrink-0">{props.actions}</div> : null}
        </div>
      )}
      <div className="px-6 py-5">{props.children}</div>
    </section>
  )
}

export function PortalAccountPanel(props: {
  email: string
  name: string | null
  discordLabel: string | null
  discordLinked: boolean
  connectDiscordAction?: ReactNode
}) {
  return (
    <div className="space-y-3">
      <PortalProfileRow label="Email" value={props.email || "—"} />
      <PortalProfileRow
        label="Your Discord"
        value={props.discordLabel ?? "Not connected"}
        warn={!props.discordLinked}
      />
      {props.name ? <PortalProfileRow label="Name" value={props.name} /> : null}
      {props.connectDiscordAction}
    </div>
  )
}

export function PortalProfileRow(props: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
      <span className="font-display text-[10px] uppercase tracking-widest text-fg-subtle w-28 shrink-0">
        {props.label}
      </span>
      <span className={cn("text-sm break-all", props.warn ? "text-amber-200/90" : "text-fg")}>{props.value}</span>
    </div>
  )
}

export function PortalEmpty(props: { icon?: ReactNode; title: string; description: string; children?: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-dashed border-border bg-surface px-6 py-10 text-center">
        <div className="mx-auto max-w-md space-y-3">
          {props.icon}
          <p className="text-sm font-medium text-fg">{props.title}</p>
          <p className="text-xs text-fg-muted leading-relaxed">{props.description}</p>
        </div>
      </div>
      {props.children ? <div className="flex flex-wrap justify-center gap-3">{props.children}</div> : null}
    </div>
  )
}

export function portalPrimaryLinkClassName() {
  return "inline-flex h-10 items-center gap-2 rounded-md border border-monarch-500 bg-monarch-500 px-5 text-[11px] font-display uppercase tracking-widest text-white hover:bg-monarch-600 transition-colors"
}

export function portalSecondaryLinkClassName() {
  return "inline-flex h-9 items-center gap-2 rounded-md border border-border px-4 text-[11px] font-display uppercase tracking-widest text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors"
}

export function PortalStatusBanner(props: {
  tone: "amber" | "red" | "emerald" | "neutral"
  label: string
  children: ReactNode
  action?: ReactNode
}) {
  const styles = {
    amber: "border-amber-500/25 bg-amber-500/[0.06]",
    red: "border-red-500/25 bg-red-500/[0.06]",
    emerald: "border-emerald-500/25 bg-emerald-500/[0.06]",
    neutral: "border-border bg-surface",
  }
  const labelStyles = {
    amber: "text-amber-200/90",
    red: "text-red-300/90",
    emerald: "text-emerald-300/90",
    neutral: "text-fg-subtle",
  }
  return (
    <div className={cn("rounded-md border px-5 py-4", styles[props.tone])}>
      <p className={cn("font-display text-[11px] uppercase tracking-widest", labelStyles[props.tone])}>
        {props.label}
      </p>
      <div className="mt-2 text-sm text-fg-muted leading-relaxed">{props.children}</div>
      {props.action ? <div className="mt-4">{props.action}</div> : null}
    </div>
  )
}

export function applicationStatusPillClass(status: "SUBMITTED" | "APPROVED" | "REJECTED") {
  if (status === "APPROVED") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
  if (status === "REJECTED") return "border-red-500/30 bg-red-500/10 text-red-300"
  return "border-border bg-surface-2 text-fg-muted"
}

export function ApplicationStatusLink(props: { href: string; children: ReactNode; primary?: boolean }) {
  if (props.primary) {
    return (
      <Link href={props.href} className={portalPrimaryLinkClassName()}>
        {props.children}
      </Link>
    )
  }
  return (
    <Link
      href={props.href}
      className="inline-flex text-[11px] font-display uppercase tracking-widest text-fg-muted hover:text-fg"
    >
      {props.children}
    </Link>
  )
}
