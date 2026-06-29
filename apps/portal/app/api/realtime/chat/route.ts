import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { chatMessageSelect } from "@/lib/chat-attachments"
import { serializeChatMessage } from "@/lib/chat-message"
import { prisma } from "@/lib/prisma"
import { abortableSleep } from "@/lib/sse-poll"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id as string
  const { searchParams } = new URL(req.url)
  const workspaceId = searchParams.get("workspaceId")
  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 })

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { id: true },
  })
  const staff = await prisma.staffProfile.findUnique({
    where: { userId },
    select: { active: true },
  })
  if (!member && !staff?.active) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const encoder = new TextEncoder()
  let lastCreatedAt = new Date(0)

  const signal = req.signal

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode("retry: 2000\n\n"))

      const initial = await prisma.workspaceChatMessage.findMany({
        where: { workspaceId, channel: "CHAT" },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: chatMessageSelect,
      })
      for (const m of [...initial].reverse()) {
        lastCreatedAt = m.createdAt > lastCreatedAt ? m.createdAt : lastCreatedAt
        controller.enqueue(
          encoder.encode(`event: message\ndata: ${JSON.stringify(serializeChatMessage(m))}\n\n`)
        )
      }

      while (!signal.aborted) {
        try {
          await abortableSleep(2000, signal)
        } catch {
          break
        }
        const next = await prisma.workspaceChatMessage.findMany({
          where: { workspaceId, channel: "CHAT", createdAt: { gt: lastCreatedAt } },
          orderBy: { createdAt: "asc" },
          take: 50,
          select: chatMessageSelect,
        })
        for (const m of next) {
          lastCreatedAt = m.createdAt > lastCreatedAt ? m.createdAt : lastCreatedAt
          controller.enqueue(
            encoder.encode(`event: message\ndata: ${JSON.stringify(serializeChatMessage(m))}\n\n`)
          )
        }
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
