import type { APIRoute } from "astro";
import { prisma } from "../../../lib/prisma";
import { customerCanReview, hasCustomerReviewed } from "../../../lib/reviews";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	const customer = locals.customer;
	if (!customer) {
		return new Response(JSON.stringify({ error: "Authentication required" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: "Invalid JSON" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const { productId, rating, title, body: reviewBody } = body as Record<string, unknown>;

	if (typeof productId !== "string" || !productId) {
		return new Response(JSON.stringify({ error: "productId is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
	}

	const ratingNum = Number(rating);
	if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
		return new Response(JSON.stringify({ error: "rating must be an integer between 1 and 5" }), { status: 400, headers: { "Content-Type": "application/json" } });
	}

	if (typeof reviewBody !== "string" || reviewBody.trim().length < 10) {
		return new Response(JSON.stringify({ error: "Review body must be at least 10 characters" }), { status: 400, headers: { "Content-Type": "application/json" } });
	}

	const canReview = await customerCanReview(customer.id, productId);
	if (!canReview) {
		return new Response(JSON.stringify({ error: "You must have purchased this product to leave a review" }), { status: 403, headers: { "Content-Type": "application/json" } });
	}

	const alreadyReviewed = await hasCustomerReviewed(customer.id, productId);
	if (alreadyReviewed) {
		return new Response(JSON.stringify({ error: "You have already submitted a review for this product" }), { status: 409, headers: { "Content-Type": "application/json" } });
	}

	await prisma.productReview.create({
		data: {
			productId,
			customerId: customer.id,
			rating: ratingNum,
			title: typeof title === "string" && title.trim() ? title.trim() : null,
			body: reviewBody.trim(),
			status: "PENDING",
		},
	});

	return new Response(JSON.stringify({ ok: true }), {
		status: 201,
		headers: { "Content-Type": "application/json" },
	});
};
