import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateInviteToken, hashInviteToken } from "@/lib/invites"
import { getSiteUrl } from "@/lib/stripe"
import { sendEmail } from "@/lib/resend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Re-issues the invite by minting a fresh token (the previous one is
 * invalidated because we only store its hash) and emailing the recipient
 * again. Returns the accept URL so the UI can copy-to-clipboard.
 */
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; inviteId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as { id?: string }).id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: workspaceId, inviteId } = await ctx.params

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  })
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const invite = await prisma.workspaceInvite.findUnique({
    where: { id: inviteId },
    select: { workspaceId: true, emailLower: true, role: true, acceptedAt: true },
  })
  if (!invite || invite.workspaceId !== workspaceId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (invite.acceptedAt) {
    return NextResponse.json({ error: "Already accepted" }, { status: 400 })
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  })
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const token = generateInviteToken()
  const tokenHash = hashInviteToken(token)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.workspaceInvite.update({
    where: { id: inviteId },
    data: { tokenHash, expiresAt },
  })

  const acceptUrl = `${getSiteUrl()}/invites/accept?token=${encodeURIComponent(token)}`
  void sendEmail({
    to: invite.emailLower,
    subject: `Reminder: invite to ${workspace.name} — Monarch Portal`,
    text: `You've been invited to join ${workspace.name}.\n\nAccept invite:\n${acceptUrl}\n\nThis link expires in 7 days.`,
  }).catch((e) => console.warn("[invite] resend email failed", e))

  return NextResponse.json({ ok: true, acceptUrl })
}
