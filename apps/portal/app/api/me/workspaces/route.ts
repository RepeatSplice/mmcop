import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Lightweight workspace list for the header switcher. Returns workspaces the
 * user is a member of (active workspaces only), plus role.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id!

  const [memberships, staff] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { userId, workspace: { active: true } },
      select: {
        role: true,
        workspace: { select: { id: true, slug: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),
  ])

  return NextResponse.json({
    isStaff: Boolean(staff?.active),
    workspaces: memberships.map((m) => ({
      id: m.workspace.id,
      slug: m.workspace.slug,
      name: m.workspace.name,
      role: m.role,
    })),
  })
}
