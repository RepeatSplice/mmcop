import { getSteamApiKey, getSiteUrl } from "../env";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_API_BASE = "https://api.steampowered.com";

export function getSteamRedirectUrl(returnUrl: string): string {
	const params = new URLSearchParams({
		"openid.ns": "http://specs.openid.net/auth/2.0",
		"openid.mode": "checkid_setup",
		"openid.return_to": returnUrl,
		"openid.realm": getSiteUrl(),
		"openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
		"openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
	});
	return `${STEAM_OPENID_URL}?${params.toString()}`;
}

export async function verifySteamCallback(params: URLSearchParams): Promise<{
	steamId: string;
	username: string;
	avatarUrl: string;
}> {
	const mode = params.get("openid.mode");
	if (mode !== "id_res") {
		throw new Error("Steam OpenID: unexpected mode");
	}

	// Validate the response with Steam
	const verifyParams = new URLSearchParams(params);
	verifyParams.set("openid.mode", "check_authentication");

	const verifyRes = await fetch(STEAM_OPENID_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: verifyParams.toString(),
	});
	const verifyText = await verifyRes.text();
	if (!verifyText.includes("is_valid:true")) {
		throw new Error("Steam OpenID: validation failed");
	}

	// Extract Steam ID from claimed_id
	const claimedId = params.get("openid.claimed_id") ?? "";
	const steamIdMatch = claimedId.match(/\/(\d{17,})$/);
	if (!steamIdMatch) {
		throw new Error("Steam OpenID: could not extract Steam ID");
	}
	const steamId = steamIdMatch[1];

	// Fetch player summary
	const apiKey = getSteamApiKey();
	const summaryRes = await fetch(
		`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`,
	);
	if (!summaryRes.ok) {
		throw new Error("Steam API: failed to fetch player summary");
	}

	const data = (await summaryRes.json()) as {
		response: { players: Array<{ steamid: string; personaname: string; avatarfull: string }> };
	};
	const player = data.response.players[0];
	if (!player) {
		throw new Error("Steam API: player not found");
	}

	return {
		steamId,
		username: player.personaname,
		avatarUrl: player.avatarfull,
	};
}
