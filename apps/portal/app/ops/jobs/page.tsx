import Link from "next/link"
import { requireStaff } from "@/lib/ops"
import { prisma } from "@/lib/prisma"
import { PageShell } from "@/components/layout/PageShell"
import { OpsMetaPill, OpsPageHeader } from "@/components/ops/OpsPageHeader"
import { OpsEmpty, OpsSection } from "@/components/ops/OpsSection"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function OpsJobsPage() {
  await requireStaff()

  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { workspace: { select: { slug: true, name: true } }, quotes: { orderBy: { createdAt: "desc" }, take: 1 } },
  })

  return (
    <PageShell>
      <OpsPageHeader
        title="Jobs"
        description="Quote management and delivery tracking across all clients."
        meta={<OpsMetaPill>{jobs.length} jobs</OpsMetaPill>}
      />

      <OpsSection title="All jobs">
        {jobs.length === 0 ? (
          <OpsEmpty>No jobs yet.</OpsEmpty>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border overflow-hidden">
            {jobs.map((j) => (
              <li key={j.id}>
                <Link
                  href={`/ops/jobs/${j.id}`}
                  className="flex flex-col gap-1 bg-surface px-4 py-4 hover:bg-surface-2 transition-colors sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg truncate">{j.title}</p>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      {j.key} · {j.status} · {j.workspace.name}
                    </p>
                  </div>
                  {j.quotes[0] ? (
                    <p className="shrink-0 text-xs font-mono text-fg-subtle">
                      {j.quotes[0].currency.toUpperCase()} {(j.quotes[0].amountCents / 100).toFixed(2)}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </OpsSection>
    </PageShell>
  )
}
