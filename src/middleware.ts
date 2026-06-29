import { defineMiddleware } from "astro:middleware";
import { getStaffFromSession } from "./lib/auth/session";
import { getCustomerFromSession } from "./lib/customer-auth/session";
import { getAdminHost, getSiteUrl, hasAdminHost } from "./lib/env";

const PUBLIC_MANAGE = ["/manage/login", "/manage/setup-2fa", "/manage/verify-2fa"];
const PUBLIC_ACCOUNT = ["/account/login", "/account/onboard"];
const ONBOARD_BYPASS = ["/account/login", "/account/onboard", "/api/auth/"];

const SHOP_MANAGER_ROUTES = [
	"/manage/products",
	"/manage/orders",
	"/manage/customers",
	"/manage/licenses",
	"/manage/analytics",
	"/manage/affiliates",
];

const SHOP_MANAGER_API_ROUTES = [
	"/api/manage/products",
	"/api/manage/orders",
	"/api/manage/customers",
	"/api/manage/licenses",
	"/api/manage/affiliates",
];

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname, hostname } = context.url;
	const adminHost = getAdminHost();

	// ── Hostname-based subdomain routing ──────────────────────────────────────
	if (hasAdminHost()) {
		const isAdminHost = hostname === adminHost;

		if (isAdminHost) {
			// admin.domain.com — only /manage routes are allowed here
			if (pathname === "/") {
				return context.redirect("/manage", 302);
			}
			if (!pathname.startsWith("/manage") && !pathname.startsWith("/api/manage")) {
				// Non-manage path on admin host → redirect to main site
				const siteUrl = getSiteUrl().replace(/\/$/, "");
				return context.redirect(`${siteUrl}${pathname}`, 302);
			}
		} else {
			// Main domain — block direct access to /manage, redirect to admin host
			if (pathname.startsWith("/manage") || pathname.startsWith("/api/manage")) {
				return context.redirect(`https://${adminHost}${pathname}`, 302);
			}
		}
	}

	// ── Staff (manage) routes ──────────────────────────────────────────────────
	if (pathname.startsWith("/manage")) {
		const isPublic = PUBLIC_MANAGE.some((p) => pathname === p || pathname.startsWith(p + "/"));
		if (!isPublic) {
			const staff = await getStaffFromSession(context.cookies);
			if (!staff) {
				return context.redirect("/manage/login");
			}
			if (!staff.totpEnabled && pathname !== "/manage/setup-2fa") {
				return context.redirect("/manage/setup-2fa");
			}
			if (pathname.startsWith("/manage/users") && staff.role !== "ADMIN") {
				return context.redirect("/manage");
			}
			// Block EDITOR from shop routes
			if (staff.role === "EDITOR") {
				const isShopRoute = SHOP_MANAGER_ROUTES.some(
					(r) => pathname === r || pathname.startsWith(r + "/"),
				);
				if (isShopRoute) {
					return context.redirect("/manage");
				}
			}
			context.locals.staff = staff;
		}
	}

	if (pathname.startsWith("/api/manage")) {
		const staff = await getStaffFromSession(context.cookies);
		if (!staff || !staff.totpEnabled) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
		}
		if (pathname.startsWith("/api/manage/users") && staff.role !== "ADMIN") {
			return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
		}
		// Block EDITOR from shop API routes
		if (staff.role === "EDITOR") {
			const isShopApiRoute = SHOP_MANAGER_API_ROUTES.some(
				(r) => pathname === r || pathname.startsWith(r + "/"),
			);
			if (isShopApiRoute) {
				return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
			}
		}
		context.locals.staff = staff;
	}

	// ── Customer (account) routes ──────────────────────────────────────────────
	if (pathname.startsWith("/account")) {
		const isPublic = PUBLIC_ACCOUNT.some((p) => pathname === p || pathname.startsWith(p + "/"));
		if (!isPublic) {
			const customer = await getCustomerFromSession(context.cookies);
			if (!customer) {
				return context.redirect("/account/login");
			}
			// Redirect to onboarding if they haven't finished setup
			const bypassOnboard = ONBOARD_BYPASS.some((p) => pathname.startsWith(p));
			if (!customer.onboardingComplete && !bypassOnboard) {
				return context.redirect("/account/onboard");
			}
			context.locals.customer = customer;
		}
	}

	return next();
});
