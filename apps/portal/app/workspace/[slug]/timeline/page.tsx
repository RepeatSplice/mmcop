import { requireWorkspaceMember } from "@/lib/workspace"
import { prisma } from "@/lib/prisma"
import { ensureSprintWindow } from "@/lib/sprints"
import { WorkspaceTimeline } from "@/components/timeline/WorkspaceTimeline"
import type { TimelineSprint } from "@/components/timeline/timeline-types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const COMMITTED_STATUSES = ["PLANNED", "IN_PROGRESS", "REVIEW", "DONE"] as const

export default async function WorkspaceTimelinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const access = await requireWorkspaceMember(slug)
  const base = `/workspace/${access.workspace.slug}`

  const window = await ensureSprintWindow(access.workspace.id)
  const sprintIds = [window.active.id, window.planning[0].id, window.planning[1].id]

  // Include any sprint-scheduled work AND any ticket with a due date so the
  // gantt always reflects upcoming deadlines (not just committed sprint work).
  const ticketRows = await prisma.ticket.findMany({
    where: {
      workspaceId: access.workspace.id,
      type: "TICKET",
      OR: [
        { sprintId: { in: sprintIds }, status: { in: [...COMMITTED_STATUSES] } },
        { dueDate: { not: null }, status: { notIn: ["CANCELLED"] } },
      ],
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      key: true,
      title: true,
      status: true,
      discipline: true,
      dueDate: true,
      sprintId: true,
      assignee: { select: { name: true, email: true } },
    },
    take: 500,
  })

  const bySprint = new Map<string, typeof ticketRows>()
  for (const id of sprintIds) bySprint.set(id, [])
  for (const t of ticketRows) {
    if (!t.sprintId) continue
    bySprint.get(t.sprintId)?.push(t)
  }

  const sprintList = [window.active, ...window.planning]
  const dto: TimelineSprint[] = sprintList.map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
    hoursMax: s.hoursMax,
    hoursUsed: s.hoursUsed,
    tickets: (bySprint.get(s.id) ?? []).map((t) => ({
      id: t.id,
      key: t.key,
      title: t.title,
      status: t.status,
      discipline: t.discipline,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      assigneeName: t.assignee?.name ?? t.assignee?.email?.split("@")[0] ?? null,
    })),
  }))

  return (
    <WorkspaceTimeline
      workspaceId={access.workspace.id}
      workspaceSlug={access.workspace.slug}
      baseHref={base}
      sprints={dto}
      canEndSprint={access.role !== "VIEWER"}
    />
  )
}
