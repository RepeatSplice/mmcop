import Link from "next/link"
import { PageShell } from "@/components/layout/PageShell"
import {
  AlertCircle,
  Columns3,
  CreditCard,
  Inbox,
  Settings2,
  Users,
} from "lucide-react"
import { SummaryActivityFeed } from "@/components/summary/SummaryActivityFeed"
import {
  CalBookingLink,
  EpicProgressList,
  PinnedUpdateBlock,
  ServerStatusCard,
  SprintHealthBanner,
  type ServerSnapshot,
} from "@/components/summary/SummaryExtras"
import { ticketStatusLabel, PIPELINE_STATUSES } from "@/lib/ticket-display"

export type SummarySprint = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  hoursMax: number
  hoursUsed: number
  status: string
}

export type SummaryTicket = {
  id: string
  key: string
  title: string
  status: string
  discipline: string | null
  dueDate: Date | null
  updatedAt: Date
}

export type SummaryActivity = {
  id: string
  createdAt: Date
  type: string
  body: string
  ticket: { key: string; title: string | null } | null
  actor: { name: string | null; email: string | null } | null
}

export type WorkspaceSummaryProps = {
  workspaceName: string
  baseHref: string
  workspaceId: string
  memberCount: number
  hasSubscription: boolean
  activeSprint: SummarySprint | null
  planningSprint: SummarySprint | null
  sprintStatusCounts: { status: string; count: number }[]
  statusTotals: { status: string; count: number }[]
  openTicketCount: number
  inProgressCount: number
  awaitingPaymentCount: number
  epicCount: number
  dueSoon: SummaryTicket[]
  attentionTickets: SummaryTicket[]
  recentTickets: SummaryTicket[]
  recentEvents: SummaryActivity[]
  server: ServerSnapshot | null
  pinnedBody: string | null
  calBookingUrl: string | null
  isStaff: boolean
  canAdminServer: boolean
  sprintAtRisk: boolean
  sprintDoneCount: number
  sprintTotalCount: number
  sprintDaysLeft: number
  needsYouTickets: SummaryTicket[]
  epicProgress: Array<{ key: string; title: string; done: number; total: number }>
}

function daysRemaining(end: Date): number {
  const ms = end.getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

function formatDateRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-fg-subtle">{label}</p>
      <p className="mt-1 text-2xl font-medium text-fg tabular-nums">{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] text-fg-muted">{sub}</p> : null}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-fg-muted">
      {ticketStatusLabel(status)}
    </span>
  )
}

export function WorkspaceSummary(props: WorkspaceSummaryProps) {
  const sprint = props.activeSprint ?? props.planningSprint
  const sprintTotal = props.sprintStatusCounts.reduce((n, s) => n + s.count, 0)
  const sprintElapsed =
    props.activeSprint != null
      ? Math.min(
          100,
          Math.max(
            0,
            ((Date.now() - props.activeSprint.startDate.getTime()) /
              (props.activeSprint.endDate.getTime() - props.activeSprint.startDate.getTime())) *
              100
          )
        )
      : 0
  const hoursPct =
    props.activeSprint && props.activeSprint.hoursMax > 0
      ? Math.min(100, (props.activeSprint.hoursUsed / props.activeSprint.hoursMax) * 100)
      : null

  const statusMap = new Map(props.statusTotals.map((s) => [s.status, s.count]))
  const pipelineMax = Math.max(1, ...PIPELINE_STATUSES.map((s) => statusMap.get(s) ?? 0))

  return (
    <PageShell>
      {/* Hero */}
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between px-4 sm:px-5 py-6 bg-surface-1">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
            Workspace overview
          </p>
          <h1 className="mt-2 text-2xl font-medium text-fg tracking-tight">{props.workspaceName}</h1>
          <p className="mt-2 text-sm text-fg-muted max-w-xl">
            Sprint progress, open work, and what changed recently — everything in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CalBookingLink url={props.calBookingUrl} />
          <Link
            href={`${props.baseHref}/board`}
            className="inline-flex h-9 items-center gap-2 rounded-sm border border-fg bg-fg px-4 text-[11px] font-medium uppercase tracking-[0.12em] text-surface hover:opacity-90 transition-opacity"
          >
            <Columns3 className="h-3.5 w-3.5" strokeWidth={1.75} />
            Open board
          </Link>
          <Link
            href={`${props.baseHref}/backlog`}
            className="inline-flex h-9 items-center gap-2 rounded-sm border border-border bg-surface px-4 text-[11px] font-medium uppercase tracking-[0.12em] text-fg hover:bg-surface-2 transition-colors"
          >
            <Inbox className="h-3.5 w-3.5" strokeWidth={1.75} />
            Backlog
          </Link>
        </div>
      </header>

      <PinnedUpdateBlock body={props.pinnedBody} />

      {/* Needs you — promoted to top so blockers surface first */}
      {props.needsYouTickets.length > 0 ? (
        <section className="bg-amber-500/[0.06] border-y border-amber-500/30 px-4 sm:px-5 py-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" strokeWidth={1.75} />
            <h2 className="text-sm font-medium text-fg">Needs you</h2>
            <span className="text-[10px] uppercase tracking-widest text-fg-subtle ml-1">
              {props.needsYouTickets.length} item{props.needsYouTickets.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {props.needsYouTickets.map((t) => (
              <li key={t.id} className="rounded-md border border-border bg-surface px-3 py-2.5">
                <Link
                  href={`${props.baseHref}/tickets/${t.key}`}
                  className="text-sm font-medium text-fg hover:underline line-clamp-1"
                >
                  <span className="font-mono text-[11px] text-fg-muted">{t.key}</span> {t.title}
                </Link>
                <div className="mt-1.5 flex items-center gap-2">
                  <StatusPill status={t.status} />
                  {t.dueDate ? (
                    <span className="text-[10px] text-fg-subtle">
                      Due {t.dueDate.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ServerStatusCard
        server={props.server}
        baseHref={props.baseHref}
        isStaff={props.isStaff}
        workspaceId={props.workspaceId}
        canAdmin={props.canAdminServer}
      />
      <SprintHealthBanner
        atRisk={props.sprintAtRisk}
        hoursPct={hoursPct}
        daysLeft={props.activeSprint ? daysRemaining(props.activeSprint.endDate) : props.sprintDaysLeft}
        doneInSprint={props.sprintDoneCount}
        totalInSprint={props.sprintTotalCount}
      />

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 px-4 sm:px-5 py-5 bg-surface-1">
        <StatCard label="Open tickets" value={props.openTicketCount} sub="Active work items" />
        <StatCard label="In progress" value={props.inProgressCount} sub="Board + delivery" />
        <StatCard
          label="Awaiting payment"
          value={props.awaitingPaymentCount}
          sub={props.awaitingPaymentCount > 0 ? "Needs approval" : "All clear"}
        />
        <StatCard
          label="Team"
          value={props.memberCount}
          sub={props.hasSubscription ? "Retainer active" : "Billing not linked"}
        />
      </section>

      <div className="grid gap-0 lg:grid-cols-12 lg:divide-x divide-border border-t border-border">
        {/* Sprint */}
        <section className="lg:col-span-7 bg-surface-1 overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-medium text-fg">
                {props.activeSprint ? "Active sprint" : props.planningSprint ? "Up next" : "Sprint"}
              </h2>
              {sprint ? (
                <p className="mt-1 text-lg font-medium text-fg">{sprint.name}</p>
              ) : (
                <p className="mt-1 text-sm text-fg-muted">No sprint scheduled yet</p>
              )}
            </div>
            {props.activeSprint ? (
              <span className="shrink-0 text-[11px] uppercase tracking-wider px-2 py-1 rounded-sm border border-fg text-fg">
                Active
              </span>
            ) : props.planningSprint ? (
              <span className="shrink-0 text-[11px] uppercase tracking-wider px-2 py-1 rounded-sm border border-border text-fg-muted">
                Planning
              </span>
            ) : null}
          </div>

          <div className="p-5 space-y-5">
            {sprint ? (
              <>
                <p className="text-sm text-fg-muted">{formatDateRange(sprint.startDate, sprint.endDate)}</p>

                {props.activeSprint ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-[11px] text-fg-subtle mb-1.5">
                        <span>Sprint timeline</span>
                        <span>{daysRemaining(props.activeSprint.endDate)} days left</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className="h-full bg-fg rounded-full transition-all"
                          style={{ width: `${sprintElapsed}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-fg-subtle mb-1.5">
                        <span>Retainer hours</span>
                        <span className="tabular-nums">
                          {props.activeSprint.hoursUsed} / {props.activeSprint.hoursMax}
                          {props.activeSprint.hoursMax === 0 ? " (flex)" : ""}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className="h-full bg-fg/70 rounded-full"
                          style={{ width: hoursPct != null ? `${hoursPct}%` : "0%" }}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-fg-subtle mb-2">
                    Tickets in sprint · {sprintTotal}
                  </p>
                  {sprintTotal === 0 ? (
                    <p className="text-sm text-fg-muted">No tickets on the board yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {props.sprintStatusCounts.map((s) => (
                        <span
                          key={s.status}
                          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface px-2 py-1 text-xs text-fg-muted"
                        >
                          <span className="font-medium text-fg tabular-nums">{s.count}</span>
                          {ticketStatusLabel(s.status)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <Link
                    href={`${props.baseHref}/board`}
                    className="text-xs font-medium text-fg hover:underline"
                  >
                    Open board →
                  </Link>
                  <Link
                    href={`${props.baseHref}/timeline`}
                    className="text-xs text-fg-muted hover:text-fg transition-colors"
                  >
                    Timeline →
                  </Link>
                  <Link
                    href={`${props.baseHref}/calendar`}
                    className="text-xs text-fg-muted hover:text-fg transition-colors"
                  >
                    Calendar →
                  </Link>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-fg-muted">
                  Your team will activate a sprint when work begins. Use the backlog to add items.
                </p>
                <Link
                  href={`${props.baseHref}/backlog`}
                  className="inline-flex text-xs font-medium text-fg hover:underline"
                >
                  Go to backlog →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Pipeline */}
        <section className="lg:col-span-5 bg-surface-1 p-5">
          <h2 className="text-sm font-medium text-fg">Work pipeline</h2>
          <p className="mt-1 text-xs text-fg-muted mb-4">All tickets by status</p>
          <div className="space-y-2.5">
            {PIPELINE_STATUSES.map((status) => {
              const count = statusMap.get(status) ?? 0
              if (count === 0) return null
              const pct = (count / pipelineMax) * 100
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-fg-muted">{ticketStatusLabel(status)}</span>
                    <span className="text-fg tabular-nums font-medium">{count}</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full bg-fg/80 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {props.statusTotals.every((s) => s.count === 0) ? (
              <p className="text-sm text-fg-muted py-4">No tickets yet.</p>
            ) : null}
          </div>
          {props.epicCount > 0 ? (
            <p className="mt-4 text-xs text-fg-subtle">{props.epicCount} epics in workspace</p>
          ) : null}
        </section>
      </div>

      <div className="grid gap-0 lg:grid-cols-12 lg:divide-x divide-border border-t border-border">
        {/* Tickets column */}
        <div className="lg:col-span-7 divide-y divide-border">
          {props.attentionTickets.length > 0 ? (
            <section className="bg-surface-1 p-5 border-b border-fg/20">
              <h2 className="text-sm font-medium text-fg">Quotes & payment</h2>
              <ul className="mt-3 divide-y divide-border">
                {props.attentionTickets.map((t) => (
                  <li key={t.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      href={`${props.baseHref}/tickets/${t.key}`}
                      className="text-sm font-medium text-fg hover:underline"
                    >
                      {t.key}: {t.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusPill status={t.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="bg-surface-1 p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-sm font-medium text-fg">Latest tickets</h2>
              <Link
                href={`${props.baseHref}/list`}
                className="text-xs text-fg-muted hover:text-fg transition-colors"
              >
                View all →
              </Link>
            </div>
            {props.recentTickets.length === 0 ? (
              <p className="text-sm text-fg-muted">No tickets yet. Create work from the backlog or board.</p>
            ) : (
              <ul className="divide-y divide-border">
                {props.recentTickets.map((t) => (
                  <li key={t.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`${props.baseHref}/tickets/${t.key}`}
                        className="text-sm font-medium text-fg hover:underline truncate block"
                      >
                        {t.key}: {t.title}
                      </Link>
                      <p className="mt-1 text-[11px] text-fg-subtle">
                        Updated {t.updatedAt.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                        {t.discipline ? ` · ${t.discipline}` : ""}
                      </p>
                    </div>
                    <StatusPill status={t.status} />
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex gap-4">
              <Link href={`${props.baseHref}/list`} className="text-xs text-fg-muted hover:text-fg">
                All work →
              </Link>
              <Link href={`${props.baseHref}/backlog`} className="text-xs text-fg-muted hover:text-fg">
                Backlog →
              </Link>
            </div>
          </section>

          {props.dueSoon.length > 0 ? (
            <section className="bg-surface-1 p-5">
              <h2 className="text-sm font-medium text-fg">Due soon</h2>
              <p className="text-xs text-fg-muted mt-1 mb-3">Next 7 days</p>
              <ul className="space-y-2">
                {props.dueSoon.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`${props.baseHref}/tickets/${t.key}`}
                      className="flex items-center justify-between gap-2 text-sm text-fg hover:underline"
                    >
                      <span className="truncate">{t.key}</span>
                      <span className="text-[11px] text-fg-subtle shrink-0 tabular-nums">
                        {t.dueDate?.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/* Activity */}
        <section className="lg:col-span-5 bg-surface-1 p-5 flex flex-col min-h-[320px]">
          <SummaryActivityFeed
            workspaceId={props.workspaceId}
            baseHref={props.baseHref}
            initialEvents={props.recentEvents.map((e) => ({
              id: e.id,
              createdAt: e.createdAt.toISOString(),
              type: e.type,
              body: e.body,
              ticket: e.ticket,
              actor: e.actor,
            }))}
          />
          <div className="mt-auto pt-4 border-t border-border flex flex-wrap gap-3">
            <Link
              href={`${props.baseHref}/settings`}
              className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg transition-colors"
            >
              <Settings2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              Workspace settings
            </Link>
            {props.hasSubscription ? (
              <Link
                href={`${props.baseHref}/settings/billing`}
                className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg transition-colors"
              >
                <CreditCard className="h-3.5 w-3.5" strokeWidth={1.75} />
                Billing
              </Link>
            ) : (
              <Link
                href={`${props.baseHref}/settings/billing`}
                className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg transition-colors"
              >
                <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
                Set up billing
              </Link>
            )}
          </div>
        </section>
      </div>

      <EpicProgressList epics={props.epicProgress} baseHref={props.baseHref} />
    </PageShell>
  )
}
