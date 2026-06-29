import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/ops"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const createSchema = z.object({
  name: z.string().min(2).max(120),
  // Accept both ISO strings and datetime-local form values.
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  hoursMax: z.coerce.number().int().min(0).max(10000),
})

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await requireStaff()
  const { id } = await ctx.params

  const sprints = await prisma.sprint.findMany({
    where: { workspaceId: id },
    orderBy: [{ startDate: "desc" }],
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      hoursMax: true,
      hoursUsed: true,
    },
    take: 100,
  })

  return NextResponse.json({
    sprints: sprints.map((s) => ({
      ...s,
      startDate: s.startDate.toISOString(),
      endDate: s.endDate.toISOString(),
    })),
  })
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await requireStaff()
  const { id } = await ctx.params

  let raw: any = null
  const ct = req.headers.get("content-type") || ""
  if (ct.includes("application/json")) {
    raw = await req.json().catch(() => null)
  } else {
    const fd = await req.formData()
    raw = Object.fromEntries(fd.entries())
  }

  const parsed = createSchema.safeParse({
    name: raw?.name,
    startDate: raw?.startDate,
    endDate: raw?.endDate,
    hoursMax: raw?.hoursMax,
  })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const start = new Date(parsed.data.startDate)
  const end = new Date(parsed.data.endDate)
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    return NextResponse.json({ error: "Invalid startDate/endDate" }, { status: 400 })
  }
  if (end.getTime() < start.getTime()) {
    return NextResponse.json({ error: "endDate must be >= startDate" }, { status: 400 })
  }

  await prisma.sprint.create({
    data: {
      workspaceId: id,
      name: parsed.data.name,
      startDate: start,
      endDate: end,
      hoursMax: parsed.data.hoursMax,
      status: "PLANNING",
    },
  })

  const redirectTo = new URL(`/ops/workspaces/${id}`, req.url)
  return NextResponse.redirect(redirectTo)
}

