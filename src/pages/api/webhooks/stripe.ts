import type { APIRoute } from "astro";
import Stripe from "stripe";
import { prisma } from "../../../lib/prisma";
import { getStripeSecretKey, getStripeWebhookSecret } from "../../../lib/env";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	const stripe = new Stripe(getStripeSecretKey());
	const webhookSecret = getStripeWebhookSecret();

	const body = await request.text();
	const sig = request.headers.get("stripe-signature");

	if (!sig) {
		return new Response("Missing stripe-signature header", { status: 400 });
	}

	let event: Stripe.Event;
	try {
		event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
	} catch (err) {
		const message = err instanceof Error ? err.message : "Webhook verification failed";
		console.error("[stripe-webhook] Verification failed:", message);
		return new Response(`Webhook Error: ${message}`, { status: 400 });
	}

	try {
		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object as Stripe.Checkout.Session;
				const orderId = session.metadata?.orderId;
				if (!orderId) break;

				const order = await prisma.order.update({
					where: { id: orderId },
					data: {
						status: "PAID",
						stripePaymentIntentId: session.payment_intent as string | null,
					},
					include: {
						items: { include: { variant: true } },
						customer: true,
					},
				});

				// Create a ServerLicense for each order item
				for (const item of order.items) {
					await prisma.serverLicense.create({
						data: {
							customerId: order.customerId,
							orderItemId: item.id,
							variantId: item.variantId,
							maxServers: item.variant.maxServers,
							status: "ACTIVE",
						},
					});
				}

				// Clear cart
				await prisma.cartItem.deleteMany({ where: { sessionId: order.customerId } });

				// Queue order confirmation email (fire-and-forget)
				try {
					const { sendOrderConfirm } = await import("../../../lib/email/shop");
					await sendOrderConfirm(order);
				} catch (emailErr) {
					console.error("[stripe-webhook] Email error:", emailErr);
				}

				// Send review-request email for each purchased product (fire-and-forget)
				if (order.customer.email) {
					for (const item of order.items) {
						try {
							const product = await prisma.product.findFirst({
								where: { variants: { some: { id: item.variantId } } },
								select: { slug: true, title: true },
							});
							if (product) {
								const { sendReviewRequest } = await import("../../../lib/email/shop");
								await sendReviewRequest(order.customer, product);
							}
						} catch {
							// Non-fatal
						}
					}
				}

				break;
			}

			case "charge.dispute.created": {
				const dispute = event.data.object as Stripe.Dispute;
				const paymentIntentId = dispute.payment_intent as string | null;
				if (paymentIntentId) {
					await prisma.order.updateMany({
						where: { stripePaymentIntentId: paymentIntentId },
						data: { status: "DISPUTED" },
					});
				}
				break;
			}

			case "charge.refunded": {
				const charge = event.data.object as Stripe.Charge;
				const paymentIntentId =
					typeof charge.payment_intent === "string" ? charge.payment_intent : null;
				if (paymentIntentId) {
					const order = await prisma.order.findFirst({
						where: { stripePaymentIntentId: paymentIntentId },
					});
					if (order) {
						await prisma.order.update({
							where: { id: order.id },
							data: { status: "REFUNDED" },
						});
						// Revoke all licenses immediately on refund
						await prisma.serverLicense.updateMany({
							where: {
								orderItem: { orderId: order.id },
							},
							data: { status: "REVOKED" },
						});
					}
				}
				break;
			}

			default:
				break;
		}
	} catch (err) {
		console.error("[stripe-webhook] Handler error:", err);
		return new Response("Internal error", { status: 500 });
	}

	return new Response(JSON.stringify({ received: true }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
