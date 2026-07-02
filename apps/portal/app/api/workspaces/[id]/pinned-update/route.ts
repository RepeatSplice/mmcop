import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { discordAnnounce } from "@/lib/discord-events"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id!
  const { id: workspaceId } = await ctx.params

  const [member, staff] = await Promise.all([
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    }),
    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),
  ])
  if (!member && !staff?.active) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const pinned = await prisma.workspacePinnedUpdate.findFirst({
    where: { workspaceId, active: true },
    orderBy: { pinnedAt: "desc" },
  })

  return NextResponse.json({ pinned })
}

const postSchema = z.object({
  body: z.string().min(1).max(4000),
  mirrorDiscord: z.boolean().optional(),
})

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id!
  const { id: workspaceId } = await ctx.params

  const [member, staff] = await Promise.all([
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    }),
    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),
  ])
  const canPin =
    Boolean(staff?.active) || (member && (member.role === "OWNER" || member.role === "ADMIN"))
  if (!canPin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  await prisma.workspacePinnedUpdate.updateMany({
    where: { workspaceId, active: true },
    data: { active: false },
  })

  const pinned = await prisma.workspacePinnedUpdate.create({
    data: {
      workspaceId,
      body: parsed.data.body.trim(),
      pinnedById: userId,
    },
  })

  if (parsed.data.mirrorDiscord !== false) {
    discordAnnounce(workspaceId, "Server update", parsed.data.body.trim().slice(0, 500))
  }

  return NextResponse.json({ pinned }, { status: 201 })
}
