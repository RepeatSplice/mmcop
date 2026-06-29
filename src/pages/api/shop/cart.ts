import type { APIRoute } from "astro";
import { prisma } from "../../../lib/prisma";
import { getCustomerFromSession } from "../../../lib/customer-auth/session";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
	const customer = await getCustomerFromSession(cookies);
	if (!customer) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const items = await prisma.cartItem.findMany({
		where: { sessionId: customer.id },
		include: {
			variant: {
				include: { product: true },
			},
		},
	});

	return new Response(
		JSON.stringify(
			items.map((item) => ({
				id: item.id,
				qty: item.qty,
				variantId: item.variantId,
				variantName: item.variant.name,
				productTitle: item.variant.product.title,
				productSlug: item.variant.product.slug,
				priceUsd: item.variant.priceUsd,
			})),
		),
		{ status: 200, headers: { "Content-Type": "application/json" } },
	);
};

export const POST: APIRoute = async ({ request, cookies }) => {
	const customer = await getCustomerFromSession(cookies);
	if (!customer) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const body = (await request.json()) as { variantId?: string };
	const { variantId } = body;
	if (!variantId) {
		return new Response(JSON.stringify({ error: "variantId required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const existing = await prisma.cartItem.findFirst({
		where: { sessionId: customer.id, variantId },
	});

	if (existing) {
		await prisma.cartItem.update({
			where: { id: existing.id },
			data: { qty: existing.qty + 1 },
		});
	} else {
		await prisma.cartItem.create({
			data: { sessionId: customer.id, variantId, qty: 1 },
		});
	}

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
	const customer = await getCustomerFromSession(cookies);
	if (!customer) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const body = (await request.json()) as { variantId?: string };
	const { variantId } = body;
	if (!variantId) {
		return new Response(JSON.stringify({ error: "variantId required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	await prisma.cartItem.deleteMany({
		where: { sessionId: customer.id, variantId },
	});

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
