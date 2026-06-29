import { requireWorkspaceMember } from "@/lib/workspace"
import { prisma } from "@/lib/prisma"
import { getActiveSprint } from "@/lib/sprints"
import { WorkspaceSummary } from "@/components/summary/WorkspaceSummary"
import { OPEN_BOARD_STATUSES, NEEDS_YOU_STATUSES } from "@/lib/ticket-display"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ticketSelect = {
  id: true,
  key: true,
  title: true,
  status: true,
  discipline: true,
  dueDate: true,
  updatedAt: true,
} as const

export default async function WorkspaceSummaryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const access = await requireWorkspaceMember(slug)
  const base = `/workspace/${access.workspace.slug}`
  const workspaceId = access.workspace.id

  const now = new Date()
  const dueCutoff = new Date(now)
  dueCutoff.setDate(dueCutoff.getDate() + 7)

  const [_, billing, server, pinned, epics] = await Promise.all([
    getActiveSprint(workspaceId),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { stripeSubscriptionId: true, calBookingUrl: true },
    }),
    prisma.workspaceServer.findUnique({ where: { workspaceId } }),
    prisma.workspacePinnedUpdate.findFirst({
      where: { workspaceId, active: true },
      orderBy: { pinnedAt: "desc" },
      select: { body: true },
    }),
    prisma.ticket.findMany({
      where: { workspaceId, type: "EPIC" },
      select: {
        id: true,
        key: true,
        title: true,
        children: {
          where: { type: "TICKET" },
          select: { status: true },
        },
      },
      take: 8,
    }),
  ])

  const activeSprintPromise = prisma.sprint.findFirst({
    where: { workspaceId, status: "ACTIVE" },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      hoursMax: true,
      hoursUsed: true,
      status: true,
    },
  })

  const [
    activeSprint,
    planningSprint,
    statusTotals,
    memberCount,
    openTicketCount,
    inProgressCount,
    awaitingPaymentCount,
    epicCount,
    recentTickets,
    attentionTickets,
    needsYouTickets,
    dueSoon,
    recentEvents,
  ] = await Promise.all([
    activeSprintPromise,
    prisma.sprint.findFirst({
      where: { workspaceId, status: "PLANNING" },
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        hoursMax: true,
        hoursUsed: true,
        status: true,
      },
    }),
    prisma.ticket.groupBy({
      by: ["status"],
      where: { workspaceId, type: "TICKET" },
      _count: { _all: true },
    }),
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.ticket.count({
      where: {
        workspaceId,
        type: "TICKET",
        status: { notIn: ["DONE", "CANCELLED"] },
      },
    }),
    prisma.ticket.count({
      where: {
        workspaceId,
        type: "TICKET",
        status: { in: ["IN_PROGRESS", "ACTIVE", "REVIEW"] },
      },
    }),
    prisma.ticket.count({
      where: { workspaceId, type: "TICKET", status: "AWAITING_PAYMENT" },
    }),
    prisma.ticket.count({ where: { workspaceId, type: "EPIC" } }),
    prisma.ticket.findMany({
      where: { workspaceId, type: "TICKET" },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: ticketSelect,
    }),
    prisma.ticket.findMany({
      where: {
        workspaceId,
        type: "TICKET",
        status: { in: ["QUOTED", "REQUESTED"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: ticketSelect,
    }),
    prisma.ticket.findMany({
      where: {
        workspaceId,
        type: "TICKET",
        status: { in: NEEDS_YOU_STATUSES },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: ticketSelect,
    }),
    prisma.ticket.findMany({
      where: {
        workspaceId,
        type: "TICKET",
        dueDate: { gte: now, lte: dueCutoff },
        status: { notIn: ["DONE", "CANCELLED"] },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: ticketSelect,
    }),
    prisma.activityEvent.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        createdAt: true,
        body: true,
        type: true,
        ticket: { select: { key: true, title: true } },
        actor: { select: { name: true, email: true } },
      },
    }),
  ])

  const sprintStatusCounts = activeSprint
    ? await prisma.ticket.groupBy({
        by: ["status"],
        where: {
          workspaceId,
          sprintId: activeSprint.id,
          type: "TICKET",
          status: { in: [...OPEN_BOARD_STATUSES, "DONE"] },
        },
        _count: { _all: true },
      })
    : []

  const sprintTotalCount = sprintStatusCounts.reduce((n, s) => n + s._count._all, 0)
  const sprintDoneCount = sprintStatusCounts.find((s) => s.status === "DONE")?._count._all ?? 0
  const sprintDaysLeft = activeSprint
    ? Math.max(
        0,
        Math.ceil(
          (activeSprint.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0
  const hoursPct =
    activeSprint && activeSprint.hoursMax > 0
      ? (activeSprint.hoursUsed / activeSprint.hoursMax) * 100
      : null
  const sprintAtRisk =
    Boolean(activeSprint) &&
    sprintDaysLeft <= 3 &&
    hoursPct != null &&
    hoursPct >= 80

  const epicProgress = epics.map((e) => {
    const total = e.children.length
    const done = e.children.filter((c) => c.status === "DONE").length
    return { key: e.key, title: e.title, done, total }
  })

  return (
    <WorkspaceSummary
      workspaceName={access.workspace.name}
      baseHref={base}
      workspaceId={workspaceId}
      memberCount={memberCount}
      hasSubscription={Boolean(billing?.stripeSubscriptionId)}
      activeSprint={activeSprint}
      planningSprint={planningSprint}
      sprintStatusCounts={sprintStatusCounts.map((s) => ({
        status: s.status,
        count: s._count._all,
      }))}
      statusTotals={statusTotals.map((s) => ({
        status: s.status,
        count: s._count._all,
      }))}
      openTicketCount={openTicketCount}
      inProgressCount={inProgressCount}
      awaitingPaymentCount={awaitingPaymentCount}
      epicCount={epicCount}
      dueSoon={dueSoon}
      attentionTickets={attentionTickets}
      needsYouTickets={needsYouTickets}
      recentTickets={recentTickets}
      recentEvents={recentEvents.map((e) => ({
        id: e.id,
        createdAt: e.createdAt,
        type: e.type,
        body: e.body,
        ticket: e.ticket,
        actor: e.actor,
      }))}
      server={
        server
          ? {
              online: server.online,
              playerCount: server.playerCount,
              maxPlayers: server.maxPlayers,
              mapName: server.mapName,
              version: server.version,
              lastSeenAt: server.lastSeenAt,
              displayName: server.displayName,
            }
          : null
      }
      pinnedBody={pinned?.body ?? null}
      calBookingUrl={billing?.calBookingUrl ?? process.env.PORTAL_DEFAULT_CAL_URL ?? null}
      isStaff={access.isStaff}
      canAdminServer={
        access.isStaff || access.role === "OWNER" || access.role === "ADMIN"
      }
      sprintAtRisk={sprintAtRisk}
      sprintDoneCount={sprintDoneCount}
      sprintTotalCount={sprintTotalCount}
      sprintDaysLeft={sprintDaysLeft}
      epicProgress={epicProgress}
    />
  )
}
