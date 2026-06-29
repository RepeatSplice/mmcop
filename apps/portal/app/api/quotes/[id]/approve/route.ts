import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSiteUrl, getStripe, requireStripeSecret } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id as string
  const { id } = await ctx.params

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { job: { select: { id: true, workspaceId: true, status: true, key: true } } },
  })
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: quote.job.workspaceId, userId } },
    select: { role: true },
  })
  if (!member || member.role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (quote.approvedAt) return NextResponse.json({ ok: true, checkoutUrl: quote.stripeCheckoutUrl ?? null })

  let checkoutUrl: string | null = null

  // Stripe: create checkout session if configured.
  try {
    requireStripeSecret()
    const stripe = getStripe()

    const workspace = await prisma.workspace.findUnique({
      where: { id: quote.job.workspaceId },
      select: { id: true, slug: true, name: true, stripeCustomerId: true },
    })
    if (!workspace) throw new Error("Workspace not found")

    const customerId: string =
      workspace.stripeCustomerId ??
      (await stripe.customers
        .create({ name: workspace.name, metadata: { workspaceId: workspace.id } })
        .then((c) => c.id))

    if (!workspace.stripeCustomerId) {
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: { stripeCustomerId: customerId },
      })
    }

    const siteUrl = getSiteUrl()
    const successUrl = `${siteUrl}/workspace/${workspace.slug}/tickets/${quote.job.key}?paid=1`
    const cancelUrl = `${siteUrl}/workspace/${workspace.slug}/tickets/${quote.job.key}?cancelled=1`

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: quote.currency,
            unit_amount: quote.amountCents,
            product_data: {
              name: `${workspace.name} — ${quote.job.key} quote`,
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        quoteId: quote.id,
        jobId: quote.job.id,
        workspaceId: quote.job.workspaceId,
      },
    })

    checkoutUrl = session.url ?? null

    await prisma.quote.update({
      where: { id: quote.id },
      data: { stripeCheckoutSessionId: session.id, stripeCheckoutUrl: checkoutUrl },
    })
  } catch {
    // no-op in dev until Stripe configured
  }

  await prisma.$transaction(async (tx) => {
    await tx.quote.update({ where: { id: quote.id }, data: { approvedAt: new Date() } })
    await tx.job.update({ where: { id: quote.job.id }, data: { status: "AWAITING_PAYMENT" } })
    await tx.activityEvent.create({
      data: {
        workspaceId: quote.job.workspaceId,
        jobId: quote.job.id,
        source: "PORTAL",
        type: "quote.approved",
        body: `Quote approved.`,
        actorUserId: userId,
      },
    })
  })

  return NextResponse.json({ ok: true, checkoutUrl })
}

