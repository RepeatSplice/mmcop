import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSiteUrl, getStripe, requireStripeSecret } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id as string
  const body = (await req.json().catch(() => null)) as any
  const workspaceId = body?.workspaceId as string | undefined
  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 })

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  })
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    requireStripeSecret()
    const stripe = getStripe()

    const ws = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true, slug: true, stripeCustomerId: true },
    })
    if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const customerId: string =
      ws.stripeCustomerId ??
      (await stripe.customers
        .create({ name: ws.name, metadata: { workspaceId: ws.id } })
        .then((c) => c.id))

    if (!ws.stripeCustomerId) {
      await prisma.workspace.update({ where: { id: ws.id }, data: { stripeCustomerId: customerId } })
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getSiteUrl()}/workspace/${ws.slug}/settings/billing`,
    })

    return NextResponse.json({ url: portal.url })
  } catch {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 501 })
  }
}

