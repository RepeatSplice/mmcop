import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/prisma"
import { requireStripeSecret } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.OPS_STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) return NextResponse.json({ error: "Not configured" }, { status: 501 })

  const sig = req.headers.get("stripe-signature")
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 })

  const body = await req.text()
  const stripe = new Stripe(requireStripeSecret(), { apiVersion: "2025-02-24.acacia" as any })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const quoteId = (session.metadata?.quoteId as string | undefined) ?? undefined
    const sessionId = session.id
    const workspaceId = (session.metadata?.workspaceId as string | undefined) ?? undefined
    const tier =
      (session.metadata?.tier as string | undefined) ??
      (session.metadata?.plan as string | undefined) ??
      undefined

    if (quoteId) {
      const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { job: { select: { id: true, workspaceId: true, key: true } } },
      })
      if (quote) {
        await prisma.$transaction(async (tx) => {
          await tx.quote.update({
            where: { id: quote.id },
            data: { stripeCheckoutSessionId: sessionId },
          })
          await tx.job.update({ where: { id: quote.job.id }, data: { status: "ACTIVE" } })
          await tx.activityEvent.create({
            data: {
              workspaceId: quote.job.workspaceId,
              jobId: quote.job.id,
              source: "SYSTEM",
              type: "stripe.checkout.completed",
              body: `${quote.job.key}: payment received`,
            },
          })
        })
      }
    }

    if (workspaceId && session.mode === "subscription") {
      const subId = typeof session.subscription === "string" ? session.subscription : null
      let renewalAt: Date | null = null
      if (subId) {
        try {
          const sub = (await stripe.subscriptions.retrieve(subId)) as unknown as {
            current_period_end?: number | null
          }
          if (sub.current_period_end) {
            renewalAt = new Date(sub.current_period_end * 1000)
          }
        } catch (e) {
          console.warn("[stripe] failed to fetch subscription for renewal", e)
        }
      }
      await prisma.workspace.updateMany({
        where: { id: workspaceId },
        data: {
          stripeSubscriptionId: subId,
          stripeSubscriptionStatus: session.status ?? null,
          stripeTier: tier ?? undefined,
          stripeRenewalAt: renewalAt ?? undefined,
        },
      })
      await prisma.activityEvent.create({
        data: {
          workspaceId,
          source: "SYSTEM",
          type: "stripe.subscription.started",
          body: `Retainer subscription started.`,
        },
      })
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const sub = event.data.object as Stripe.Subscription & {
      current_period_end?: number | null
    }
    const tier =
      (sub.metadata?.tier as string | undefined) ??
      (sub.metadata?.plan as string | undefined) ??
      undefined
    const renewalAt = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null
    const ws = await prisma.workspace.findFirst({
      where: { stripeSubscriptionId: sub.id },
      select: { id: true },
    })
    if (ws) {
      await prisma.workspace.update({
        where: { id: ws.id },
        data: {
          stripeSubscriptionStatus: sub.status,
          stripeTier: tier ?? undefined,
          stripeRenewalAt: renewalAt ?? undefined,
        },
      })
    }
  }

  return NextResponse.json({ received: true })
}

