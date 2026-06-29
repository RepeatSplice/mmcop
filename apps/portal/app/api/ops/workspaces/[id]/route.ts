import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { deprovisionWorkspaceDiscord } from "@/lib/discord-bot-client"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const deleteSchema = z.object({
  confirmSlug: z.string().min(1),
})

async function requireStaffApi() {
  const session = await auth()
  if (!session?.user) return null
  const userId = (session.user as { id?: string }).id
  if (!userId) return null
  const staff = await prisma.staffProfile.findUnique({
    where: { userId },
    select: { role: true, active: true },
  })
  if (!staff?.active) return null
  return { userId, role: staff.role }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const staff = await requireStaffApi()
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (staff.role !== "OPS_ADMIN") {
    return NextResponse.json({ error: "Only ops admins can delete workspaces" }, { status: 403 })
  }

  const { id } = await ctx.params
  const parsed = deleteSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "confirmSlug required" }, { status: 400 })
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { id: true, slug: true, name: true },
  })
  if (!workspace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (parsed.data.confirmSlug !== workspace.slug) {
    return NextResponse.json({ error: "Slug confirmation does not match" }, { status: 400 })
  }

  const discord = await prisma.workspaceDiscord.findUnique({
    where: { workspaceId: workspace.id },
    select: {
      guildId: true,
      categoryId: true,
      chatChannelId: true,
      announcementsChannelId: true,
      logsChannelId: true,
      infoChannelId: true,
    },
  })

  if (discord?.categoryId) {
    void deprovisionWorkspaceDiscord({
      guildId: discord.guildId,
      categoryId: discord.categoryId,
      channelIds: [
        discord.chatChannelId,
        discord.announcementsChannelId,
        discord.logsChannelId,
        discord.infoChannelId,
      ],
    }).catch((e) => console.warn("[discord] deprovision failed", e))
  }

  await prisma.workspace.delete({ where: { id: workspace.id } })

  return NextResponse.json({ ok: true, deleted: { id: workspace.id, slug: workspace.slug } })
}
