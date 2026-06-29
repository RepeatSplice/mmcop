import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
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
  const jobId = searchParams.get("jobId")
  const taskId = searchParams.get("taskId")
  const ticketId = searchParams.get("ticketId")

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

      // Initial burst
      const activitySelect = {
        id: true,
        createdAt: true,
        body: true,
        type: true,
        source: true,
        workspaceId: true,
        ticketId: true,
        ticket: { select: { key: true, title: true } },
        actor: { select: { name: true, email: true } },
      } as const

      const initial = await prisma.activityEvent.findMany({
        where: {
          workspaceId,
          ...(jobId ? { jobId } : {}),
          ...(taskId ? { taskId } : {}),
          ...(ticketId ? { ticketId } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 25,
        select: activitySelect,
      })
      const ordered = [...initial].reverse()
      for (const ev of ordered) {
        lastCreatedAt = ev.createdAt > lastCreatedAt ? ev.createdAt : lastCreatedAt
        controller.enqueue(
          encoder.encode(`event: activity\ndata: ${JSON.stringify(ev)}\n\n`)
        )
      }

      while (!signal.aborted) {
        try {
          await abortableSleep(2000, signal)
        } catch {
          break
        }

        const next = await prisma.activityEvent.findMany({
          where: {
            workspaceId,
            createdAt: { gt: lastCreatedAt },
            ...(jobId ? { jobId } : {}),
            ...(taskId ? { taskId } : {}),
            ...(ticketId ? { ticketId } : {}),
          },
          orderBy: { createdAt: "asc" },
          take: 50,
          select: activitySelect,
        })

        for (const ev of next) {
          lastCreatedAt = ev.createdAt > lastCreatedAt ? ev.createdAt : lastCreatedAt
          controller.enqueue(
            encoder.encode(`event: activity\ndata: ${JSON.stringify(ev)}\n\n`)
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

