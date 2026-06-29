import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ticketStatuses = [
  "BACKLOG",
  "PLANNED",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
  "CANCELLED",
  "REQUESTED",
  "QUOTED",
  "AWAITING_PAYMENT",
  "ACTIVE",
  "AWAITING_CLIENT",
] as const

const schema = z.object({
  workspaceId: z.string().min(1),
  orderedIds: z.array(z.string().min(1)).max(5000),
  status: z.enum(ticketStatuses).optional(),
  boardColumnId: z.string().min(1).optional(),
  sprintId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id as string
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const [member, staff] = await Promise.all([
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: parsed.data.workspaceId, userId } },
      select: { role: true },
    }),
    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),
  ])
  const canWrite = Boolean(staff?.active) || (member && member.role !== "VIEWER")
  if (!canWrite) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  if (parsed.data.orderedIds.length === 0) {
    return NextResponse.json({ ok: true })
  }

  const uniqueIds = [...new Set(parsed.data.orderedIds)]
  if (uniqueIds.length !== parsed.data.orderedIds.length) {
    return NextResponse.json({ error: "Duplicate ticket ids in order" }, { status: 400 })
  }

  const found = await prisma.ticket.findMany({
    where: { workspaceId: parsed.data.workspaceId, id: { in: uniqueIds } },
    select: { id: true },
  })
  if (found.length !== uniqueIds.length) {
    return NextResponse.json({ error: "One or more tickets not found in workspace" }, { status: 400 })
  }

  if (parsed.data.boardColumnId) {
    const col = await prisma.workspaceBoardColumn.findUnique({
      where: {
        workspaceId_id: {
          workspaceId: parsed.data.workspaceId,
          id: parsed.data.boardColumnId,
        },
      },
      select: { id: true, status: true },
    })
    if (!col) {
      return NextResponse.json({ error: "Board column not found" }, { status: 400 })
    }
  }

  const whereBase = {
    workspaceId: parsed.data.workspaceId,
    ...(parsed.data.boardColumnId
      ? { boardColumnId: parsed.data.boardColumnId }
      : parsed.data.status
        ? { status: parsed.data.status }
        : {}),
    ...(parsed.data.sprintId ? { sprintId: parsed.data.sprintId } : {}),
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < parsed.data.orderedIds.length; i++) {
        const id = parsed.data.orderedIds[i]!
        const result = await tx.ticket.updateMany({
          where: { id, ...whereBase },
          data: { position: i * 10 },
        })
        if (result.count === 0) {
          throw new Error(`TICKET_MISMATCH:${id}`)
        }
      }

      await tx.activityEvent.create({
        data: {
          workspaceId: parsed.data.workspaceId,
          source: "SYSTEM",
          type: "ticket.reordered",
          body: "Tickets reordered.",
          actorUserId: userId,
        },
      })
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.startsWith("TICKET_MISMATCH:")) {
      return NextResponse.json(
        { error: "Ticket does not match column sprint/status filters" },
        { status: 400 }
      )
    }
    throw e
  }

  return NextResponse.json({ ok: true })
}
