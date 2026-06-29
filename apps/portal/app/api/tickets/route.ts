import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { announceTicketCreated } from "@/lib/discord-events"
import { setTicketSubtaskOfId } from "@/lib/ticket-subtasks"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const boardStatuses = ["BACKLOG", "PLANNED", "IN_PROGRESS", "REVIEW", "DONE"] as const
const paygStatuses = ["REQUESTED", "QUOTED", "AWAITING_PAYMENT", "ACTIVE", "AWAITING_CLIENT"] as const

const schema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(2).max(200),
  discipline: z.enum(["Scripts", "GFX", "Imports", "Weapons", "Branding", "VFX", "Hosting", "Other"]),
  description: z.string().max(8000).optional(),
  sprintId: z.string().optional(),
  parentId: z.string().optional(),
  subtaskOfId: z.string().optional(),
  type: z.enum(["EPIC", "TICKET"]).optional(),
  status: z.enum([...boardStatuses, ...paygStatuses]).optional(),
  boardColumnId: z.string().min(1).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id as string
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

  const itemType = parsed.data.type ?? "TICKET"

  if (itemType === "EPIC") {
    if (parsed.data.sprintId) {
      return NextResponse.json({ error: "Epics cannot be assigned to a sprint" }, { status: 400 })
    }
    if (parsed.data.parentId) {
      return NextResponse.json({ error: "Epics cannot have a parent" }, { status: 400 })
    }
  }

  if (parsed.data.sprintId) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: parsed.data.sprintId },
      select: { id: true, workspaceId: true },
    })
    if (!sprint || sprint.workspaceId !== parsed.data.workspaceId) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 400 })
    }
  }

  if (parsed.data.parentId) {
    const parent = await prisma.ticket.findUnique({
      where: { id: parsed.data.parentId },
      select: { id: true, workspaceId: true, type: true },
    })
    if (!parent || parent.workspaceId !== parsed.data.workspaceId) {
      return NextResponse.json({ error: "Parent ticket not found" }, { status: 400 })
    }
    if (parent.type !== "EPIC") {
      return NextResponse.json({ error: "Parent must be an epic" }, { status: 400 })
    }
  }

  let subtaskParent: {
    sprintId: string | null
    parentId: string | null
    status: string
  } | null = null

  if (parsed.data.subtaskOfId) {
    if (itemType === "EPIC") {
      return NextResponse.json({ error: "Epics cannot be subtasks" }, { status: 400 })
    }
    const stParent = await prisma.ticket.findUnique({
      where: { id: parsed.data.subtaskOfId },
      select: { id: true, workspaceId: true, type: true, sprintId: true, parentId: true, status: true },
    })
    if (!stParent || stParent.workspaceId !== parsed.data.workspaceId) {
      return NextResponse.json({ error: "Subtask parent not found" }, { status: 400 })
    }
    if (stParent.type !== "TICKET") {
      return NextResponse.json({ error: "Subtasks must belong to a ticket" }, { status: 400 })
    }
    subtaskParent = stParent
  }

  let ticket
  try {
    ticket = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.update({
      where: { id: parsed.data.workspaceId },
      data: { nextTicketNumber: { increment: 1 } },
      select: { nextTicketNumber: true, slug: true },
    })

    const number = ws.nextTicketNumber - 1
    const key = `${ws.slug.toUpperCase()}-${number}`

    const resolvedSprintId =
      itemType === "EPIC"
        ? null
        : parsed.data.sprintId || subtaskParent?.sprintId || null
    const resolvedParentId =
      itemType === "EPIC" ? null : parsed.data.parentId || subtaskParent?.parentId || null
    const resolvedSubtaskOfId = itemType === "EPIC" ? null : parsed.data.subtaskOfId || null

    const defaultStatus =
      itemType === "EPIC" ? "BACKLOG" : resolvedSprintId ? "PLANNED" : "BACKLOG"
    const allowedCreateStatuses = ["BACKLOG", "PLANNED", "REQUESTED"] as const
    type AllowedCreateStatus = (typeof allowedCreateStatuses)[number]
    let resolvedStatus: AllowedCreateStatus | typeof defaultStatus = defaultStatus
    if (parsed.data.status) {
      if (!(allowedCreateStatuses as readonly string[]).includes(parsed.data.status)) {
        throw new Error("Invalid status for new ticket")
      }
      resolvedStatus = parsed.data.status as AllowedCreateStatus
    }

    let boardColumnId: string | null = null
    if (parsed.data.boardColumnId) {
      const col = await tx.workspaceBoardColumn.findUnique({
        where: {
          workspaceId_id: {
            workspaceId: parsed.data.workspaceId,
            id: parsed.data.boardColumnId,
          },
        },
        select: { id: true, status: true },
      })
      if (!col) throw new Error("Board column not found")
      boardColumnId = col.id
      if (!parsed.data.status) resolvedStatus = col.status as typeof resolvedStatus
    }

    const created = await tx.ticket.create({
      data: {
        workspaceId: parsed.data.workspaceId,
        sprintId: resolvedSprintId,
        parentId: resolvedParentId,
        createdById: userId,
        number,
        key,
        type: itemType,
        title: parsed.data.title,
        description: parsed.data.description || null,
        discipline: parsed.data.discipline as any,
        status: resolvedStatus,
        boardColumnId,
        position: 1000,
      },
      select: {
        id: true,
        key: true,
        title: true,
        status: true,
        discipline: true,
        type: true,
        parentId: true,
        sprintId: true,
        workspaceId: true,
        createdAt: true,
      },
    })

    if (resolvedSubtaskOfId) {
      await setTicketSubtaskOfId(tx, created.id, resolvedSubtaskOfId)
    }

    await tx.activityEvent.create({
      data: {
        workspaceId: parsed.data.workspaceId,
        ticketId: created.id,
        source: "PORTAL",
        type: "ticket.created",
        body: `${created.key} created: ${created.title}`,
        actorUserId: userId,
      },
    })

    return created
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ""
    if (msg === "Invalid status for new ticket") {
      return NextResponse.json(
        { error: "Status must be BACKLOG, PLANNED, or REQUESTED when creating a ticket" },
        { status: 400 }
      )
    }
    if (msg === "Board column not found") {
      return NextResponse.json({ error: "Board column not found" }, { status: 400 })
    }
    throw err
  }

  if (ticket.type === "TICKET") {
    announceTicketCreated(parsed.data.workspaceId, ticket.key, ticket.title)
  }

  return NextResponse.json(
    {
      ticket: {
        ...ticket,
        createdAt: ticket.createdAt.toISOString(),
      },
    },
    { status: 201 }
  )
}

