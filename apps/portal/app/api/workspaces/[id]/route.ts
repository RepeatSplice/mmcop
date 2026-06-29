import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const patchSchema = z.object({
  calBookingUrl: z.string().url().nullable().optional(),
})

async function canManageWorkspace(workspaceId: string, userId: string) {
  const [member, staff] = await Promise.all([
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    }),
    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),
  ])
  return (
    Boolean(staff?.active) ||
    member?.role === "OWNER" ||
    member?.role === "ADMIN"
  )
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id as string
  const { id: workspaceId } = await ctx.params

  if (!(await canManageWorkspace(workspaceId, userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data: { calBookingUrl?: string | null } = {}
  if (parsed.data.calBookingUrl !== undefined) {
    data.calBookingUrl = parsed.data.calBookingUrl
  }

  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data,
    select: {
      id: true,
      calBookingUrl: true,
    },
  })

  return NextResponse.json({ workspace: updated })
}
