import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { advanceSprint } from "@/lib/sprint-rollover"
import { ensureSprintWindow } from "@/lib/sprints"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id as string
  const { id: workspaceId } = await ctx.params

  const [member, staff] = await Promise.all([
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    }),
    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),
  ])
  const canWrite = Boolean(staff?.active) || (member && member.role !== "VIEWER")
  if (!canWrite) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const active = await prisma.sprint.findFirst({
    where: { workspaceId, status: "ACTIVE" },
    select: { id: true },
  })
  if (!active) return NextResponse.json({ error: "No active sprint" }, { status: 400 })

  let result
  try {
    result = await advanceSprint(workspaceId)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ""
    if (msg === "NO_ACTIVE_SPRINT" || msg === "No active sprint to advance") {
      return NextResponse.json({ error: "Sprint already ended or not active" }, { status: 409 })
    }
    throw e
  }
  const window = await ensureSprintWindow(workspaceId)

  return NextResponse.json({
    ok: true,
    rolledCount: result.rolledCount,
    completedSprintId: result.completed?.id ?? null,
    activeSprint: {
      ...window.active,
      startDate: window.active.startDate.toISOString(),
      endDate: window.active.endDate.toISOString(),
    },
  })
}
