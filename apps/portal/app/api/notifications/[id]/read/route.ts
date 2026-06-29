import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params

  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  })

  const accept = req.headers.get("accept") ?? ""
  if (accept.includes("application/json") || req.headers.get("x-requested-with") === "fetch") {
    const unreadCount = await prisma.notification.count({
      where: { userId, readAt: null },
    })
    return NextResponse.json({ ok: true, unreadCount })
  }

  return NextResponse.redirect(new URL("/", req.url))
}
