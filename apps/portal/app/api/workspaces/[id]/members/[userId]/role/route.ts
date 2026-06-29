import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
})

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const actorUserId = (session.user as { id?: string }).id as string
  const { id: workspaceId, userId: targetUserId } = await ctx.params

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const actor = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: actorUserId } },
    select: { role: true },
  })
  if (!actor || (actor.role !== "OWNER" && actor.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (parsed.data.role === "OWNER" && actor.role !== "OWNER") {
    return NextResponse.json({ error: "Only OWNER can assign OWNER" }, { status: 403 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      const target = await tx.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
        select: { role: true },
      })
      if (!target) throw new Error("NOT_FOUND")

      if (target.role === "OWNER" && parsed.data.role !== "OWNER") {
        const owners = await tx.workspaceMember.count({
          where: { workspaceId, role: "OWNER" },
        })
        if (owners <= 1) throw new Error("LAST_OWNER")
      }

      await tx.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
        data: { role: parsed.data.role },
      })

      await tx.activityEvent.create({
        data: {
          workspaceId,
          source: "SYSTEM",
          type: "workspace.member_role_changed",
          body: `Member role changed to ${parsed.data.role}.`,
          actorUserId,
        },
      })
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ""
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (msg === "LAST_OWNER") {
      return NextResponse.json({ error: "Cannot demote the last OWNER" }, { status: 409 })
    }
    throw e
  }

  return NextResponse.json({ ok: true })
}
