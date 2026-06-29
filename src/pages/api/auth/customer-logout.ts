import type { APIRoute } from "astro";
import { destroyCustomerSession } from "../../../lib/customer-auth/session";

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
	await destroyCustomerSession(cookies);
	return new Response(null, {
		status: 302,
		headers: { Location: "/" },
	});
};
