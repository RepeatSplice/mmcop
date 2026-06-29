import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/ops"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await requireStaff()
  const { id } = await ctx.params

  const app = await prisma.application.findUnique({
    where: { id },
    select: { id: true, status: true },
  })
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (app.status !== "SUBMITTED") return NextResponse.json({ error: "Already processed" }, { status: 409 })

  await prisma.application.update({
    where: { id },
    data: { status: "REJECTED", reviewedAt: new Date() },
  })

  return NextResponse.redirect(new URL("/ops/applications", req.url))
}

