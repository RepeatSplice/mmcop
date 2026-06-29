import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Marks notification rows read by *target*, not by id. Use cases:
 *
 *  - Opening a ticket: { ticketKey, workspaceId } -> mark rows whose
 *    url ends with `/tickets/{ticketKey}`.
 *  - Opening chat: { kind: "chat", workspaceId } -> mark every chat.* row
 *    in that workspace.
 */
const bodySchema = z.union([
  z.object({
    kind: z.literal("ticket"),
    workspaceId: z.string().min(1),
    ticketKey: z.string().min(1),
  }),
  z.object({
    kind: z.literal("chat"),
    workspaceId: z.string().min(1),
  }),
])

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as { id?: string }).id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  if (parsed.data.kind === "ticket") {
    await prisma.notification.updateMany({
      where: {
        userId,
        workspaceId: parsed.data.workspaceId,
        readAt: null,
        type: { in: ["ticket.assigned", "ticket.status", "ticket.comment", "ticket.mention"] },
        url: { endsWith: `/tickets/${parsed.data.ticketKey}` },
      },
      data: { readAt: new Date() },
    })
  } else {
    await prisma.notification.updateMany({
      where: {
        userId,
        workspaceId: parsed.data.workspaceId,
        readAt: null,
        type: { in: ["chat.message", "chat.mention"] },
      },
      data: { readAt: new Date() },
    })
  }

  return NextResponse.json({ ok: true })
}
