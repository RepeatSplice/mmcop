import type { APIRoute } from "astro";
import { getDiscordRedirectUrl } from "../../../../lib/customer-auth/discord";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
	const state = crypto.randomUUID();
	cookies.set("discord_oauth_state", state, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: 300,
	});
	const redirectUrl = getDiscordRedirectUrl(state);
	return new Response(null, {
		status: 302,
		headers: { Location: redirectUrl },
	});
};
