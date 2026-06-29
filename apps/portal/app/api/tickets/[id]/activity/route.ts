import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { mergeTicketActivity } from "@/lib/ticket-activity"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id as string
  const { id } = await ctx.params

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { id: true, workspaceId: true },
  })
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [member, staff] = await Promise.all([
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: ticket.workspaceId, userId } },
      select: { role: true },
    }),
    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),
  ])
  const canRead = Boolean(staff?.active) || Boolean(member)
  if (!canRead) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [comments, events] = await Promise.all([
    prisma.ticketComment.findMany({
      where: { ticketId: ticket.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, authorName: true, body: true, createdAt: true },
      take: 500,
    }),
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

  const timeline = mergeTicketActivity(
    comments.map((c) => ({
      id: c.id,
      authorName: c.authorName,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
    })),
    events.map((e) => ({
      id: e.id,
      type: e.type,
      body: e.body,
      createdAt: e.createdAt.toISOString(),
      actorName: e.actor?.name || e.actor?.email || null,
    }))
  )

  return NextResponse.json({ timeline })
}
