import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ count: 0 })

  const userId = (session.user as any).id as string
  const count = await prisma.notification.count({
    where: { userId, readAt: null },
  })

  return NextResponse.json({ count })
}

