import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hashInviteToken } from "@/lib/invites"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Read-only inspect of an invite so the accept page can show "Join {name} as
 * {role}?" before the user commits. We still require an authenticated session
 * (matching the accept endpoint) so we don't leak workspace names to the open
 * internet.
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = req.nextUrl.searchParams.get("token") || ""
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 })

  const tokenHash = hashInviteToken(token)
  const invite = await prisma.workspaceInvite.findFirst({
    where: { tokenHash },
    select: {
      id: true,
      role: true,
      emailLower: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,
      workspace: { select: { name: true, slug: true } },
    },
  })

  if (!invite) {
    return NextResponse.json(
      { ok: false, reason: "not_found", error: "We couldn't find that invite. The link may be old or revoked." },
      { status: 404 }
    )
  }
  if (invite.acceptedAt) {
    return NextResponse.json({
      ok: false,
      reason: "already_accepted",
      error: "This invite was already accepted. Try signing in or asking the workspace admin to send a new one.",
      workspace: invite.workspace,
    })
  }
  if (invite.revokedAt) {
    return NextResponse.json({
      ok: false,
      reason: "revoked",
      error: "This invite was revoked. Ask the workspace admin for a new link.",
    })
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({
      ok: false,
      reason: "expired",
      error: "This invite expired. Ask the workspace admin to resend it.",
    })
  }

  const sessionEmail = (session.user.email ?? "").toLowerCase()
  const emailMismatch = sessionEmail && sessionEmail !== invite.emailLower

  return NextResponse.json({
    ok: true,
    workspace: invite.workspace,
    role: invite.role,
    invitedEmail: invite.emailLower,
    sessionEmail,
    emailMismatch,
    expiresAt: invite.expiresAt.toISOString(),
  })
}
