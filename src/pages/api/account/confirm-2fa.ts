import type { APIRoute } from "astro";
import { getCustomerFromSession } from "../../../lib/customer-auth/session";
import { verifyTotpCode, encryptTotpForStorage, generateBackupCodes } from "../../../lib/auth/totp";
import { prisma } from "../../../lib/prisma";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
	const customer = await getCustomerFromSession(cookies);
	if (!customer) {
		return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
	}

	let body: { secret?: string; code?: string };
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
	}

	const { secret, code } = body;
	if (!secret || !code) {
		return new Response(JSON.stringify({ error: "Missing secret or code" }), { status: 400 });
	}

	const valid = verifyTotpCode(secret, code);
	if (!valid) {
		return new Response(JSON.stringify({ error: "Invalid code. Please try again." }), { status: 400 });
	}

	const { hashedJson } = await generateBackupCodes();
	await prisma.customer.update({
		where: { id: customer.id },
		data: {
			totpSecretEnc: encryptTotpForStorage(secret),
			totpEnabled: true,
			backupCodesHash: hashedJson,
		},
	});

	return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
