import type { APIRoute } from "astro";
import { exchangeDiscordCode } from "../../../../lib/customer-auth/discord";
import { upsertCustomerFromOAuth, linkOAuthToCustomer } from "../../../../lib/customers";
import { createCustomerSession, getCustomerFromSession } from "../../../../lib/customer-auth/session";
import { prisma } from "../../../../lib/prisma";

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies }) => {
	try {
		const code = url.searchParams.get("code");
		const state = url.searchParams.get("state");
		const storedState = cookies.get("discord_oauth_state")?.value;

		cookies.delete("discord_oauth_state", { path: "/" });

		if (!code || !state || state !== storedState) {
			throw new Error("Invalid OAuth state or missing code");
		}

		const { discordId, username, avatarUrl, email } = await exchangeDiscordCode(code);

		// Check if there is already a logged-in customer who is mid-onboarding
		// (i.e. they logged in via Steam first and now need to link Discord)
		const pendingCustomer = await getCustomerFromSession(cookies);
		if (pendingCustomer && !pendingCustomer.onboardingComplete) {
			const hasSteam = await prisma.connectedAccount.findFirst({
				where: { customerId: pendingCustomer.id, provider: "steam" },
			});
			if (hasSteam) {
				// They have Steam, now linking Discord — attach and move to password step
				await linkOAuthToCustomer(pendingCustomer.id, "discord", discordId, username);
				return new Response(null, {
					status: 302,
					headers: { Location: "/account/onboard?step=password" },
				});
			}
		}

		const customer = await upsertCustomerFromOAuth("discord", discordId, {
			username,
			avatarUrl,
			email,
		});
		await createCustomerSession(customer.id, cookies);

		const destination = customer.onboardingComplete ? "/account" : "/account/onboard";
		return new Response(null, {
			status: 302,
			headers: { Location: destination },
		});
	} catch (err) {
		console.error("[discord-callback]", err);
		return new Response(null, {
			status: 302,
			headers: { Location: "/account/login?error=discord" },
		});
	}
};
