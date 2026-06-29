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

  const member = await prisma.workspaceMember.findFirst({
    where: { userId, workspace: { slug } },
    select: { workspace: { select: { id: true, slug: true, name: true } } },
  })
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(member.workspace)
}
