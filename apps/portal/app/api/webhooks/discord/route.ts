import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const token = process.env.DISCORD_INGEST_TOKEN
  if (!token) return NextResponse.json({ error: "Not configured" }, { status: 501 })

  const auth = req.headers.get("authorization") || ""
  const ok = auth.toLowerCase().startsWith("bearer ") && auth.slice(7).trim() === token
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payload = (await req.json().catch(() => null)) as any
  const channelId: string | null = payload?.channelId ?? payload?.channel_id ?? null
  const content: string | null = payload?.content ?? payload?.message ?? null
  const author: string | null = payload?.author ?? payload?.username ?? null

  if (!channelId || !content) return NextResponse.json({ error: "channelId + content required" }, { status: 400 })

  const conn = await prisma.integrationConnection.findUnique({
    where: { type_externalId: { type: "DISCORD_CHANNEL", externalId: channelId } },
  })
  if (!conn) return NextResponse.json({ ok: true, ignored: true })

  await prisma.activityEvent.create({
    data: {
      workspaceId: conn.workspaceId,
      jobId: conn.jobId,
      source: "DISCORD",
      type: "discord.message",
      body: `${author ? `${author}: ` : ""}${content}`,
    },
  })

  return NextResponse.json({ ok: true })
}

