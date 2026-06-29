import type { APIRoute } from "astro";
import { prisma } from "../../../lib/prisma";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = (await request.json()) as { productId?: string; email?: string };
		const { productId, email } = body;

		if (!productId || !email) {
			return new Response(JSON.stringify({ error: "productId and email are required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const product = await prisma.product.findUnique({ where: { id: productId } });
		if (!product) {
			return new Response(JSON.stringify({ error: "Product not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		await prisma.waitlist.upsert({
			where: { productId_email: { productId, email } },
			create: { productId, email },
			update: {},
		});

		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch {
		return new Response(JSON.stringify({ error: "Server error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
