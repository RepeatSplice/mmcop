import { requireStaff } from "@/lib/ops"
import { prisma } from "@/lib/prisma"
import { LogTimeForm } from "@/components/ops/LogTimeForm"
import { PageShell } from "@/components/layout/PageShell"
import { OpsMetaPill, OpsPageHeader } from "@/components/ops/OpsPageHeader"
import { OpsEmpty, OpsSection } from "@/components/ops/OpsSection"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function OpsTimePage() {
  await requireStaff()

  const recent = await prisma.timeEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      workspace: { select: { name: true } },
      task: { select: { key: true, title: true } },
      job: { select: { key: true, title: true } },
      staff: { select: { email: true, name: true } },
    },
  })

  const totalMinutes7d = await prisma.timeEntry.aggregate({
    _sum: { minutes: true },
    where: { createdAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
  })

  const hours7d = ((totalMinutes7d._sum.minutes ?? 0) / 60).toFixed(1)

  return (
    <PageShell>
      <OpsPageHeader
        title="Time"
        description="Log billable hours against tasks and jobs."
        meta={<OpsMetaPill>{hours7d}h logged (7d)</OpsMetaPill>}
      />

      <OpsSection title="Log time">
        <LogTimeForm />
      </OpsSection>

      <OpsSection title="Recent entries">
        {recent.length === 0 ? (
          <OpsEmpty>No time entries yet.</OpsEmpty>
        ) : (
          <ul className="space-y-2">
            {recent.map((t) => (
              <li
                key={t.id}
                className="rounded-md border border-border bg-surface px-4 py-3 text-sm"
              >
                <p className="text-xs text-fg-subtle">
                  {new Date(t.createdAt).toLocaleString()} · {t.staff.email ?? t.staff.name ?? "staff"} ·{" "}
                  {t.workspace.name}
                </p>
                <p className="mt-1 text-fg-muted">
                  {(t.minutes / 60).toFixed(2)}h · {t.billable ? "billable" : "non-billable"}
                  {t.task ? ` · ${t.task.key}` : ""}
                  {t.job ? ` · ${t.job.key}` : ""}
                </p>
                {t.note ? (
                  <p className="mt-2 text-fg-muted whitespace-pre-wrap text-xs leading-relaxed">{t.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </OpsSection>
    </PageShell>
  )
}
