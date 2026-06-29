import { requireStaff } from "@/lib/ops"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/Button"
import { PageShell } from "@/components/layout/PageShell"
import { OpsMetaPill, OpsPageHeader } from "@/components/ops/OpsPageHeader"
import { OpsEmpty, OpsSection } from "@/components/ops/OpsSection"
import { isDefaultApplicationDescription } from "@/lib/application-profile"
import { ApplyAiHintButton } from "@/components/ops/ApplyAiHintButton"
import { cn } from "@/lib/utils"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function OpsApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  await requireStaff()
  const { error } = await searchParams

  const apps = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          discordUserId: true,
          memberships: {
            where: { workspace: { active: true } },
            select: { id: true },
          },
        },
      },
    },
  })

  const pending = apps.filter((a) => a.status === "SUBMITTED")
  const needsWorkspace = apps.filter(
    (a) => a.status === "APPROVED" && a.user.memberships.length === 0
  )

  function ApplicationCard(props: {
    app: (typeof apps)[number]
    approveLabel?: string
    allowApprove: boolean
  }) {
    const a = props.app
    return (
      <li className="rounded-md border border-border bg-surface p-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 font-display text-[10px] uppercase tracking-widest",
                a.status === "SUBMITTED"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                  : a.status === "APPROVED"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-border text-fg-subtle"
              )}
            >
              {a.status}
            </span>
            <span className="text-[10px] font-display uppercase tracking-widest text-fg-subtle">
              {a.desired}
            </span>
            {a.status === "APPROVED" && a.user.memberships.length === 0 ? (
              <span className="text-[10px] font-display uppercase tracking-widest text-amber-200/90">
                No workspace yet
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-lg font-medium text-fg truncate">{a.serverName}</p>
          <p className="mt-1 text-xs text-fg-muted">
            {a.user.email ?? "No email"}
            {a.user.name ? ` · ${a.user.name}` : ""}
          </p>
          {a.discord ? (
            <p className="mt-2 text-xs text-fg-muted break-all">
              Server Discord:{" "}
              <a
                href={a.discord.startsWith("http") ? a.discord : `https://${a.discord}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg hover:underline"
              >
                {a.discord}
              </a>
            </p>
          ) : null}
          {a.user.discordUserId ? (
            <p className="mt-1 text-xs font-mono text-fg-subtle">
              Applicant Discord ID: {a.user.discordUserId}
            </p>
          ) : (
            <p className="mt-1 text-xs text-amber-200/80">Applicant Discord not linked</p>
          )}
          {a.description && !isDefaultApplicationDescription(a.description) ? (
            <p className="mt-3 text-sm text-fg-muted whitespace-pre-wrap leading-relaxed">
              {a.description}
            </p>
          ) : null}
          <p className="mt-2 text-[11px] text-fg-subtle">
            Submitted {new Date(a.createdAt).toLocaleString()}
            {a.reviewedAt ? ` · Reviewed ${new Date(a.reviewedAt).toLocaleString()}` : ""}
          </p>
          {a.status === "SUBMITTED" ? (
            <div className="mt-3">
              <ApplyAiHintButton applicationId={a.id} />
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {props.allowApprove ? (
            <form action={`/api/ops/applications/${a.id}/approve`} method="post">
              <Button size="sm">{props.approveLabel ?? "Approve"}</Button>
            </form>
          ) : null}
          {a.status === "SUBMITTED" ? (
            <form action={`/api/ops/applications/${a.id}/reject`} method="post">
              <Button size="sm" variant="danger">
                Reject
              </Button>
            </form>
          ) : null}
        </div>
      </li>
    )
  }

  return (
    <PageShell>
      <OpsPageHeader
        title="Applications"
        description="Review new server requests. Approving creates a workspace, owner seat, and default sprint."
        meta={
          <>
            <OpsMetaPill>{apps.length} total</OpsMetaPill>
            {pending.length > 0 ? (
              <OpsMetaPill tone="warn">{pending.length} pending</OpsMetaPill>
            ) : null}
            {needsWorkspace.length > 0 ? (
              <OpsMetaPill tone="warn">{needsWorkspace.length} need workspace</OpsMetaPill>
            ) : null}
          </>
        }
      />

      {error ? (
        <div className="mx-5 sm:mx-8 mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {decodeURIComponent(error)}
        </div>
      ) : null}

      <OpsSection
        title="Pending review"
        description="New or re-submitted requests waiting for approval."
      >
        {pending.length === 0 ? (
          <OpsEmpty>No pending applications. Check “Approved — needs workspace” below if someone was approved but has no workspace.</OpsEmpty>
        ) : (
          <ul className="space-y-3">
            {pending.map((a) => (
              <ApplicationCard key={a.id} app={a} allowApprove />
            ))}
          </ul>
        )}
      </OpsSection>

      {needsWorkspace.length > 0 ? (
        <OpsSection
          title="Approved — needs workspace"
          description="These were approved but no workspace exists (for example after a workspace was deleted). Use Create workspace to provision again."
        >
          <ul className="space-y-3">
            {needsWorkspace.map((a) => (
              <ApplicationCard
                key={a.id}
                app={a}
                allowApprove
                approveLabel="Create workspace"
              />
            ))}
          </ul>
        </OpsSection>
      ) : null}

      <OpsSection title="All applications" description="Full history including approved and rejected.">
        {apps.length === 0 ? (
          <OpsEmpty>No applications yet.</OpsEmpty>
        ) : (
          <ul className="space-y-3">
            {apps.map((a) => (
              <ApplicationCard
                key={a.id}
                app={a}
                allowApprove={
                  a.status === "SUBMITTED" ||
                  (a.status === "APPROVED" && a.user.memberships.length === 0)
                }
                approveLabel={
                  a.status === "APPROVED" && a.user.memberships.length === 0
                    ? "Create workspace"
                    : "Approve"
                }
              />
            ))}
          </ul>
        )}
      </OpsSection>
    </PageShell>
  )
}
