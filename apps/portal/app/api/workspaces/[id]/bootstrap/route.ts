import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Lightweight warm-up for workspace shell (cached per request on server). */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id!
  const { id: workspaceId } = await ctx.params

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  })
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const canManageBilling = member.role === "OWNER" || member.role === "ADMIN"

  const read = await prisma.workspaceChatRead.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { lastReadAt: true },
  })

  const [workspace, unreadChat] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        slug: true,
        name: true,
        stripeSubscriptionId: true,
        stripeSubscriptionStatus: true,
      },
    }),
    prisma.workspaceChatMessage.count({
      where: {
        workspaceId,
        ...(read
          ? {
              createdAt: { gt: read.lastReadAt },
              OR: [{ authorUserId: null }, { authorUserId: { not: userId } }],
            }
          : {}),
      },
    }),
  ])

  const workspacePayload = workspace
    ? {
        id: workspace.id,
        slug: workspace.slug,
        name: workspace.name,
        stripeSubscriptionStatus: workspace.stripeSubscriptionStatus,
        ...(canManageBilling ? { stripeSubscriptionId: workspace.stripeSubscriptionId } : {}),
      }
    : null

  return NextResponse.json({
    ok: true,
    workspace: workspacePayload,
    unreadChat,
  })
}
