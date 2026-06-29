import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  tryProvisionWorkspaceDiscord,
  tryRepairWorkspaceDiscordPermissions,
} from "@/lib/discord-provision"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id as string
  const { id: workspaceId } = await ctx.params

  const [member, staff] = await Promise.all([
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    }),
    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),
  ])
  const canManage =
    Boolean(staff?.active) || (member && (member.role === "OWNER" || member.role === "ADMIN"))
  if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
      members: { where: { role: "OWNER" }, take: 1, select: { userId: true } },
    },
  })
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const ownerUserId = workspace.members[0]?.userId
  if (!ownerUserId) {
    return NextResponse.json({ error: "No workspace owner" }, { status: 400 })
  }

  const existing = await prisma.workspaceDiscord.findUnique({
    where: { workspaceId },
    select: { provisionedAt: true, categoryId: true },
  })

  if (existing?.provisionedAt && existing.categoryId !== "0") {
    const repair = await tryRepairWorkspaceDiscordPermissions(workspaceId)
    if (!repair.ok) {
      return NextResponse.json({ error: repair.error }, { status: 502 })
    }
    return NextResponse.json({ ok: true, repaired: true })
  }

  const result = await tryProvisionWorkspaceDiscord({
    workspaceId: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    ownerUserId,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
