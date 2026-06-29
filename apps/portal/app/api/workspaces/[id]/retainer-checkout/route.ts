import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSiteUrl, getStripe, requireStripeSecret } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({ tier: z.enum(["FOUNDATION", "PARTNER", "STUDIO"]) })

/**
 * Client-callable retainer checkout. Open to the workspace OWNER (or active
 * staff) so customers can self-serve the first retainer subscription. The
 * legacy ops-only route at /api/ops/workspaces/[id]/retainer-checkout
 * delegates to the same checkout shape but stays staff-only.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as { id?: string }).id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: workspaceId } = await ctx.params

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const [member, staff] = await Promise.all([
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    }),
    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),
  ])
  const isOwner = member?.role === "OWNER"
  const isStaff = Boolean(staff?.active)
  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

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
      await prisma.workspace.update({
        where: { id: ws.id },
        data: { stripeCustomerId: customerId },
      })
    }

    const successPath = isStaff && !isOwner ? `/ops/workspaces/${ws.id}?sub=1` : `/workspace/${ws.slug}/settings/billing?sub=1`
    const cancelPath = isStaff && !isOwner ? `/ops/workspaces/${ws.id}?cancel=1` : `/workspace/${ws.slug}/settings/billing?cancel=1`

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${getSiteUrl()}${successPath}`,
      cancel_url: `${getSiteUrl()}${cancelPath}`,
      metadata: { workspaceId: ws.id, tier: parsed.data.tier },
      subscription_data: { metadata: { workspaceId: ws.id, tier: parsed.data.tier } },
    })

    return NextResponse.json({ url: checkout.url })
  } catch {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 501 })
  }
}
