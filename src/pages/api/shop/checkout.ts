import type { APIRoute } from "astro";
import Stripe from "stripe";
import { prisma } from "../../../lib/prisma";
import { getCustomerFromSession } from "../../../lib/customer-auth/session";
import { getStripeSecretKey, getSiteUrl } from "../../../lib/env";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
	const customer = await getCustomerFromSession(cookies);
	if (!customer) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const body = (await request.json()) as {
		tosAccepted?: boolean;
		affiliateCode?: string;
	};

	if (!body.tosAccepted) {
		return new Response(
			JSON.stringify({ error: "You must accept the Terms of Service to checkout" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const cartItems = await prisma.cartItem.findMany({
		where: { sessionId: customer.id },
		include: { variant: { include: { product: true } } },
	});

	if (cartItems.length === 0) {
		return new Response(JSON.stringify({ error: "Cart is empty" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	// Resolve affiliate code
	let affiliateCodeId: string | null = null;
	if (body.affiliateCode) {
		const affiliate = await prisma.affiliateCode.findUnique({
			where: { code: body.affiliateCode, active: true },
		});
		if (affiliate) affiliateCodeId = affiliate.id;
	}

	const totalMinorUnits = cartItems.reduce((sum, item) => sum + item.variant.priceUsd * item.qty, 0);
	const stripe = new Stripe(getStripeSecretKey());
	const siteUrl = getSiteUrl();

	// Create a placeholder order
	const order = await prisma.order.create({
		data: {
			customerId: customer.id,
			stripeSessionId: `pending_${crypto.randomUUID()}`,
			totalMinorUnits,
			tosAcceptedAt: new Date(),
			status: "PENDING",
			affiliateCodeId,
			items: {
				create: cartItems.map((item) => ({
					variantId: item.variantId,
					priceMinorUnits: item.variant.priceUsd * item.qty,
				})),
			},
		},
	});

	// Build line items for Stripe
	const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cartItems.map((item) => ({
		price_data: {
			currency: "usd",
			unit_amount: item.variant.priceUsd,
			product_data: {
				name: `${item.variant.product.title} - ${item.variant.name}`,
			},
		},
		quantity: item.qty,
	}));

	const session = await stripe.checkout.sessions.create({
		mode: "payment",
		line_items: lineItems,
		automatic_tax: { enabled: true },
		metadata: { orderId: order.id },
		success_url: `${siteUrl}/account/orders/${order.id}?paid=1`,
		cancel_url: `${siteUrl}/shop`,
		customer_email: customer.email ?? undefined,
	});

	// Update the order with the real Stripe session ID
	await prisma.order.update({
		where: { id: order.id },
		data: { stripeSessionId: session.id },
	});

	return new Response(JSON.stringify({ url: session.url }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
