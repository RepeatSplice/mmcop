import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({ body: z.string().min(1).max(8000) })

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id as string
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const job = await prisma.job.findUnique({
    where: { id },
    select: { id: true, workspaceId: true, key: true },
  })
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: job.workspaceId, userId } },
    select: { role: true },
  })
  if (!member || member.role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const authorName = session.user.name || session.user.email || "User"

  await prisma.$transaction(async (tx) => {
    await tx.jobComment.create({
      data: {
        jobId: job.id,
        authorId: userId,
        authorName,
        body: parsed.data.body,
      },
    })
    await tx.activityEvent.create({
      data: {
        workspaceId: job.workspaceId,
        jobId: job.id,
        source: "PORTAL",
        type: "job.comment",
        body: `${job.key}: comment added`,
        actorUserId: userId,
      },
    })
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}

