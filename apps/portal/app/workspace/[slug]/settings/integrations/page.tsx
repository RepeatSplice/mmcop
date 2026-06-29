import { requireWorkspaceMember } from "@/lib/workspace"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { IntegrationsSettingsClient } from "@/components/settings/IntegrationsSettingsClient"
import { AuditLogCard } from "@/components/settings/AuditLogCard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function IntegrationsSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const access = await requireWorkspaceMember(slug)

  const session = await auth()
  const userId = (session?.user as { id?: string } | undefined)?.id
  const staff = userId
    ? await prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } })
    : null
  const canAdmin =
    Boolean(staff?.active) || access.role === "OWNER" || access.role === "ADMIN"

  const [conns, discord, events] = await Promise.all([
    prisma.integrationConnection.findMany({
      where: { workspaceId: access.workspace.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.workspaceDiscord.findUnique({
      where: { workspaceId: access.workspace.id },
      select: {
        provisionedAt: true,
        lastError: true,
        guildId: true,
        categoryId: true,
        chatChannelId: true,
        announcementsChannelId: true,
        logsChannelId: true,
        infoChannelId: true,
      },
    }),
    prisma.activityEvent.findMany({
      where: {
        workspaceId: access.workspace.id,
        type: { startsWith: "integration." },
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

  return (
    <>
    <IntegrationsSettingsClient
      workspaceId={access.workspace.id}
      workspaceSlug={access.workspace.slug}
      viewerRole={access.role}
      showServerLink={canAdmin}
      discord={
        discord
          ? {
              provisionedAt: discord.provisionedAt?.toISOString() ?? null,
              lastError: discord.lastError,
              guildId: discord.guildId,
              categoryId: discord.categoryId,
              chatChannelId: discord.chatChannelId,
              announcementsChannelId: discord.announcementsChannelId,
              logsChannelId: discord.logsChannelId,
              infoChannelId: discord.infoChannelId,
            }
          : null
      }
      connections={conns.map((c) => ({
        id: c.id,
        type: c.type,
        externalId: c.externalId,
        jobId: c.jobId,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
    <AuditLogCard
      title="Integrations audit log"
      events={events.map((e) => ({
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
