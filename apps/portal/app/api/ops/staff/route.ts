import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireStaff } from "@/lib/ops"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  await requireStaff()

  const profiles = await prisma.staffProfile.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          discordUserId: true,
        },
      },
    },
  })

  const staff = profiles.map((p) => ({
    userId: p.userId,
    name: p.user.name,
    email: p.user.email,
    image: p.user.image,
    discordUserId: p.user.discordUserId,
    role: p.role,
    active: p.active,
    createdAt: p.createdAt.toISOString(),
  }))

  return NextResponse.json({ staff })
}

const addSchema = z.object({
  email: z.string().email(),
  role: z.enum(["STAFF", "OPS_ADMIN", "FINANCE"]),
})

export async function POST(req: NextRequest) {
  const caller = await requireStaff()
  if (caller.role !== "OPS_ADMIN") {
    return NextResponse.json({ error: "OPS_ADMIN required" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = addSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: parsed.data.email, mode: "insensitive" } },
    select: { id: true, name: true, email: true },
  })
  if (!user) {
    return NextResponse.json(
      { error: "No portal account found for that email. The person must sign into the portal first." },
      { status: 404 }
    )
  }

  const existing = await prisma.staffProfile.findUnique({
    where: { userId: user.id },
  })
  if (existing) {
    return NextResponse.json(
      { error: "This user already has a staff profile. Use the table to change their role or status." },
      { status: 409 }
    )
  }

  const profile = await prisma.staffProfile.create({
    data: { userId: user.id, role: parsed.data.role, active: true },
  })

  return NextResponse.json(
    {
      staff: {
        userId: profile.userId,
        name: user.name,
        email: user.email,
        role: profile.role,
        active: profile.active,
        createdAt: profile.createdAt.toISOString(),
      },
    },
    { status: 201 }
  )
}
