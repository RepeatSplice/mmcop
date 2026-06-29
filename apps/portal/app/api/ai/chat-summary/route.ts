import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { summarizeChatThread } from "@/lib/ai-assist"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({ workspaceId: z.string().min(1) })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id!
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: parsed.data.workspaceId, userId } },
  })
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const messages = await prisma.workspaceChatMessage.findMany({
    where: { workspaceId: parsed.data.workspaceId },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { body: true, authorDisplayName: true },
  })

  const summary = await summarizeChatThread(
    messages.reverse().map((m) => `${m.authorDisplayName}: ${m.body}`)
  )

  if (!summary) return NextResponse.json({ error: "AI not configured" }, { status: 503 })

  return NextResponse.json({ summary })
}
