import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; inviteId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: workspaceId, inviteId } = await ctx.params

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  })
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const invite = await prisma.workspaceInvite.findUnique({
    where: { id: inviteId },
    select: { workspaceId: true, acceptedAt: true },
  })
  if (!invite || invite.workspaceId !== workspaceId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (invite.acceptedAt) {
    return NextResponse.json({ error: "Already accepted" }, { status: 400 })
  }

  await prisma.workspaceInvite.delete({ where: { id: inviteId } })
  return NextResponse.json({ ok: true })
}
