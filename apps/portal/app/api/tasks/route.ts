import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(2).max(200),
  discipline: z.enum(["Scripts", "GFX", "Imports", "Weapons", "Branding", "VFX", "Hosting", "Other"]),
  description: z.string().max(8000).optional(),
  sprintId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id as string
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: parsed.data.workspaceId, userId } },
    select: { role: true },
  })
  if (!member || member.role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const task = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.update({
      where: { id: parsed.data.workspaceId },
      data: { nextTaskNumber: { increment: 1 } },
      select: { nextTaskNumber: true, slug: true },
    })

    const number = ws.nextTaskNumber - 1
    const key = `${ws.slug.toUpperCase()}-${number}`

    const created = await tx.task.create({
      data: {
        workspaceId: parsed.data.workspaceId,
        sprintId: parsed.data.sprintId || null,
        createdById: userId,
        number,
        key,
        title: parsed.data.title,
        description: parsed.data.description || null,
        discipline: parsed.data.discipline as any,
        status: parsed.data.sprintId ? "PLANNED" : "BACKLOG",
        priority: 1000,
      },
      include: { comments: true },
    })

    await tx.activityEvent.create({
      data: {
        workspaceId: parsed.data.workspaceId,
        taskId: created.id,
        source: "PORTAL",
        type: "task.created",
        body: `${created.key} created: ${created.title}`,
        actorUserId: userId,
      },
    })

    return created
  })

  return NextResponse.json({ task }, { status: 201 })
}

