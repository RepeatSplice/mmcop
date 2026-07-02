import { requireStaff } from "@/lib/ops"
import { prisma } from "@/lib/prisma"
import { PageShell } from "@/components/layout/PageShell"
import { OpsMetaPill, OpsPageHeader } from "@/components/ops/OpsPageHeader"
import { OpsSection } from "@/components/ops/OpsSection"
import { StaffTable } from "./_components/StaffTable"
import { AddStaffForm } from "./_components/AddStaffForm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function OpsStaffPage() {
  const caller = await requireStaff()
  const isAdmin = caller.role === "OPS_ADMIN"

  const profiles = await prisma.staffProfile.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          discordUserId: true,
        },
      },
    },
  })

  const rows = profiles.map((p) => ({
    userId: p.userId,
    name: p.user.name,
    email: p.user.email,
    image: p.user.image,
    discordUserId: p.user.discordUserId,
    role: p.role as "STAFF" | "OPS_ADMIN" | "FINANCE",
    active: p.active,
    createdAt: p.createdAt.toISOString(),
  }))

  const activeCount = rows.filter((r) => r.active).length

  return (
    <PageShell>
      <OpsPageHeader
        title="Staff"
        description="Manage who can access the operations portal and what they can do."
        meta={
          <>
            <OpsMetaPill>{rows.length} total</OpsMetaPill>
            <OpsMetaPill tone="success">{activeCount} active</OpsMetaPill>
          </>
        }
      />

      <OpsSection
        title="Team"
        description="All staff accounts and their current access level."
      >
        <StaffTable rows={rows} currentUserId={caller.userId} isAdmin={isAdmin} />
      </OpsSection>

      {isAdmin ? (
        <OpsSection
          title="Add staff member"
          description="The person must have signed into the portal at least once before they can be added."
        >
          <AddStaffForm />
        </OpsSection>
      ) : null}
    </PageShell>
  )
}
