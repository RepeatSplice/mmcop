import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  type: z.enum(["GITHUB_REPO", "DISCORD_CHANNEL"]),
  externalId: z.string().min(1).max(500),
})

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id as string
  const { id: workspaceId } = await ctx.params

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  })
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const existing = await prisma.integrationConnection.findUnique({
    where: {
      type_externalId: { type: parsed.data.type, externalId: parsed.data.externalId },
    },
    select: { id: true, workspaceId: true },
  })

  if (existing && existing.workspaceId !== workspaceId) {
    return NextResponse.json(
      { error: "This integration is already connected to another workspace" },
      { status: 409 }
    )
  }

  const conn = existing
    ? await prisma.integrationConnection.update({
        where: { id: existing.id },
        data: {},
      })
    : await prisma.integrationConnection.create({
        data: {
          workspaceId,
          type: parsed.data.type,
          externalId: parsed.data.externalId,
        },
      })

  await prisma.activityEvent.create({
    data: {
      workspaceId,
      source: "SYSTEM",
      type: "integration.added",
      body: `${parsed.data.type} connected: ${parsed.data.externalId}`,
      actorUserId: userId,
    },
  })

  return NextResponse.json({ integration: conn }, { status: 201 })
}

