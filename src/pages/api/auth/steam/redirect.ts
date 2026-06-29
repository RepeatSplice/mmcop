import type { APIRoute } from "astro";
import { getSteamRedirectUrl } from "../../../../lib/customer-auth/steam";
import { getSiteUrl } from "../../../../lib/env";

export const prerender = false;

export const GET: APIRoute = async () => {
	const returnUrl = `${getSiteUrl()}/api/auth/steam/callback`;
	const redirectUrl = getSteamRedirectUrl(returnUrl);
	return new Response(null, {
		status: 302,
		headers: { Location: redirectUrl },
	});
};
