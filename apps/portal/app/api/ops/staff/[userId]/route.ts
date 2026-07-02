import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireStaff } from "@/lib/ops"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const patchSchema = z.object({
  role: z.enum(["STAFF", "OPS_ADMIN", "FINANCE"]).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  const caller = await requireStaff()
  if (caller.role !== "OPS_ADMIN") {
    return NextResponse.json({ error: "OPS_ADMIN required" }, { status: 403 })
  }

  const { userId } = await ctx.params

  if (userId === caller.userId) {
    return NextResponse.json({ error: "Cannot change your own role or status" }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const target = await prisma.staffProfile.findUnique({ where: { userId } })
  if (!target) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
  }

  // Prevent demoting the last OPS_ADMIN
  if (
    (parsed.data.role !== undefined && parsed.data.role !== "OPS_ADMIN" && target.role === "OPS_ADMIN") ||
    (parsed.data.active === false && target.role === "OPS_ADMIN")
  ) {
    const adminCount = await prisma.staffProfile.count({
      where: { role: "OPS_ADMIN", active: true },
    })
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot demote or deactivate the last OPS_ADMIN" },
        { status: 400 }
      )
    }
  }

  const updated = await prisma.staffProfile.update({
    where: { userId },
    data: {
      ...(parsed.data.role !== undefined ? { role: parsed.data.role } : {}),
      ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
    },
    include: {
      user: { select: { name: true, email: true, image: true, discordUserId: true } },
    },
  })

  return NextResponse.json({
    staff: {
      userId: updated.userId,
      name: updated.user.name,
      email: updated.user.email,
      image: updated.user.image,
      discordUserId: updated.user.discordUserId,
      role: updated.role,
      active: updated.active,
      createdAt: updated.createdAt.toISOString(),
    },
  })
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  const caller = await requireStaff()
  if (caller.role !== "OPS_ADMIN") {
    return NextResponse.json({ error: "OPS_ADMIN required" }, { status: 403 })
  }

  const { userId } = await ctx.params

  if (userId === caller.userId) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 })
  }

  const target = await prisma.staffProfile.findUnique({ where: { userId } })
  if (!target) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
  }

  if (target.role === "OPS_ADMIN") {
    const adminCount = await prisma.staffProfile.count({
      where: { role: "OPS_ADMIN", active: true },
    })
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last OPS_ADMIN" },
        { status: 400 }
      )
    }
  }

  await prisma.staffProfile.delete({ where: { userId } })

  return NextResponse.json({ ok: true })
}
