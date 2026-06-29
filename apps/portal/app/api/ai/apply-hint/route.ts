import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireStaff } from "@/lib/ops"
import { prisma } from "@/lib/prisma"
import { generateApplyTriageHint } from "@/lib/ai-assist"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({ applicationId: z.string().min(1) })

export async function POST(req: NextRequest) {
  await requireStaff()
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const app = await prisma.application.findUnique({
    where: { id: parsed.data.applicationId },
    select: { serverName: true, desired: true, description: true },
  })
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const hint = await generateApplyTriageHint({
    serverName: app.serverName,
    desired: app.desired,
    description: app.description,
  })

  if (!hint) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 })
  }

  return NextResponse.json({ hint })
}
