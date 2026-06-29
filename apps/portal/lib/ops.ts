import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type StaffContext = {
  userId: string
  role: "STAFF" | "OPS_ADMIN" | "FINANCE"
}

function parseCsv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export async function requireStaff(): Promise<StaffContext> {
  const session = await auth()
  if (!session?.user) redirect("/login?callbackUrl=/ops")

  const userId = (session.user as any).id as string
  const email = (session.user as any).email?.toLowerCase?.() ?? ""

  const bootstrapEmails = parseCsv(process.env.OPS_BOOTSTRAP_EMAILS)
  const allowDevBootstrap =
    process.env.NODE_ENV !== "production" && bootstrapEmails.length === 0
  const allowBootstrap = allowDevBootstrap || (email && bootstrapEmails.includes(email))

  const staff = await prisma.staffProfile.findUnique({
    where: { userId },
    select: { role: true, active: true },
  })

  if (!staff && allowBootstrap) {
    // Idempotent bootstrap in case multiple requests race
    const createdOrExisting = await prisma.staffProfile.upsert({
      where: { userId },
      update: { active: true, role: "OPS_ADMIN" },
      create: { userId, role: "OPS_ADMIN", active: true },
      select: { role: true, active: true },
    })
    return { userId, role: createdOrExisting.role }
  }

  if (!staff?.active) redirect("/")

  return { userId, role: staff.role }
}

