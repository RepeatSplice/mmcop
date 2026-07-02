import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id!
  const { slug } = await ctx.params

  const [member, staff] = await Promise.all([
    prisma.workspaceMember.findFirst({
      where: { userId, workspace: { slug } },
      select: { workspace: { select: { id: true, slug: true, name: true } } },
    }),
    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),
  ])

  if (member) return NextResponse.json(member.workspace)

  if (staff?.active) {
    const workspace = await prisma.workspace.findFirst({
      where: { slug },
      select: { id: true, slug: true, name: true },
    })
    if (workspace) return NextResponse.json(workspace)
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}
