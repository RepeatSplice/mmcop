import Link from "next/link"
import { requireStaff } from "@/lib/ops"
import { prisma } from "@/lib/prisma"
import { PageShell } from "@/components/layout/PageShell"
import { OpsMetaPill, OpsPageHeader } from "@/components/ops/OpsPageHeader"
import { OpsSection } from "@/components/ops/OpsSection"
import { RetainerCheckoutButton } from "@/components/ops/RetainerCheckoutButton"
import { DiscordProvisionButton } from "@/components/settings/DiscordProvisionButton"
import { DeleteWorkspaceButton } from "@/components/ops/DeleteWorkspaceButton"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function OpsWorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff()
  const { id } = await params

  const [ws, discord, sprints] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { email: true, name: true } } } },
        _count: { select: { tickets: true, tasks: true, jobs: true } },
      },
    }),
    prisma.workspaceDiscord.findUnique({
      where: { workspaceId: id },
      select: {
        provisionedAt: true,
        lastError: true,
        chatChannelId: true,
        categoryId: true,
      },
    }),
    prisma.sprint.findMany({
      where: { workspaceId: id },
      orderBy: [{ startDate: "desc" }],
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        hoursMax: true,
        hoursUsed: true,
        _count: { select: { tasks: true } },
      },
      take: 100,
    }),
  ])

  if (!ws) {
    return (
      <PageShell>
        <OpsPageHeader title="Workspace not found" description="This workspace may have been deleted." />
        <OpsSection title="Back">
          <Link
            href="/ops/workspaces"
            className="text-sm text-fg-muted hover:text-fg underline-offset-2 hover:underline"
          >
            ← All workspaces
          </Link>
        </OpsSection>
      </PageShell>
    )
  }

  const canDelete = staff.role === "OPS_ADMIN"

  return (
    <PageShell>
      <OpsPageHeader
        title={ws.name}
        description={`Client workspace · /${ws.slug}`}
        meta={
          <>
            <OpsMetaPill>{ws._count.tickets} tickets</OpsMetaPill>
            <OpsMetaPill>{ws.members.length} members</OpsMetaPill>
            {discord?.provisionedAt ? (
              <OpsMetaPill tone="success">Discord live</OpsMetaPill>
            ) : (
              <OpsMetaPill tone="warn">Discord pending</OpsMetaPill>
            )}
          </>
        }
        actions={
          <Link
            href={`/workspace/${ws.slug}/board`}
            className="inline-flex h-9 items-center rounded-md border border-border px-4 font-display text-[11px] uppercase tracking-widest text-fg hover:bg-surface-2"
          >
            Open board
          </Link>
        }
      />

      <OpsSection title="Overview">
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="font-display text-[10px] uppercase tracking-widest text-fg-subtle">Stripe customer</dt>
            <dd className="mt-1 font-mono text-xs text-fg-muted break-all">{ws.stripeCustomerId ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-display text-[10px] uppercase tracking-widest text-fg-subtle">Subscription</dt>
            <dd className="mt-1 font-mono text-xs text-fg-muted break-all">
              {ws.stripeSubscriptionId ?? "—"}
              {ws.stripeSubscriptionStatus ? ` (${ws.stripeSubscriptionStatus})` : ""}
            </dd>
          </div>
          <div>
            <dt className="font-display text-[10px] uppercase tracking-widest text-fg-subtle">Tasks / jobs</dt>
            <dd className="mt-1 text-fg-muted">
              {ws._count.tasks} tasks · {ws._count.jobs} jobs
            </dd>
          </div>
          <div>
            <dt className="font-display text-[10px] uppercase tracking-widest text-fg-subtle">Created</dt>
            <dd className="mt-1 text-fg-muted">{ws.createdAt.toLocaleString()}</dd>
          </div>
        </dl>
      </OpsSection>

      <OpsSection title="Discord">
        {discord?.provisionedAt ? (
          <p className="text-sm text-emerald-400/90">
            Provisioned {new Date(discord.provisionedAt).toLocaleString()}
          </p>
        ) : (
          <p className="text-sm text-fg-muted">
            {discord?.lastError ? `Provision failed: ${discord.lastError}` : "Not provisioned"}
          </p>
        )}
        {discord?.chatChannelId ? (
          <p className="mt-2 font-mono text-[11px] text-fg-subtle break-all">#chat {discord.chatChannelId}</p>
        ) : null}
        {!discord?.provisionedAt ? (
          <div className="mt-4">
            <DiscordProvisionButton
              workspaceId={ws.id}
              alreadyProvisioned={Boolean(discord?.provisionedAt)}
            />
          </div>
        ) : null}
      </OpsSection>

      <OpsSection title="Members">
        <ul className="divide-y divide-border rounded-md border border-border overflow-hidden">
          {ws.members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-4 bg-surface px-4 py-3 text-sm"
            >
              <span className="text-fg truncate">{m.user.email ?? m.user.name ?? m.userId}</span>
              <span className="shrink-0 font-display text-[10px] uppercase tracking-widest text-fg-subtle">
                {m.role}
              </span>
            </li>
          ))}
        </ul>
      </OpsSection>

      <OpsSection title="Retainer billing">
        <RetainerCheckoutButton workspaceId={ws.id} />
      </OpsSection>

      <OpsSection title="Sprints" description="Create and manage sprint lifecycle for this client.">
        <form
          action={`/api/workspaces/${ws.id}/sprints`}
          method="post"
          className="mb-6 rounded-md border border-border bg-surface p-4 grid gap-3 md:grid-cols-5"
        >
          <div className="md:col-span-2">
            <label className="font-display text-[11px] uppercase tracking-widest text-fg-subtle">Name</label>
            <input
              name="name"
              className="mt-1 w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-fg focus:border-monarch-500 focus:outline-none"
              placeholder="Sprint May W1"
              required
            />
          </div>
          <div>
            <label className="font-display text-[11px] uppercase tracking-widest text-fg-subtle">Start</label>
            <input
              type="datetime-local"
              name="startDate"
              className="mt-1 w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-fg focus:border-monarch-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="font-display text-[11px] uppercase tracking-widest text-fg-subtle">End</label>
            <input
              type="datetime-local"
              name="endDate"
              className="mt-1 w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-fg focus:border-monarch-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="font-display text-[11px] uppercase tracking-widest text-fg-subtle">Hours cap</label>
            <input
              type="number"
              name="hoursMax"
              min={1}
              max={10000}
              className="mt-1 w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-fg focus:border-monarch-500 focus:outline-none"
              required
            />
          </div>
          <div className="md:col-span-5">
            <button
              type="submit"
              className="h-10 rounded-md border border-monarch-500 bg-monarch-500 px-4 font-display text-xs uppercase tracking-widest text-white hover:bg-monarch-600"
            >
              Create sprint
            </button>
          </div>
        </form>

        <div className="space-y-2">
          {sprints.length === 0 ? (
            <p className="text-sm text-fg-muted">No sprints yet.</p>
          ) : (
            sprints.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-surface px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg truncate">{s.name}</p>
                  <p className="mt-1 text-xs text-fg-muted">
                    {s.status} · {s.startDate.toLocaleDateString()} – {s.endDate.toLocaleDateString()} ·{" "}
                    {s._count.tasks} tasks · {s.hoursUsed}/{s.hoursMax}h
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.status !== "ACTIVE" ? (
                    <form action={`/api/ops/sprints/${s.id}/activate`} method="post">
                      <button
                        type="submit"
                        className="h-8 rounded-md border border-border px-3 text-[11px] text-fg-muted hover:bg-surface-2 hover:text-fg"
                      >
                        Activate
                      </button>
                    </form>
                  ) : null}
                  {s.status !== "COMPLETE" ? (
                    <form action={`/api/ops/sprints/${s.id}/complete`} method="post">
                      <button
                        type="submit"
                        className="h-8 rounded-md border border-border px-3 text-[11px] text-fg-muted hover:bg-surface-2 hover:text-fg"
                      >
                        Complete
                      </button>
                    </form>
                  ) : null}
                  {s.status !== "CANCELLED" ? (
                    <form action={`/api/ops/sprints/${s.id}/cancel`} method="post">
                      <button
                        type="submit"
                        className="h-8 rounded-md border border-red-500/30 px-3 text-[11px] text-red-300 hover:bg-red-500/10"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </OpsSection>

      {canDelete ? (
        <OpsSection
          title="Danger zone"
          description="Permanently remove this workspace and all portal data. Discord channels are not deleted automatically."
          danger
        >
          <DeleteWorkspaceButton
            workspaceId={ws.id}
            workspaceName={ws.name}
            workspaceSlug={ws.slug}
          />
        </OpsSection>
      ) : null}
    </PageShell>
  )
}
