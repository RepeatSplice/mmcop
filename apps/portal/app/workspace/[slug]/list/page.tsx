import { requireWorkspaceMember } from "@/lib/workspace"
import { prisma } from "@/lib/prisma"
import { WorkspaceList } from "@/components/list/WorkspaceList"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function WorkspaceListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const access = await requireWorkspaceMember(slug)
  const base = `/workspace/${access.workspace.slug}`

  const [tickets, sprints, members] = await Promise.all([
    prisma.ticket.findMany({
      where: { workspaceId: access.workspace.id, type: { in: ["TICKET", "EPIC"] } },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        key: true,
        title: true,
        type: true,
        status: true,
        discipline: true,
        position: true,
        dueDate: true,
        updatedAt: true,
        assigneeId: true,
        subtaskOfId: true,
        subtaskOf: { select: { id: true, key: true } },
        parentId: true,
        parent: { select: { id: true, key: true } },
        sprint: { select: { id: true, name: true, status: true } },
        assignee: { select: { name: true, email: true, image: true } },
        _count: { select: { children: true } },
      },
      take: 1000,
    }),
    prisma.sprint.findMany({
      where: { workspaceId: access.workspace.id, status: { in: ["PLANNING", "ACTIVE"] } },
      orderBy: [{ startDate: "desc" }],
      select: { id: true, name: true, status: true },
      take: 25,
    }),
    prisma.workspaceMember.findMany({
      where: { workspaceId: access.workspace.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
      take: 500,
    }),
  ])

  return (
    <WorkspaceList
      canEdit={access.role !== "VIEWER"}
      workspaceId={access.workspace.id}
      workspaceSlug={access.workspace.slug}
      baseHref={base}
      tickets={tickets.map((t) => ({
        id: t.id,
        key: t.key,
        title: t.title,
        itemType: t.type,
        status: t.status,
        discipline: t.discipline,
        position: t.position,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        updatedAt: t.updatedAt.toISOString(),
        sprint: t.type === "TICKET" ? t.sprint : null,
        assigneeId: t.assigneeId,
        assigneeName: t.assignee?.name ?? t.assignee?.email?.split("@")[0] ?? null,
        assigneeImage: t.assignee?.image ?? null,
        childCount: t._count.children,
        subtaskOfId: t.subtaskOfId,
        subtaskOfKey: t.subtaskOf?.key ?? null,
        parentEpicId: t.parentId,
        parentEpicKey: t.parent?.key ?? null,
      }))}
      sprints={sprints}
      members={members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
      }))}
    />
  )
}
