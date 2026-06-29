import { requireStaff } from "@/lib/ops"
import { prisma } from "@/lib/prisma"
import { PageShell } from "@/components/layout/PageShell"
import { OpsMetaPill, OpsPageHeader } from "@/components/ops/OpsPageHeader"
import { OpsSection } from "@/components/ops/OpsSection"
import { OpsWorkspacesTable } from "@/components/ops/OpsWorkspacesTable"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function OpsWorkspacesPage() {
  const staff = await requireStaff()

  const workspaces = await prisma.workspace.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      _count: { select: { members: true, tasks: true, jobs: true, tickets: true } },
      discord: { select: { provisionedAt: true } },
    },
  })

  const rows = workspaces.map((w) => ({
    id: w.id,
    name: w.name,
    slug: w.slug,
    active: w.active,
    createdAt: w.createdAt.toISOString(),
    memberCount: w._count.members,
    ticketCount: w._count.tickets,
    taskCount: w._count.tasks,
    jobCount: w._count.jobs,
    discordProvisioned: Boolean(w.discord?.provisionedAt),
  }))

  return (
    <PageShell>
      <OpsPageHeader
        title="Workspaces"
        description="Provisioned client servers. Manage billing, sprints, Discord, or remove a workspace."
        meta={
          <>
            <OpsMetaPill>{workspaces.length} total</OpsMetaPill>
            <OpsMetaPill tone="success">
              {workspaces.filter((w) => w.discord?.provisionedAt).length} discord live
            </OpsMetaPill>
          </>
        }
      />
      <OpsSection title="All workspaces">
        <OpsWorkspacesTable workspaces={rows} canDelete={staff.role === "OPS_ADMIN"} />
      </OpsSection>
    </PageShell>
  )
}
