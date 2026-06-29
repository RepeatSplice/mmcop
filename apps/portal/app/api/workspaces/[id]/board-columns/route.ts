import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BOARD_COLUMN_COLORS, serializeBoardColumn } from "@/lib/board-columns"
import { ensureWorkspaceBoardColumns } from "@/lib/board-columns-server"

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

const createSchema = z.object({
  label: z.string().min(1).max(40),
  status: z.enum(ticketStatuses),
  color: z.enum(BOARD_COLUMN_COLORS).optional(),
})

const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).max(50),
})

const patchSchema = z.object({
  columnId: z.string().min(1),
  label: z.string().min(1).max(40).optional(),
  color: z.enum(BOARD_COLUMN_COLORS).optional(),
})

async function canManage(workspaceId: string, userId: string) {
  const [member, staff] = await Promise.all([
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    }),
    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),
  ])
  const canWrite =
    Boolean(staff?.active) || (member && member.role !== "VIEWER")
  const canManageColumns =
    Boolean(staff?.active) || member?.role === "OWNER" || member?.role === "ADMIN"
  return { canRead: Boolean(member || staff?.active), canWrite, canManageColumns }
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id!
  const { id: workspaceId } = await ctx.params
  const access = await canManage(workspaceId, userId)
  if (!access.canRead) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const columns = await ensureWorkspaceBoardColumns(workspaceId)
  return NextResponse.json({ columns })
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id!
  const { id: workspaceId } = await ctx.params
  const access = await canManage(workspaceId, userId)
  if (!access.canManageColumns) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  await ensureWorkspaceBoardColumns(workspaceId)

  const maxPos = await prisma.workspaceBoardColumn.aggregate({
    where: { workspaceId },
    _max: { position: true },
  })
  const position = (maxPos._max.position ?? 0) + 10

  const row = await prisma.workspaceBoardColumn.create({
    data: {
      id: randomUUID(),
      workspaceId,
      label: parsed.data.label.trim(),
      status: parsed.data.status,
      position,
      color: parsed.data.color ?? "violet",
      isSystem: false,
    },
  })

  return NextResponse.json({ column: serializeBoardColumn(row) }, { status: 201 })
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id!
  const { id: workspaceId } = await ctx.params
  const access = await canManage(workspaceId, userId)
  if (!access.canManageColumns) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)

  if (body?.orderedIds) {
    const parsed = reorderSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const cols = await prisma.workspaceBoardColumn.findMany({
      where: { workspaceId, id: { in: parsed.data.orderedIds } },
      select: { id: true },
    })
    if (cols.length !== parsed.data.orderedIds.length) {
      return NextResponse.json({ error: "Unknown column id" }, { status: 400 })
    }

    await prisma.$transaction(
      parsed.data.orderedIds.map((id, i) =>
        prisma.workspaceBoardColumn.update({
          where: { workspaceId_id: { workspaceId, id } },
          data: { position: i * 10 },
        })
      )
    )

    const columns = await ensureWorkspaceBoardColumns(workspaceId)
    return NextResponse.json({ columns })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const existing = await prisma.workspaceBoardColumn.findUnique({
    where: { workspaceId_id: { workspaceId, id: parsed.data.columnId } },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.isSystem && parsed.data.label !== undefined) {
    return NextResponse.json({ error: "System column labels cannot be renamed" }, { status: 400 })
  }

  const row = await prisma.workspaceBoardColumn.update({
    where: { workspaceId_id: { workspaceId, id: parsed.data.columnId } },
    data: {
      ...(parsed.data.label !== undefined ? { label: parsed.data.label.trim() } : {}),
      ...(parsed.data.color !== undefined ? { color: parsed.data.color } : {}),
    },
  })

  return NextResponse.json({ column: serializeBoardColumn(row) })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id!
  const { id: workspaceId } = await ctx.params
  const access = await canManage(workspaceId, userId)
  if (!access.canManageColumns) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const columnId = new URL(req.url).searchParams.get("columnId")
  if (!columnId) return NextResponse.json({ error: "columnId required" }, { status: 400 })

  const col = await prisma.workspaceBoardColumn.findUnique({
    where: { workspaceId_id: { workspaceId, id: columnId } },
  })
  if (!col) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (col.isSystem) {
    return NextResponse.json({ error: "System columns cannot be removed" }, { status: 400 })
  }

  const fallback = await prisma.workspaceBoardColumn.findFirst({
    where: { workspaceId, status: col.status, id: { not: columnId } },
    orderBy: { position: "asc" },
  })

  await prisma.$transaction(async (tx) => {
    if (fallback) {
      await tx.ticket.updateMany({
        where: { workspaceId, boardColumnId: columnId },
        data: { boardColumnId: fallback.id, status: fallback.status },
      })
    } else {
      await tx.ticket.updateMany({
        where: { workspaceId, boardColumnId: columnId },
        data: { boardColumnId: null },
      })
    }
    await tx.workspaceBoardColumn.delete({
      where: { workspaceId_id: { workspaceId, id: columnId } },
    })
  })

  const columns = await ensureWorkspaceBoardColumns(workspaceId)
  return NextResponse.json({ columns })
}
