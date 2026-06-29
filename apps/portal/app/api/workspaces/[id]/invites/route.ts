import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateInviteToken, hashInviteToken, normalizeEmail } from "@/lib/invites"
import { getSiteUrl } from "@/lib/stripe"
import { sendEmail } from "@/lib/resend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
})

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id as string
  const { id: workspaceId } = await ctx.params

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const emailLower = normalizeEmail(parsed.data.email)

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  })
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Don’t allow ADMINs to invite OWNERS.
  if (parsed.data.role === "OWNER" && member.role !== "OWNER") {
    return NextResponse.json({ error: "Only OWNER can invite OWNER" }, { status: 403 })
  }

  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, name: true, slug: true, active: true },
  })
  if (!ws?.active) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // If they’re already a member, no invite needed.
  const existingUser = await prisma.user.findUnique({
    where: { email: emailLower },
    select: { id: true },
  })
  if (existingUser) {
    const already = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: existingUser.id } },
      select: { id: true },
    })
    if (already) {
      return NextResponse.json({ ok: true, alreadyMember: true })
    }
  }

  const token = generateInviteToken()
  const tokenHash = hashInviteToken(token)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const invite = await prisma.workspaceInvite.create({
    data: {
      workspaceId,
      emailLower,
      role: parsed.data.role,
      tokenHash,
      createdByUserId: userId,
      expiresAt,
    },
    select: { id: true },
  })

  const acceptUrl = `${getSiteUrl()}/invites/accept?token=${encodeURIComponent(token)}`

  await sendEmail({
    to: emailLower,
    subject: `You’ve been invited to ${ws.name} — Monarch Portal`,
    text: `You’ve been invited to join ${ws.name}.\n\nAccept invite:\n${acceptUrl}\n\nThis link expires in 7 days.`,
  })

  await prisma.notification.create({
    data: {
      userId,
      workspaceId,
      type: "invite.sent",
      title: `Invite sent to ${emailLower}`,
      body: `Role: ${parsed.data.role}`,
      url: `/workspace/${ws.slug}/settings/members`,
    },
  })

  return NextResponse.json({ ok: true, inviteId: invite.id, acceptUrl })
}

