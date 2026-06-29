import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const patchSchema = z.object({
  notifyChatMode: z.enum(["MENTIONS", "ALL"]).optional(),
  notifyTicketMode: z.enum(["WATCHED", "ALL_IN_WORKSPACE"]).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as any).id as string
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notifyChatMode: true, notifyTicketMode: true },
  })
  return NextResponse.json({
    notifyChatMode: user?.notifyChatMode ?? "MENTIONS",
    notifyTicketMode: user?.notifyTicketMode ?? "WATCHED",
  })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as any).id as string
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const data: Record<string, string> = {}
  if (parsed.data.notifyChatMode) data.notifyChatMode = parsed.data.notifyChatMode
  if (parsed.data.notifyTicketMode) data.notifyTicketMode = parsed.data.notifyTicketMode
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true })
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { notifyChatMode: true, notifyTicketMode: true },
  })
  return NextResponse.json({
    notifyChatMode: updated.notifyChatMode,
    notifyTicketMode: updated.notifyTicketMode,
  })
}
