import { requireWorkspaceMember } from "@/lib/workspace"
import { prisma } from "@/lib/prisma"
import { formatSprintRange } from "@/lib/sprint-calendar"
import { ensureSprintWindow } from "@/lib/sprints"
import { BacklogClient } from "@/components/backlog/BacklogClient"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function BacklogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const access = await requireWorkspaceMember(slug)
  const base = `/workspace/${access.workspace.slug}`

  const window = await ensureSprintWindow(access.workspace.id)
  const sprintOptions = [
    { id: window.active.id, name: window.active.name, status: window.active.status, label: `${formatSprintRange(window.active.startDate, window.active.endDate)} (Active)` },
    ...window.planning.map((s, i) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      label: `${formatSprintRange(s.startDate, s.endDate)} (${i === 0 ? "Next" : "Later"})`,
    })),
  ]

  const [tickets, epics] = await Promise.all([
    prisma.ticket.findMany({
      where: {
        workspaceId: access.workspace.id,
        type: "TICKET",
        subtaskOfId: null,
        OR: [
          { sprintId: null, status: { in: ["BACKLOG", "PLANNED"] } },
          {
            status: {
              in: ["REQUESTED", "QUOTED", "AWAITING_PAYMENT", "ACTIVE", "AWAITING_CLIENT"],
            },
          },
        ],
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        key: true,
        title: true,
        discipline: true,
        status: true,
        sprintId: true,
        position: true,
        parentId: true,
        sprint: { select: { name: true } },
        parent: { select: { key: true } },
        _count: { select: { comments: true } },
      },
      take: 1000,
    }),
    prisma.ticket.findMany({
      where: { workspaceId: access.workspace.id, type: "EPIC" },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        key: true,
        title: true,
        _count: { select: { children: true } },
      },
      take: 200,
    }),
  ])

  return (
    <BacklogClient
      workspaceId={access.workspace.id}
      workspaceSlug={access.workspace.slug}
      baseHref={base}
      sprints={sprintOptions}
      activeSprintId={window.active.id}
      epics={epics.map((e) => ({
        id: e.id,
        key: e.key,
        title: e.title,
        childCount: e._count.children,
      }))}
      initialTickets={tickets.map((t) => ({
        id: t.id,
        key: t.key,
        title: t.title,
        discipline: t.discipline,
        status: t.status,
        sprintId: t.sprintId,
        sprintName: t.sprint?.name ?? null,
        position: t.position,
        parentId: t.parentId,
        parentKey: t.parent?.key ?? null,
        commentsCount: t._count.comments,
      }))}
      canEdit={access.role !== "VIEWER"}
    />
  )
}
