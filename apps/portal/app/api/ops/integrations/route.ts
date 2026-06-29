import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireStaff } from "@/lib/ops"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  workspaceId: z.string().min(1),
  type: z.enum(["GITHUB_REPO", "DISCORD_CHANNEL"]),
  externalId: z.string().min(1).max(500),
  jobId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  await requireStaff()
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const conn = await prisma.integrationConnection.upsert({
    where: { type_externalId: { type: parsed.data.type, externalId: parsed.data.externalId } },
    update: { workspaceId: parsed.data.workspaceId, jobId: parsed.data.jobId || null },
    create: {
      workspaceId: parsed.data.workspaceId,
      type: parsed.data.type,
      externalId: parsed.data.externalId,
      jobId: parsed.data.jobId || null,
    },
  })

  return NextResponse.json({ integration: conn }, { status: 201 })
}

