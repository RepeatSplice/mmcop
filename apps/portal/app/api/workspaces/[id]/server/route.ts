import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
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

  const server = await prisma.workspaceServer.findUnique({ where: { workspaceId } })
  return NextResponse.json({ server })
}

const patchSchema = z.object({
  provider: z.enum(["MANUAL", "BATTLEMETRICS", "CFTOOLS", "CUSTOM_WEBHOOK"]).optional(),
  externalId: z.string().max(200).nullable().optional(),
  displayName: z.string().max(120).nullable().optional(),
  online: z.boolean().optional(),
  playerCount: z.number().int().min(0).optional(),
  maxPlayers: z.number().int().min(0).optional(),
  mapName: z.string().max(200).nullable().optional(),
  version: z.string().max(120).nullable().optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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
  const canAdmin =
    Boolean(staff?.active) || (member && (member.role === "OWNER" || member.role === "ADMIN"))
  if (!canAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const server = await prisma.workspaceServer.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      provider: parsed.data.provider ?? "MANUAL",
      externalId: parsed.data.externalId ?? null,
      displayName: parsed.data.displayName ?? "Game server",
      online: parsed.data.online ?? false,
      playerCount: parsed.data.playerCount ?? 0,
      maxPlayers: parsed.data.maxPlayers ?? 0,
      mapName: parsed.data.mapName ?? null,
      version: parsed.data.version ?? null,
      lastSeenAt: new Date(),
    },
    update: {
      ...parsed.data,
      lastSeenAt: new Date(),
    },
  })

  return NextResponse.json({ server })
}
