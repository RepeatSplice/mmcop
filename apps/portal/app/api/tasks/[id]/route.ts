import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/resend"
import { isDiscordWebhookUrl, postDiscordWebhook } from "@/lib/discord"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const patchSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(8000).nullable().optional(),
  discipline: z
    .enum(["Scripts", "GFX", "Imports", "Weapons", "Branding", "VFX", "Hosting", "Other"])
    .optional(),
  status: z.enum(["BACKLOG", "PLANNED", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"]).optional(),
  priority: z.number().int().min(0).max(100000).optional(),
  sprintId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id as string
  const { id } = await ctx.params

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
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
    select: {
      id: true,
      workspaceId: true,
      key: true,
      title: true,
      status: true,
      sprintId: true,
      assigneeId: true,
      dueDate: true,
      priority: true,
      discipline: true,
    },
  })
  if (!task || task.workspaceId !== parsed.data.workspaceId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const existingTask = task

  const nextDueDate =
    parsed.data.dueDate === undefined
      ? undefined
      : parsed.data.dueDate === null
        ? null
        : new Date(parsed.data.dueDate)

  if (parsed.data.assigneeId !== undefined && parsed.data.assigneeId !== null) {
    const assigneeMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: parsed.data.workspaceId,
          userId: parsed.data.assigneeId,
        },
      },
      select: { userId: true },
    })
    if (!assigneeMember) {
      return NextResponse.json({ error: "Assignee must be a workspace member" }, { status: 400 })
    }
  }

  if (parsed.data.sprintId !== undefined && parsed.data.sprintId !== null) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: parsed.data.sprintId },
      select: { id: true, workspaceId: true },
    })
    if (!sprint || sprint.workspaceId !== parsed.data.workspaceId) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 400 })
    }
  }

  const changes: Record<string, { from: unknown; to: unknown }> = {}
  function track<K extends keyof typeof existingTask>(k: K, to: unknown) {
    if (to === undefined) return
    const from = existingTask[k]
    if (from === to) return
    changes[String(k)] = { from, to }
  }

  track("title", parsed.data.title)
  track("status", parsed.data.status)
  track("priority", parsed.data.priority)
  track("discipline", parsed.data.discipline)
  track("sprintId", parsed.data.sprintId)
  track("assigneeId", parsed.data.assigneeId)
  track("dueDate", nextDueDate === undefined ? undefined : nextDueDate?.toISOString?.() ?? null)

  const updateData: any = {}
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description
  if (parsed.data.discipline !== undefined) updateData.discipline = parsed.data.discipline
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status
  if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority
  if (parsed.data.sprintId !== undefined) updateData.sprintId = parsed.data.sprintId
  if (parsed.data.assigneeId !== undefined) updateData.assigneeId = parsed.data.assigneeId
  if (nextDueDate !== undefined) updateData.dueDate = nextDueDate

  const nextStatus = (parsed.data.status ?? existingTask.status) as string

  await prisma.$transaction(async (tx) => {
    await tx.task.update({ where: { id: existingTask.id }, data: updateData })

    if (Object.keys(changes).length > 0) {
      await tx.activityEvent.create({
        data: {
          workspaceId: existingTask.workspaceId,
          taskId: existingTask.id,
          source: "PORTAL",
          type: "task.updated",
          body: JSON.stringify({ taskKey: existingTask.key, changes }),
          actorUserId: userId,
        },
      })
    }

    if (parsed.data.status !== undefined) {
      await tx.activityEvent.create({
        data: {
          workspaceId: existingTask.workspaceId,
          taskId: existingTask.id,
          source: "PORTAL",
          type: "task.status_changed",
          body: JSON.stringify({
            taskId: existingTask.id,
            from: existingTask.status,
            to: parsed.data.status,
          }),
          actorUserId: userId,
        },
      })

      if (parsed.data.status === "REVIEW") {
        const ws = await tx.workspace.findUnique({
          where: { id: existingTask.workspaceId },
          select: { slug: true },
        })
        const members = await tx.workspaceMember.findMany({
          where: { workspaceId: existingTask.workspaceId },
          include: { user: { select: { email: true } } },
        })
        await tx.notification.createMany({
          data: members.map((m) => ({
            userId: m.userId,
            workspaceId: existingTask.workspaceId,
            type: "task.review",
            title: `${existingTask.key}: In review`,
            body: parsed.data.title ?? existingTask.title,
            url: ws ? `/workspace/${ws.slug}/board` : undefined,
          })),
        })
      }
    }
  })

  if (nextStatus === "REVIEW") {
    const emails = await prisma.workspaceMember.findMany({
      where: { workspaceId: existingTask.workspaceId },
      include: { user: { select: { email: true } } },
    })
    await Promise.all(
      emails
        .map((m) => m.user.email)
        .filter(Boolean)
        .map((email) =>
          sendEmail({
            to: email!,
            subject: `${existingTask.key}: In review`,
            text: `${parsed.data.title ?? existingTask.title}\n\nA task moved to Review in Monarch Portal.`,
          })
        )
    )
  }

  if (nextStatus === "DONE" || nextStatus === "REVIEW") {
    const hooks = await prisma.integrationConnection.findMany({
      where: { workspaceId: existingTask.workspaceId, type: "DISCORD_CHANNEL" },
      select: { externalId: true },
    })
    const webhookUrls = hooks.map((h) => h.externalId).filter(isDiscordWebhookUrl)
    await Promise.all(
      webhookUrls.map((url) =>
        postDiscordWebhook({
          webhookUrl: url,
          content: `${existingTask.key} moved to ${nextStatus}: ${parsed.data.title ?? existingTask.title}`,
        })
      )
    )
  }

  return NextResponse.json({ ok: true })
}

