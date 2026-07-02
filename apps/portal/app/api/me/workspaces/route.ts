import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Lightweight workspace list for the header switcher. Returns workspaces the
 * user is a member of (active workspaces only), plus role. For active staff,
 * returns all active workspaces with a synthetic ADMIN role.
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

  const isStaff = Boolean(staff?.active)

  if (isStaff) {
    const allWorkspaces = await prisma.workspace.findMany({
      where: { active: true },
      select: { id: true, slug: true, name: true },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({
      isStaff: true,
      workspaces: allWorkspaces.map((w) => ({
        id: w.id,
        slug: w.slug,
        name: w.name,
        role: "ADMIN" as const,
      })),
    })
  }

  return NextResponse.json({
    isStaff: false,
    workspaces: memberships.map((m) => ({
      id: m.workspace.id,
      slug: m.workspace.slug,
      name: m.workspace.name,
      role: m.role,
    })),
  })
}
