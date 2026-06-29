import { notFound } from "next/navigation"
import { requireWorkspaceMember } from "@/lib/workspace"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { loadTicketSubtasks } from "@/lib/ticket-subtasks"
import { TicketDetail } from "@/components/tickets/TicketDetail"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ slug: string; ticketKey: string }>
}) {
  const { slug, ticketKey } = await params
  const access = await requireWorkspaceMember(slug)
  const base = `/workspace/${access.workspace.slug}`

  const session = await auth()
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null
  const staff = userId
    ? await prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } })
    : null
  const showAdvanced =
    Boolean(staff?.active) || access.role === "OWNER" || access.role === "ADMIN"

  const ticket = await prisma.ticket.findFirst({
    where: { workspaceId: access.workspace.id, key: ticketKey },
    select: {
      id: true,
      key: true,
      type: true,
      title: true,
      description: true,
      status: true,
      discipline: true,
      position: true,
      hoursEst: true,
      hoursActual: true,
      parent: { select: { id: true, key: true, title: true } },
      subtaskOf: { select: { id: true, key: true, title: true } },
      sprint: { select: { id: true, name: true, status: true } },
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      dueDate: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  if (!ticket) return notFound()

  const [members, epics, sprints, comments, attachments, subtasks, activityEvents] =
    await Promise.all([
      prisma.workspaceMember.findMany({
        where: { workspaceId: access.workspace.id },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
        take: 500,
      }),
      prisma.ticket.findMany({
        where: { workspaceId: access.workspace.id, type: "EPIC" },
        orderBy: { createdAt: "desc" },
        select: { id: true, key: true, title: true },
        take: 500,
      }),
      prisma.sprint.findMany({
        where: { workspaceId: access.workspace.id, status: { in: ["PLANNING", "ACTIVE"] } },
        orderBy: [{ startDate: "desc" }],
        select: { id: true, name: true, status: true },
        take: 25,
      }),
      prisma.ticketComment.findMany({
        where: { ticketId: ticket.id },
        orderBy: { createdAt: "asc" },
        select: { id: true, authorId: true, authorName: true, body: true, createdAt: true },
        take: 500,
      }),
      prisma.ticketAttachment.findMany({
        where: { ticketId: ticket.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, fileName: true, mimeType: true, byteSize: true, createdAt: true },
        take: 200,
      }),
      loadTicketSubtasks(ticket.id),
      prisma.activityEvent.findMany({
        where: { ticketId: ticket.id },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          type: true,
          body: true,
          createdAt: true,
          actor: { select: { name: true, email: true } },
        },
        take: 200,
      }),
    ])

  return (
    <TicketDetail
      key={ticket.id}
      canEdit={access.role !== "VIEWER"}
      showAdvanced={showAdvanced}
      workspaceId={access.workspace.id}
      workspaceSlug={access.workspace.slug}
      baseHref={base}
      currentUserId={userId}
      ticket={{
        ...ticket,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        dueDate: ticket.dueDate ? ticket.dueDate.toISOString() : null,
      }}
      members={members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      }))}
      epics={epics}
      sprints={sprints}
      comments={comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))}
      attachments={attachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        mimeType: a.mimeType,
        byteSize: a.byteSize,
        url: `/api/attachments/${a.id}`,
        createdAt: a.createdAt.toISOString(),
      }))}
      subtasks={subtasks}
      activityEvents={activityEvents.map((e) => ({
        id: e.id,
        type: e.type,
        body: e.body,
        createdAt: e.createdAt.toISOString(),
        actorName: e.actor?.name || e.actor?.email || null,
      }))}
    />
  )
}
