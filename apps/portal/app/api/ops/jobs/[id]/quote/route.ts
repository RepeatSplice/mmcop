import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireStaff } from "@/lib/ops"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/resend"
import { isDiscordWebhookUrl, postDiscordWebhook } from "@/lib/discord"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  type: z.enum(["FIXED", "HOURLY_ESTIMATE"]),
  amountCents: z.number().int().min(1),
  currency: z.string().min(3).max(8),
  scope: z.string().min(10).max(8000),
  timeline: z.string().max(2000).optional(),
})

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff()
  const { id } = await ctx.params

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const job = await prisma.job.findUnique({
    where: { id },
    select: { id: true, workspaceId: true, key: true },
  })
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.create({
      data: {
        jobId: job.id,
        createdById: staff.userId,
        type: parsed.data.type,
        amountCents: parsed.data.amountCents,
        currency: parsed.data.currency,
        scope: parsed.data.scope,
        timeline: parsed.data.timeline || null,
      },
    })
    await tx.job.update({ where: { id: job.id }, data: { status: "QUOTED" } })
    await tx.activityEvent.create({
      data: {
        workspaceId: job.workspaceId,
        jobId: job.id,
        source: "SYSTEM",
        type: "quote.created",
        body: `${job.key}: quote sent`,
        actorUserId: staff.userId,
      },
    })

    const ws = await tx.workspace.findUnique({
      where: { id: job.workspaceId },
      select: { slug: true },
    })

    const members = await tx.workspaceMember.findMany({
      where: { workspaceId: job.workspaceId },
      include: { user: { select: { id: true, email: true } } },
    })

    await tx.notification.createMany({
      data: members.map((m) => ({
        userId: m.userId,
        workspaceId: job.workspaceId,
        type: "quote.ready",
        title: `${job.key}: Quote ready`,
        body: `Amount: ${quote.currency.toUpperCase()} ${(quote.amountCents / 100).toFixed(2)}\n\nOpen the job to approve the quote.`,
        url: ws ? `/workspace/${ws.slug}/tickets/${job.key}` : undefined,
      })),
    })
  })

  // Best-effort email (outside transaction)
  const memberEmails = await prisma.workspaceMember.findMany({
    where: { workspaceId: job.workspaceId },
    include: { user: { select: { email: true } } },
  })
  await Promise.all(
    memberEmails
      .map((m) => m.user.email)
      .filter(Boolean)
      .map((email) =>
        sendEmail({
          to: email!,
          subject: `${job.key}: Quote ready`,
          text: `A quote is ready for ${job.key}.\n\nLog in to Monarch Portal to review and approve it.`,
        })
      )
  )

  const hooks = await prisma.integrationConnection.findMany({
    where: { workspaceId: job.workspaceId, type: "DISCORD_CHANNEL" },
    select: { externalId: true },
  })
  const webhookUrls = hooks.map((h) => h.externalId).filter(isDiscordWebhookUrl)
  await Promise.all(
    webhookUrls.map((url) =>
      postDiscordWebhook({
        webhookUrl: url,
        content: `${job.key}: Quote ready in Monarch Portal.`,
      })
    )
  )

  return NextResponse.json({ ok: true }, { status: 201 })
}

