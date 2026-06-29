import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { announceTicketStatus } from "@/lib/discord-events"
import { setTicketSubtaskOfId } from "@/lib/ticket-subtasks"
import { transitionsFor } from "@/lib/ticket-status"
import {
  notifyTicketAssigned,
  notifyTicketStatusChanged,
} from "@/lib/ticket-notifications"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const patchSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(8000).nullable().optional(),
  discipline: z
    .enum(["Scripts", "GFX", "Imports", "Weapons", "Branding", "VFX", "Hosting", "Other"])
    .optional(),
  status: z
    .enum([
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
    ])
    .optional(),
  type: z.enum(["EPIC", "TICKET"]).optional(),
  parentId: z.string().nullable().optional(),
  subtaskOfId: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  position: z.number().int().min(0).max(1000000).optional(),
  hoursEst: z.number().min(0).max(10000).nullable().optional(),
  hoursActual: z.number().min(0).max(10000).nullable().optional(),
  boardColumnId: z.string().min(1).nullable().optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id as string
  const { id } = await ctx.params

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
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

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: {
      id: true,
      workspaceId: true,
      key: true,
      title: true,
      description: true,
      status: true,
      discipline: true,
      type: true,
      parentId: true,
      subtaskOfId: true,
      sprintId: true,
      assigneeId: true,
      createdById: true,
      dueDate: true,
      position: true,
      hoursEst: true,
      hoursActual: true,
      boardColumnId: true,
      workspace: { select: { slug: true, name: true } },
    },
  })
  if (!ticket || ticket.workspaceId !== parsed.data.workspaceId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const existingTicket = ticket

  if (parsed.data.assigneeId !== undefined && parsed.data.assigneeId !== null) {
    const assigneeMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: parsed.data.workspaceId,
          userId: parsed.data.assigneeId,
        },
      },
      select: { userId: true },
    })
    if (!assigneeMember) {
      return NextResponse.json({ error: "Assignee must be a workspace member" }, { status: 400 })
    }
  }

  if (parsed.data.sprintId !== undefined && parsed.data.sprintId !== null) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: parsed.data.sprintId },
      select: { id: true, workspaceId: true },
    })
    if (!sprint || sprint.workspaceId !== parsed.data.workspaceId) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 400 })
    }
  }

  if (parsed.data.parentId !== undefined && parsed.data.parentId !== null) {
    if (parsed.data.parentId === id) {
      return NextResponse.json({ error: "Ticket cannot be its own parent" }, { status: 400 })
    }
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

  if (parsed.data.status !== undefined && parsed.data.status !== existingTicket.status) {
    const isStaff = Boolean(staff?.active)
    const isAdmin = member?.role === "OWNER" || member?.role === "ADMIN"
    if (!isStaff && !isAdmin) {
      const allowed = transitionsFor(existingTicket.status)
      if (!allowed.includes(parsed.data.status)) {
        return NextResponse.json(
          { error: `Cannot move from ${existingTicket.status} to ${parsed.data.status}` },
          { status: 400 }
        )
      }
    }
  }

  if (parsed.data.boardColumnId !== undefined && parsed.data.boardColumnId !== null) {
    const col = await prisma.workspaceBoardColumn.findUnique({
      where: {
        workspaceId_id: {
          workspaceId: parsed.data.workspaceId,
          id: parsed.data.boardColumnId,
        },
      },
      select: { id: true },
    })
    if (!col) {
      return NextResponse.json({ error: "Board column not found" }, { status: 400 })
    }
  }

  if (parsed.data.subtaskOfId !== undefined && parsed.data.subtaskOfId !== null) {
    if (parsed.data.subtaskOfId === id) {
      return NextResponse.json({ error: "Ticket cannot be its own subtask parent" }, { status: 400 })
    }
    const parentTicket = await prisma.ticket.findUnique({
      where: { id: parsed.data.subtaskOfId },
      select: { id: true, workspaceId: true, type: true },
    })
    if (!parentTicket || parentTicket.workspaceId !== parsed.data.workspaceId) {
      return NextResponse.json({ error: "Subtask parent not found" }, { status: 400 })
    }
    if (parentTicket.type !== "TICKET") {
      return NextResponse.json({ error: "Subtasks must belong to a ticket" }, { status: 400 })
    }
  }

  const nextType = parsed.data.type ?? existingTicket.type
  if (nextType === "EPIC") {
    if (parsed.data.parentId !== undefined && parsed.data.parentId !== null) {
      return NextResponse.json({ error: "Epics cannot have a parent" }, { status: 400 })
    }
    if (parsed.data.subtaskOfId !== undefined && parsed.data.subtaskOfId !== null) {
      return NextResponse.json({ error: "Epics cannot be subtasks" }, { status: 400 })
    }
    if (parsed.data.sprintId !== undefined && parsed.data.sprintId !== null) {
      return NextResponse.json({ error: "Epics cannot be assigned to a sprint" }, { status: 400 })
    }
  }

  const nextDueDate =
    parsed.data.dueDate === undefined
      ? undefined
      : parsed.data.dueDate === null
        ? null
        : new Date(parsed.data.dueDate)

  const changes: Record<string, { from: unknown; to: unknown }> = {}
  type Existing = typeof existingTicket
  function track(k: keyof Existing, to: unknown) {
    if (to === undefined) return
    const from = existingTicket[k]
    if (from === to) return
    changes[String(k)] = { from, to }
  }

  track("title", parsed.data.title)
  track("description", parsed.data.description)
  track("discipline", parsed.data.discipline)
  track("status", parsed.data.status)
  track("type", parsed.data.type)
  track("parentId", parsed.data.parentId)
  track("subtaskOfId", parsed.data.subtaskOfId)
  track("sprintId", parsed.data.sprintId)
  track("assigneeId", parsed.data.assigneeId)
  track("position", parsed.data.position)
  track("dueDate", nextDueDate === undefined ? undefined : nextDueDate?.toISOString?.() ?? null)
  track("hoursEst", parsed.data.hoursEst)
  track("hoursActual", parsed.data.hoursActual)
  track("boardColumnId", parsed.data.boardColumnId)

  const updateData: any = {}
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description
  if (parsed.data.discipline !== undefined) updateData.discipline = parsed.data.discipline
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status
  if (parsed.data.type !== undefined) updateData.type = parsed.data.type
  if (parsed.data.parentId !== undefined) updateData.parentId = parsed.data.parentId
  const subtaskOfIdPatch =
    parsed.data.subtaskOfId !== undefined ? parsed.data.subtaskOfId : undefined
  if (parsed.data.sprintId !== undefined) {
    updateData.sprintId = parsed.data.sprintId
    if (parsed.data.status === undefined) {
      if (parsed.data.sprintId === null) {
        updateData.status = "BACKLOG"
      } else if (existingTicket.status === "BACKLOG") {
        updateData.status = "PLANNED"
      }
    }
  }
  if (parsed.data.assigneeId !== undefined) updateData.assigneeId = parsed.data.assigneeId
  if (parsed.data.position !== undefined) updateData.position = parsed.data.position
  if (nextDueDate !== undefined) updateData.dueDate = nextDueDate
  if (parsed.data.hoursEst !== undefined) updateData.hoursEst = parsed.data.hoursEst
  if (parsed.data.hoursActual !== undefined) updateData.hoursActual = parsed.data.hoursActual

  if (parsed.data.boardColumnId !== undefined) {
    updateData.boardColumnId = parsed.data.boardColumnId
    if (parsed.data.boardColumnId !== null && parsed.data.status === undefined) {
      const col = await prisma.workspaceBoardColumn.findUnique({
        where: {
          workspaceId_id: {
            workspaceId: parsed.data.workspaceId,
            id: parsed.data.boardColumnId,
          },
        },
        select: { status: true },
      })
      if (col) updateData.status = col.status
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.ticket.update({ where: { id: existingTicket.id }, data: updateData })

    if (subtaskOfIdPatch !== undefined) {
      await setTicketSubtaskOfId(tx, existingTicket.id, subtaskOfIdPatch)
    }

    if (parsed.data.status !== undefined && parsed.data.status !== existingTicket.status) {
      announceTicketStatus(
        existingTicket.workspaceId,
        existingTicket.key,
        existingTicket.status,
        parsed.data.status
      )
    }

    if (Object.keys(changes).length > 0) {
      await tx.activityEvent.create({
        data: {
          workspaceId: existingTicket.workspaceId,
          ticketId: existingTicket.id,
          source: "PORTAL",
          type: "ticket.updated",
          body: JSON.stringify({ ticketKey: existingTicket.key, changes }),
          actorUserId: userId,
        },
      })
    }
  })

  const workspaceSlug = existingTicket.workspace?.slug ?? ""
  const workspaceName = existingTicket.workspace?.name ?? ""
  const actorName = session.user.name || session.user.email || null

  if (
    parsed.data.assigneeId !== undefined &&
    parsed.data.assigneeId !== null &&
    parsed.data.assigneeId !== existingTicket.assigneeId
  ) {
    void notifyTicketAssigned({
      workspaceId: existingTicket.workspaceId,
      workspaceSlug,
      workspaceName,
      ticketId: existingTicket.id,
      ticketKey: existingTicket.key,
      ticketTitle: existingTicket.title,
      newAssigneeId: parsed.data.assigneeId,
      actorUserId: userId,
      actorName,
    }).catch((e) => console.warn("[notify] assignee failed", e))
  }

  if (
    parsed.data.status !== undefined &&
    parsed.data.status !== existingTicket.status
  ) {
    void notifyTicketStatusChanged({
      workspaceId: existingTicket.workspaceId,
      workspaceSlug,
      workspaceName,
      ticketId: existingTicket.id,
      ticketKey: existingTicket.key,
      ticketTitle: existingTicket.title,
      fromStatus: existingTicket.status,
      toStatus: parsed.data.status,
      assigneeId:
        parsed.data.assigneeId !== undefined
          ? parsed.data.assigneeId
          : existingTicket.assigneeId,
      createdById: existingTicket.createdById,
      actorUserId: userId,
      actorName,
    }).catch((e) => console.warn("[notify] status failed", e))
  }

  return NextResponse.json({ ok: true })
}

