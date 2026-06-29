import { requireWorkspaceMember } from "@/lib/workspace"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { SettingsOverview } from "@/components/settings/SettingsOverview"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const access = await requireWorkspaceMember(slug)
  const base = `/workspace/${access.workspace.slug}/settings`

  const session = await auth()
  const userId = (session?.user as { id?: string } | undefined)?.id
  const staff = userId
    ? await prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } })
    : null
  const canAdmin =
    Boolean(staff?.active) || access.role === "OWNER" || access.role === "ADMIN"

  const [memberCount, inviteCount, integrationCount, discord, server, ws] = await Promise.all([
    prisma.workspaceMember.count({ where: { workspaceId: access.workspace.id } }),
    prisma.workspaceInvite.count({
      where: {
        workspaceId: access.workspace.id,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    }),
    prisma.integrationConnection.count({ where: { workspaceId: access.workspace.id } }),
    prisma.workspaceDiscord.findUnique({
      where: { workspaceId: access.workspace.id },
      select: { provisionedAt: true },
    }),
    prisma.workspaceServer.findUnique({
      where: { workspaceId: access.workspace.id },
      select: { online: true, playerCount: true, maxPlayers: true },
    }),
    prisma.workspace.findUnique({
      where: { id: access.workspace.id },
      select: { calBookingUrl: true, stripeSubscriptionStatus: true },
    }),
  ])

  const defaultCal = process.env.PORTAL_DEFAULT_CAL_URL ?? null
  const hasBooking = Boolean(ws?.calBookingUrl || defaultCal)

  return (
    <SettingsOverview
      baseHref={base}
      showServer={canAdmin}
      stats={{
        members: memberCount,
        pendingInvites: inviteCount,
        integrations: integrationCount,
        discordReady: Boolean(discord?.provisionedAt),
        serverOnline: canAdmin ? (server?.online ?? false) : null,
        serverPlayers: server
          ? `${server.playerCount}/${server.maxPlayers} players`
          : null,
        subscriptionStatus: ws?.stripeSubscriptionStatus ?? null,
        hasBookingLink: hasBooking,
      }}
    />
  )
}
