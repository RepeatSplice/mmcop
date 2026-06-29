import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireStaff } from "@/lib/ops"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  workspaceId: z.string().min(1),
  taskId: z.string().optional(),
  jobId: z.string().optional(),
  minutes: z.number().int().min(1).max(24 * 60),
  billable: z.boolean().default(true),
  note: z.string().max(8000).optional(),
})

export async function POST(req: NextRequest) {
  const staff = await requireStaff()
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const created = await prisma.timeEntry.create({
    data: {
      workspaceId: parsed.data.workspaceId,
      taskId: parsed.data.taskId || null,
      jobId: parsed.data.jobId || null,
      staffUserId: staff.userId,
      minutes: parsed.data.minutes,
      billable: parsed.data.billable,
      note: parsed.data.note || null,
    },
  })

  return NextResponse.json({ timeEntry: created }, { status: 201 })
}

