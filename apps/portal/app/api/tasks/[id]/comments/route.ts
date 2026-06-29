import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const postSchema = z.object({ body: z.string().min(1).max(8000) })

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id as string
  const { id } = await ctx.params

  const task = await prisma.task.findUnique({
    where: { id },
    select: { id: true, workspaceId: true },
  })
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [member, staff] = await Promise.all([
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: task.workspaceId, userId } },
      select: { role: true },
    }),
    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),
  ])
  const canRead = Boolean(staff?.active) || Boolean(member)
  if (!canRead) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const comments = await prisma.taskComment.findMany({
    where: { taskId: task.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      authorId: true,
      authorName: true,
      body: true,
      createdAt: true,
    },
  })

  return NextResponse.json({
    comments: comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
  })
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id as string
  const { id } = await ctx.params

  const body = await req.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const task = await prisma.task.findUnique({
    where: { id },
    select: { id: true, workspaceId: true, key: true, title: true },
  })
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [member, staff] = await Promise.all([
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: task.workspaceId, userId } },
      select: { role: true },
    }),
    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),
  ])
  const canWrite = Boolean(staff?.active) || (member && member.role !== "VIEWER")
  if (!canWrite) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const authorName = session.user.name || session.user.email || "User"

  const created = await prisma.$transaction(async (tx) => {
    const c = await tx.taskComment.create({
      data: {
        taskId: task.id,
        authorId: userId,
        authorName,
        body: parsed.data.body,
      },
      select: {
        id: true,
        authorId: true,
        authorName: true,
        body: true,
        createdAt: true,
      },
    })

    await tx.activityEvent.create({
      data: {
        workspaceId: task.workspaceId,
        taskId: task.id,
        source: "PORTAL",
        type: "task.comment",
        body: `${task.key}: comment added`,
        actorUserId: userId,
      },
    })

    return c
  })

  return NextResponse.json(
    { comment: { ...created, createdAt: created.createdAt.toISOString() } },
    { status: 201 }
  )
}

