import { requireWorkspaceMember } from "@/lib/workspace"
import { prisma } from "@/lib/prisma"
import { MembersSettingsClient } from "@/components/settings/MembersSettingsClient"
import { AuditLogCard } from "@/components/settings/AuditLogCard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function MembersSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const access = await requireWorkspaceMember(slug)

  const [members, invites, events] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspaceId: access.workspace.id },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      include: { user: { select: { id: true, email: true, name: true, image: true } } },
      take: 200,
    }),
    prisma.workspaceInvite.findMany({
      where: {
        workspaceId: access.workspace.id,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.activityEvent.findMany({
      where: {
        workspaceId: access.workspace.id,
        type: { startsWith: "workspace." },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        createdAt: true,
        type: true,
        body: true,
        actor: { select: { name: true, email: true } },
      },
    }),
  ])

  const inviteEvents = await prisma.activityEvent.findMany({
    where: { workspaceId: access.workspace.id, type: { startsWith: "invite." } },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      createdAt: true,
      type: true,
      body: true,
      actor: { select: { name: true, email: true } },
    },
  })

  const combined = [...events, ...inviteEvents]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 25)

  return (
    <>
      <MembersSettingsClient
        workspaceId={access.workspace.id}
        workspaceSlug={access.workspace.slug}
        viewerRole={access.role}
        members={members.map((m) => ({
          id: m.id,
          userId: m.userId,
          email: m.user.email ?? "",
          name: m.user.name ?? "",
          role: m.role,
          createdAt: m.createdAt.toISOString(),
        }))}
        invites={invites.map((i) => ({
          id: i.id,
          emailLower: i.emailLower,
          role: i.role,
          createdAt: i.createdAt.toISOString(),
          expiresAt: i.expiresAt.toISOString(),
        }))}
      />
      <AuditLogCard
        title="Member audit log"
        events={combined.map((e) => ({
          id: e.id,
          createdAt: e.createdAt.toISOString(),
          type: e.type,
          body: e.body ?? "",
          actorName: e.actor?.name ?? e.actor?.email ?? null,
        }))}
      />
    </>
  )
}

