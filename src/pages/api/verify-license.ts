import type { APIRoute } from "astro";
import { prisma } from "../../lib/prisma";

export const prerender = false;

// In-memory cache
const cache = new Map<string, { valid: boolean; data: object; expiresAt: number }>();

// Rate limiting - max 60 req/min per querying IP
const rateLimit = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const CACHE_TTL_MS = 60_000;

function getRateLimitEntry(ip: string): { count: number; windowStart: number } {
	const entry = rateLimit.get(ip);
	const now = Date.now();
	if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
		const fresh = { count: 0, windowStart: now };
		rateLimit.set(ip, fresh);
		return fresh;
	}
	return entry;
}

export const GET: APIRoute = async ({ url, request }) => {
	const queryingIp =
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		request.headers.get("cf-connecting-ip") ??
		"unknown";

	const rlEntry = getRateLimitEntry(queryingIp);
	rlEntry.count++;
	rateLimit.set(queryingIp, rlEntry);

	if (rlEntry.count > RATE_LIMIT) {
		return new Response(
			JSON.stringify({ valid: false, reason: "Rate limit exceeded" }),
			{ status: 200, headers: { "Content-Type": "application/json" } },
		);
	}

	const serverIp = url.searchParams.get("ip");
	const productSlug = url.searchParams.get("product");

	if (!serverIp || !productSlug) {
		return new Response(
			JSON.stringify({ valid: false, reason: "Missing ip or product parameter" }),
			{ status: 200, headers: { "Content-Type": "application/json" } },
		);
	}

	const cacheKey = `${serverIp}:${productSlug}`;
	const cached = cache.get(cacheKey);
	if (cached && cached.expiresAt > Date.now()) {
		return new Response(JSON.stringify(cached.data), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}

	const now = new Date();

	const registeredServer = await prisma.registeredServer.findFirst({
		where: { ipAddress: serverIp },
		include: {
			license: {
				include: {
					variant: { include: { product: true } },
				},
			},
		},
	});

	if (!registeredServer) {
		const data = { valid: false, reason: "Server IP not registered" };
		cache.set(cacheKey, { valid: false, data, expiresAt: Date.now() + CACHE_TTL_MS });
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}

	const license = registeredServer.license;

	// Check license status
	const statusOk = license.status === "ACTIVE" || license.status === "GRACE";
	if (!statusOk) {
		const data = { valid: false, reason: `License is ${license.status.toLowerCase()}` };
		cache.set(cacheKey, { valid: false, data, expiresAt: Date.now() + CACHE_TTL_MS });
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}

	// Check grace period
	if (license.status === "GRACE" && license.gracePeriodEnd && license.gracePeriodEnd < now) {
		// Expire the grace period
		await prisma.serverLicense.update({
			where: { id: license.id },
			data: { status: "REVOKED" },
		});
		const data = { valid: false, reason: "Grace period expired" };
		cache.set(cacheKey, { valid: false, data, expiresAt: Date.now() + CACHE_TTL_MS });
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}

	// Check product slug matches
	if (license.variant.product.slug !== productSlug) {
		const data = { valid: false, reason: "Product mismatch" };
		cache.set(cacheKey, { valid: false, data, expiresAt: Date.now() + CACHE_TTL_MS });
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}

	// Update last verified
	await prisma.registeredServer.update({
		where: { id: registeredServer.id },
		data: { lastVerifiedAt: now },
	});

	const data = {
		valid: true,
		product: license.variant.product.slug,
		licenseId: license.id,
	};
	cache.set(cacheKey, { valid: true, data, expiresAt: Date.now() + CACHE_TTL_MS });

	return new Response(JSON.stringify(data), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
