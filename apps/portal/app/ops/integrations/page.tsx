import { requireStaff } from "@/lib/ops"
import { prisma } from "@/lib/prisma"
import { AddIntegrationForm } from "@/components/ops/AddIntegrationForm"
import { PageShell } from "@/components/layout/PageShell"
import { OpsMetaPill, OpsPageHeader } from "@/components/ops/OpsPageHeader"
import { OpsEmpty, OpsSection } from "@/components/ops/OpsSection"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function OpsIntegrationsPage() {
  await requireStaff()

  const [workspaces, conns] = await Promise.all([
    prisma.workspace.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.integrationConnection.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { workspace: { select: { name: true } } },
    }),
  ])

  return (
    <PageShell>
      <OpsPageHeader
        title="Integrations"
        description="Map GitHub repos and legacy Discord webhooks to workspace activity feeds."
        meta={<OpsMetaPill>{conns.length} connections</OpsMetaPill>}
      />

      <OpsSection title="Add connection">
        <AddIntegrationForm workspaces={workspaces} />
      </OpsSection>

      <OpsSection title="Active connections">
        {conns.length === 0 ? (
          <OpsEmpty>No integrations configured.</OpsEmpty>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border overflow-hidden">
            {conns.map((c) => (
              <li key={c.id} className="bg-surface px-4 py-3">
                <p className="text-xs text-fg-subtle">{c.workspace.name}</p>
                <p className="mt-1 text-sm text-fg">
                  {c.type} · <span className="font-mono text-xs">{c.externalId}</span>
                </p>
                {c.jobId ? <p className="mt-1 text-[11px] text-fg-muted">Job-linked</p> : null}
              </li>
            ))}
          </ul>
        )}
      </OpsSection>
    </PageShell>
  )
}
