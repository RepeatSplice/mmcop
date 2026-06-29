import { requireWorkspaceMember } from "@/lib/workspace"
import { prisma } from "@/lib/prisma"
import { PageShell } from "@/components/layout/PageShell"
import type { KanbanTicket } from "@/components/board/kanban-types"
import { BoardKanban } from "@/components/board/BoardKanban"
import { BoardSprintHeader } from "@/components/board/BoardSprintHeader"
import { ensureSprintWindow } from "@/lib/sprints"
import { boardColumnStatuses, resolveTicketBoardColumnId } from "@/lib/board-columns"
import { ensureWorkspaceBoardColumns } from "@/lib/board-columns-server"
import type { TicketStatus } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function previewDescription(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const text = raw.replace(/\s+/g, " ").trim()
  return text.length > 120 ? `${text.slice(0, 117)}…` : text
}

export default async function BoardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const access = await requireWorkspaceMember(slug)
  const base = `/workspace/${access.workspace.slug}`
  const canEdit = access.role !== "VIEWER"
  const canManageColumns =
    access.isStaff || access.role === "OWNER" || access.role === "ADMIN"

  const boardColumns = await ensureWorkspaceBoardColumns(access.workspace.id)
  const statusFilter = boardColumnStatuses(boardColumns) as TicketStatus[]

  const { active: sprint } = await ensureSprintWindow(access.workspace.id)

  const [tickets, epics] = await Promise.all([
    prisma.ticket.findMany({
      where: {
        workspaceId: access.workspace.id,
        sprintId: sprint.id,
        type: "TICKET",
        status: { in: statusFilter },
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        key: true,
        title: true,
        description: true,
        discipline: true,
        status: true,
        boardColumnId: true,
        position: true,
        dueDate: true,
        hoursEst: true,
        assigneeId: true,
        subtaskOfId: true,
        parentId: true,
        assignee: { select: { name: true, email: true, image: true } },
        parent: { select: { key: true, title: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      take: 2000,
    }),
    prisma.ticket.findMany({
      where: { workspaceId: access.workspace.id, type: "EPIC" },
      orderBy: { createdAt: "desc" },
      select: { id: true, key: true, title: true },
      take: 200,
    }),
  ])

  const columnCounts: Record<string, number> = {}
  for (const col of boardColumns) columnCounts[col.id] = 0

  const initialTickets: KanbanTicket[] = tickets.map((t) => {
    const boardColumnId = resolveTicketBoardColumnId(
      { boardColumnId: t.boardColumnId, status: t.status },
      boardColumns
    )
    columnCounts[boardColumnId] = (columnCounts[boardColumnId] ?? 0) + 1

    return {
      id: t.id,
      key: t.key,
      title: t.title,
      descriptionPreview: previewDescription(t.description),
      discipline: t.discipline,
      status: t.status,
      boardColumnId,
      position: t.position,
      commentsCount: t._count.comments,
      attachmentsCount: t._count.attachments,
      assigneeId: t.assigneeId,
      assigneeName: t.assignee?.name ?? t.assignee?.email?.split("@")[0] ?? null,
      assigneeImage: t.assignee?.image ?? null,
      dueDate: t.dueDate?.toISOString() ?? null,
      hoursEst: t.hoursEst,
      parentId: t.parentId,
      parentKey: t.parent?.key ?? null,
      parentTitle: t.parent?.title ?? null,
      subtaskOfId: t.subtaskOfId,
    }
  })

  const canEndSprint =
    access.isStaff || access.role === "OWNER" || access.role === "ADMIN"
  const disciplines = ["Scripts", "GFX", "Imports", "Weapons", "Branding", "VFX", "Hosting", "Other"]

  return (
    <PageShell className="flex flex-col min-h-0 h-[calc(100vh-var(--header-height,3.5rem))] max-h-[calc(100vh-var(--header-height,3.5rem))]">
      <BoardSprintHeader
        sprint={sprint}
        workspaceId={access.workspace.id}
        baseHref={base}
        totalCards={tickets.length}
        columns={boardColumns}
        columnCounts={columnCounts}
        canEndSprint={canEndSprint}
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        <BoardKanban
          workspaceId={access.workspace.id}
          sprintId={sprint.id}
          workspaceSlug={access.workspace.slug}
          backlogHref={`${base}/backlog`}
          canEdit={canEdit}
          canManageColumns={canManageColumns}
          currentUserId={access.userId}
          initialColumns={boardColumns}
          initialTickets={initialTickets}
          epics={epics}
          disciplines={disciplines}
        />
      </div>
    </PageShell>
  )
}
