import type { APIRoute } from "astro";
import { rateLimit } from "../../lib/auth/rate-limit";
import { json } from "../../lib/http";
import { searchSite } from "../../lib/site-search";

export const prerender = false;

export const GET: APIRoute = async ({ url, clientAddress }) => {
	const ip = clientAddress ?? "unknown";
	if (!rateLimit(`search:${ip}`, 40, 60_000)) {
		return json({ error: "Too many searches. Try again shortly." }, 429);
	}

	const q = url.searchParams.get("q") ?? "";
	const results = await searchSite(q);
	return json({ results, query: q.trim() });
};
