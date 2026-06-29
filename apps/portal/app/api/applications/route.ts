import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { defaultApplicationDescription, getApplicationProfile } from "@/lib/application-profile"
import { applicantHasActiveWorkspace } from "@/lib/provision-from-application"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  serverName: z.string().min(2).max(120),
  serverDiscord: z.string().min(4).max(200),
  desired: z.enum(["RETAINER", "PAYG", "UNSURE"]),
  notes: z.string().max(2000).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id!
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const profile = await getApplicationProfile(userId)
  if (!profile.email) {
    return NextResponse.json({ error: "Account email is required to apply." }, { status: 400 })
  }

  const serverName = parsed.data.serverName.trim()
  const description = defaultApplicationDescription(parsed.data.notes)
  const discord = parsed.data.serverDiscord.trim()

  const existing = await prisma.application.findFirst({
    where: { userId, status: { in: ["SUBMITTED", "APPROVED"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true },
  })

  const reopenForReview =
    existing?.status === "APPROVED" && !(await applicantHasActiveWorkspace(userId))

  const app = existing
    ? await prisma.application.update({
        where: { id: existing.id },
        data: {
          serverName,
          discord,
          desired: parsed.data.desired,
          description,
          ...(reopenForReview
            ? { status: "SUBMITTED", reviewedAt: null }
            : {}),
        },
      })
    : await prisma.application.create({
        data: {
          userId,
          serverName,
          discord,
          desired: parsed.data.desired,
          description,
        },
      })

  return NextResponse.json(
    { application: app, reopenedForReview: reopenForReview },
    { status: existing ? 200 : 201 }
  )
}
