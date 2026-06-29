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
  description: z.string().min(10).max(8000),
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

  const job = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.update({
      where: { id: parsed.data.workspaceId },
      data: { nextJobNumber: { increment: 1 } },
      select: { nextJobNumber: true },
    })

    const number = ws.nextJobNumber - 1
    const key = `JOB-${String(number).padStart(3, "0")}`

    const created = await tx.job.create({
      data: {
        workspaceId: parsed.data.workspaceId,
        createdById: userId,
        number,
        key,
        title: parsed.data.title,
        description: parsed.data.description,
        discipline: parsed.data.discipline as any,
        status: "REQUESTED",
        priority: 1000,
      },
    })

    await tx.activityEvent.create({
      data: {
        workspaceId: parsed.data.workspaceId,
        jobId: created.id,
        source: "PORTAL",
        type: "job.created",
        body: `${created.key} requested: ${created.title}`,
        actorUserId: userId,
      },
    })

    return created
  })

  return NextResponse.json({ job }, { status: 201 })
}

