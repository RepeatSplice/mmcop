import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/ops"
import { generateSprintRecap } from "@/lib/ai-assist"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  workspaceId: z.string().min(1),
  sprintId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  await requireStaff()
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const sprint = await prisma.sprint.findUnique({
    where: { id: parsed.data.sprintId },
    include: {
      workspace: { select: { name: true } },
      tickets: {
        where: { status: "DONE", type: "TICKET" },
        select: { key: true, title: true },
        take: 30,
      },
    },
  })
  if (!sprint || sprint.workspaceId !== parsed.data.workspaceId) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 })
  }

  const events = await prisma.activityEvent.findMany({
    where: { workspaceId: parsed.data.workspaceId, createdAt: { gte: sprint.startDate } },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { body: true },
  })

  const recap = await generateSprintRecap({
    workspaceName: sprint.workspace.name,
    sprintName: sprint.name,
    hoursUsed: sprint.hoursUsed,
    hoursMax: sprint.hoursMax,
    completedTickets: sprint.tickets,
    activitySnippets: events.map((e) => e.body),
  })

  if (!recap) {
    return NextResponse.json(
      { error: "AI not configured (set OPENAI_API_KEY)" },
      { status: 503 }
    )
  }

  return NextResponse.json({ recap })
}
