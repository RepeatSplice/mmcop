import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { applyServerHeartbeat } from "@/lib/server-monitor"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  workspaceId: z.string().min(1),
  secret: z.string().min(1),
  online: z.boolean().optional(),
  playerCount: z.number().int().min(0).optional(),
  maxPlayers: z.number().int().min(0).optional(),
  mapName: z.string().max(200).optional(),
  version: z.string().max(120).optional(),
  restart: z.boolean().optional(),
  error: z.string().max(2000).optional(),
})

export async function POST(req: NextRequest) {
  const expected = process.env.SERVER_HEARTBEAT_SECRET
  if (!expected) return NextResponse.json({ error: "Not configured" }, { status: 501 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  if (parsed.data.secret !== expected) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 })
  }

  const ws = await prisma.workspace.findUnique({
    where: { id: parsed.data.workspaceId },
    select: { id: true },
  })
  if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

  await applyServerHeartbeat(parsed.data.workspaceId, {
    online: parsed.data.online,
    playerCount: parsed.data.playerCount,
    maxPlayers: parsed.data.maxPlayers,
    mapName: parsed.data.mapName,
    version: parsed.data.version,
    restart: parsed.data.restart,
    error: parsed.data.error,
  })

  return NextResponse.json({ ok: true })
}
