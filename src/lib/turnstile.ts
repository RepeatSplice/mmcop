import { getTurnstileSecretKey, hasTurnstile } from "./env";

type TurnstileVerifyResponse = {
	success: boolean;
	"error-codes"?: string[];
};

export async function verifyTurnstileToken(token: string, remoteip?: string): Promise<boolean> {
	if (!hasTurnstile()) return true;
	if (!token.trim()) return false;

	const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			secret: getTurnstileSecretKey(),
			response: token,
			...(remoteip ? { remoteip } : {}),
		}),
	});

	if (!res.ok) return false;

	const data = (await res.json()) as TurnstileVerifyResponse;
	return data.success === true;
}
