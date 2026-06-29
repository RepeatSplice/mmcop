import type { APIRoute } from "astro";
import { verifySteamCallback } from "../../../../lib/customer-auth/steam";
import { upsertCustomerFromOAuth, linkOAuthToCustomer } from "../../../../lib/customers";
import { createCustomerSession, getCustomerFromSession } from "../../../../lib/customer-auth/session";
import { prisma } from "../../../../lib/prisma";

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies }) => {
	try {
		const params = url.searchParams;
		const { steamId, username, avatarUrl } = await verifySteamCallback(params);

		// Check if there is already a logged-in customer who is mid-onboarding
		// (i.e. they logged in via Discord first and now need to link Steam)
		const pendingCustomer = await getCustomerFromSession(cookies);
		if (pendingCustomer && !pendingCustomer.onboardingComplete) {
			const hasDiscord = await prisma.connectedAccount.findFirst({
				where: { customerId: pendingCustomer.id, provider: "discord" },
			});
			if (hasDiscord) {
				// They have Discord, now linking Steam — attach and move to password step
				await linkOAuthToCustomer(pendingCustomer.id, "steam", steamId, username);
				return new Response(null, {
					status: 302,
					headers: { Location: "/account/onboard?step=password" },
				});
			}
		}

		const customer = await upsertCustomerFromOAuth("steam", steamId, { username, avatarUrl });
		await createCustomerSession(customer.id, cookies);

		const destination = customer.onboardingComplete ? "/account" : "/account/onboard";
		return new Response(null, {
			status: 302,
			headers: { Location: destination },
		});
	} catch (err) {
		console.error("[steam-callback]", err);
		return new Response(null, {
			status: 302,
			headers: { Location: "/account/login?error=steam" },
		});
	}
};
