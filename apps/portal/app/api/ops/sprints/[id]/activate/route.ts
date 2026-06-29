import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/ops"
import { announceSprintActivated } from "@/lib/discord-events"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await requireStaff()
  const { id } = await ctx.params

  const sprint = await prisma.sprint.findUnique({
    where: { id },
    select: { id: true, workspaceId: true, status: true, name: true },
  })
  if (!sprint) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.sprint.update({
    where: { id: sprint.id },
    data: { status: "ACTIVE" },
  })

  announceSprintActivated(sprint.workspaceId, sprint.name)

  return NextResponse.redirect(new URL(`/ops/workspaces/${sprint.workspaceId}`, req.url))
}

