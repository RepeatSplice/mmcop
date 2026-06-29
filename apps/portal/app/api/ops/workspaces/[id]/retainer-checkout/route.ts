import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireStaff } from "@/lib/ops"
import { prisma } from "@/lib/prisma"
import { getSiteUrl, getStripe, requireStripeSecret } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({ tier: z.enum(["FOUNDATION", "PARTNER", "STUDIO"]) })

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await requireStaff()
  const { id } = await ctx.params

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const priceId =
    parsed.data.tier === "FOUNDATION"
      ? process.env.STRIPE_RETAINER_PRICE_FOUNDATION
      : parsed.data.tier === "PARTNER"
        ? process.env.STRIPE_RETAINER_PRICE_PARTNER
        : process.env.STRIPE_RETAINER_PRICE_STUDIO

  if (!priceId) return NextResponse.json({ error: "Price not configured" }, { status: 501 })

  try {
    requireStripeSecret()
    const stripe = getStripe()
    const ws = await prisma.workspace.findUnique({
      where: { id },
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

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${getSiteUrl()}/ops/workspaces/${ws.id}?sub=1`,
      cancel_url: `${getSiteUrl()}/ops/workspaces/${ws.id}?cancel=1`,
      metadata: { workspaceId: ws.id, tier: parsed.data.tier },
    })

    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 501 })
  }
}

