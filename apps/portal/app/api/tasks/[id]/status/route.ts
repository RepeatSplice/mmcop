import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/resend"
import { isDiscordWebhookUrl, postDiscordWebhook } from "@/lib/discord"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  status: z.enum(["BACKLOG", "PLANNED", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"]),
  sprintId: z.string().optional(),
  workspaceId: z.string(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id as string
  const { id } = await ctx.params

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const [member, staff] = await Promise.all([
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: parsed.data.workspaceId, userId } },
      select: { role: true },
    }),
    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),
  ])
  const canWrite = Boolean(staff?.active) || (member && member.role !== "VIEWER")
  if (!canWrite) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const task = await prisma.task.findUnique({
    where: { id },
    select: { id: true, workspaceId: true, key: true, title: true, status: true },
  })
  if (!task || task.workspaceId !== parsed.data.workspaceId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: task.id },
      data: { status: parsed.data.status },
    })
    await tx.activityEvent.create({
      data: {
        workspaceId: task.workspaceId,
        taskId: task.id,
        source: "PORTAL",
        type: "task.status_changed",
        body: JSON.stringify({ taskId: task.id, from: task.status, to: parsed.data.status }),
        actorUserId: userId,
      },
    })

    if (parsed.data.status === "REVIEW") {
      const ws = await tx.workspace.findUnique({
        where: { id: task.workspaceId },
        select: { slug: true },
      })
      const members = await tx.workspaceMember.findMany({
        where: { workspaceId: task.workspaceId },
        include: { user: { select: { email: true } } },
      })
      await tx.notification.createMany({
        data: members.map((m) => ({
          userId: m.userId,
          workspaceId: task.workspaceId,
          type: "task.review",
          title: `${task.key}: In review`,
          body: `${task.title}`,
          url: ws ? `/workspace/${ws.slug}/board` : undefined,
        })),
      })
    }
  })

  if (parsed.data.status === "REVIEW") {
    const emails = await prisma.workspaceMember.findMany({
      where: { workspaceId: task.workspaceId },
      include: { user: { select: { email: true } } },
    })
    await Promise.all(
      emails
        .map((m) => m.user.email)
        .filter(Boolean)
        .map((email) =>
          sendEmail({
            to: email!,
            subject: `${task.key}: In review`,
            text: `${task.title}\n\nA task moved to Review in Monarch Portal.`,
          })
        )
    )
  }

  if (parsed.data.status === "DONE" || parsed.data.status === "REVIEW") {
    const hooks = await prisma.integrationConnection.findMany({
      where: { workspaceId: task.workspaceId, type: "DISCORD_CHANNEL" },
      select: { externalId: true },
    })
    const webhookUrls = hooks.map((h) => h.externalId).filter(isDiscordWebhookUrl)
    await Promise.all(
      webhookUrls.map((url) =>
        postDiscordWebhook({
          webhookUrl: url,
          content: `${task.key} moved to ${parsed.data.status}: ${task.title}`,
        })
      )
    )
  }

  return NextResponse.json({ ok: true })
}

