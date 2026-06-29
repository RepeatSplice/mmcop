import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  workspaceId: z.string().min(1),
  orderedIds: z.array(z.string().min(1)).min(1).max(1000),
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

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < parsed.data.orderedIds.length; i++) {
      const id = parsed.data.orderedIds[i]!
      await tx.task.updateMany({
        where: { id, workspaceId: parsed.data.workspaceId },
        data: { priority: i * 10 },
      })
    }

    await tx.activityEvent.create({
      data: {
        workspaceId: parsed.data.workspaceId,
        source: "SYSTEM",
        type: "task.reordered",
        body: "Backlog reordered.",
        actorUserId: userId,
      },
    })
  })

  return NextResponse.json({ ok: true })
}

