import { getDiscordClientId, getDiscordClientSecret, getDiscordRedirectUri } from "../env";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const DISCORD_OAUTH_URL = "https://discord.com/oauth2/authorize";
const DISCORD_TOKEN_URL = `${DISCORD_API_BASE}/oauth2/token`;

export function getDiscordRedirectUrl(state: string): string {
	const params = new URLSearchParams({
		client_id: getDiscordClientId(),
		redirect_uri: getDiscordRedirectUri(),
		response_type: "code",
		scope: "identify email",
		state,
	});
	return `${DISCORD_OAUTH_URL}?${params.toString()}`;
}

export async function exchangeDiscordCode(code: string): Promise<{
	discordId: string;
	username: string;
	avatarUrl: string;
	email?: string;
}> {
	const tokenRes = await fetch(DISCORD_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: getDiscordClientId(),
			client_secret: getDiscordClientSecret(),
			grant_type: "authorization_code",
			code,
			redirect_uri: getDiscordRedirectUri(),
		}).toString(),
	});

	if (!tokenRes.ok) {
		const err = await tokenRes.text();
		throw new Error(`Discord OAuth: token exchange failed: ${err}`);
	}

	const tokenData = (await tokenRes.json()) as { access_token: string; token_type: string };

	const userRes = await fetch(`${DISCORD_API_BASE}/users/@me`, {
		headers: { Authorization: `${tokenData.token_type} ${tokenData.access_token}` },
	});

	if (!userRes.ok) {
		throw new Error("Discord API: failed to fetch user");
	}

	const user = (await userRes.json()) as {
		id: string;
		username: string;
		discriminator: string;
		avatar: string | null;
		email?: string;
	};

	const avatarUrl = user.avatar
		? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
		: `https://cdn.discordapp.com/embed/avatars/0.png`;

	const displayName =
		user.discriminator === "0" ? user.username : `${user.username}#${user.discriminator}`;

	return {
		discordId: user.id,
		username: displayName,
		avatarUrl,
		email: user.email,
	};
}
