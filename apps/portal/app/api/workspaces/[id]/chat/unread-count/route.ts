import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id!
  const { id: workspaceId } = await ctx.params

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  })
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const read = await prisma.workspaceChatRead.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { lastReadAt: true },
  })

  const since = read?.lastReadAt ?? new Date(0)

  const count = await prisma.workspaceChatMessage.count({
    where: {
      workspaceId,
      createdAt: { gt: since },
      OR: [{ authorUserId: null }, { authorUserId: { not: userId } }],
    },
  })

  const last = await prisma.workspaceChatMessage.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  })

  return NextResponse.json({
    count,
    lastMessageAt: last?.createdAt?.toISOString() ?? null,
  })
}
