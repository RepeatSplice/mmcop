import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { trySyncDiscordMember } from "@/lib/discord-provision"
import { logWorkspaceEvent } from "@/lib/discord-events"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const actorUserId = (session.user as { id?: string }).id as string
  const { id: workspaceId, userId: targetUserId } = await ctx.params

  const actor = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: actorUserId } },
    select: { role: true },
  })
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const isSelf = actorUserId === targetUserId

  if (isSelf && actor.role !== "OWNER") {
    await prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId: actorUserId } },
    })
    void trySyncDiscordMember(workspaceId, actorUserId, "remove")
    return NextResponse.json({ ok: true })
  }

  if (actor.role !== "OWNER" && actor.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      const target = await tx.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
        select: { role: true },
      })
      if (!target) throw new Error("NOT_FOUND")

      if (target.role === "OWNER") {
        const owners = await tx.workspaceMember.count({
          where: { workspaceId, role: "OWNER" },
        })
        if (owners <= 1) throw new Error("LAST_OWNER")
      }

      await tx.workspaceMember.delete({
        where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
      })

      await tx.activityEvent.create({
        data: {
          workspaceId,
          source: "SYSTEM",
          type: "workspace.member_removed",
          body: "Member removed.",
          actorUserId,
        },
      })
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ""
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (msg === "LAST_OWNER") {
      return NextResponse.json({ error: "Cannot remove the last OWNER" }, { status: 409 })
    }
    throw e
  }

  void trySyncDiscordMember(workspaceId, targetUserId, "remove")
  logWorkspaceEvent(workspaceId, "A member was removed from the workspace.")

  return NextResponse.json({ ok: true })
}
