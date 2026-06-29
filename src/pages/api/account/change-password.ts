import type { APIRoute } from "astro";
import { getCustomerFromSession } from "../../../lib/customer-auth/session";
import { hashPassword, verifyPassword } from "../../../lib/auth/password";
import { prisma } from "../../../lib/prisma";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
	const customer = await getCustomerFromSession(cookies);
	if (!customer) {
		return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
	}

	let body: { current?: string; password?: string; confirm?: string };
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
	}

	const { current, password, confirm } = body;

	if (customer.passwordHash) {
		if (!current) {
			return new Response(JSON.stringify({ error: "Current password is required." }), { status: 400 });
		}
		const valid = await verifyPassword(current, customer.passwordHash);
		if (!valid) {
			return new Response(JSON.stringify({ error: "Current password is incorrect." }), { status: 400 });
		}
	}

	if (!password || password.length < 10) {
		return new Response(JSON.stringify({ error: "Password must be at least 10 characters." }), { status: 400 });
	}
	if (password !== confirm) {
		return new Response(JSON.stringify({ error: "Passwords do not match." }), { status: 400 });
	}

	const passwordHash = await hashPassword(password);
	await prisma.customer.update({ where: { id: customer.id }, data: { passwordHash } });

	return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
