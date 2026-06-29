import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hashInviteToken, normalizeEmail } from "@/lib/invites"
import { trySyncDiscordMember } from "@/lib/discord-provision"
import { logWorkspaceEvent } from "@/lib/discord-events"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({ token: z.string().min(10) })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id as string
  const emailLower = normalizeEmail((session.user as any).email ?? "")
  if (!emailLower) return NextResponse.json({ error: "Email required" }, { status: 400 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const tokenHash = hashInviteToken(parsed.data.token)
  const invite = await prisma.workspaceInvite.findUnique({
    where: { tokenHash },
    include: { workspace: { select: { id: true, slug: true, active: true, name: true } } },
  })

  if (!invite || !invite.workspace.active) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 404 })
  }
  if (invite.revokedAt) return NextResponse.json({ error: "Invite revoked" }, { status: 410 })
  if (invite.acceptedAt) return NextResponse.json({ error: "Invite already used" }, { status: 409 })
  if (invite.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: "Invite expired" }, { status: 410 })

  if (invite.emailLower !== emailLower) {
    return NextResponse.json({ error: "This invite was issued to a different email" }, { status: 403 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId } },
      update: { role: invite.role },
      create: { workspaceId: invite.workspaceId, userId, role: invite.role },
    })
    await tx.workspaceInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    })
    await tx.activityEvent.create({
      data: {
        workspaceId: invite.workspaceId,
        source: "SYSTEM",
        type: "workspace.invite_accepted",
        body: `${emailLower} joined ${invite.workspace.name}`,
        actorUserId: userId,
      },
    })
  })

  void trySyncDiscordMember(invite.workspaceId, userId, "add")
  logWorkspaceEvent(invite.workspaceId, `${emailLower} joined the workspace.`)

  return NextResponse.json({
    ok: true,
    workspaceSlug: invite.workspace.slug,
  })
}

