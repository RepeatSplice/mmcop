import type { APIRoute } from "astro";
import { getCustomerFromSession } from "../../../lib/customer-auth/session";
import { verifyTotpCode, decryptTotpFromStorage } from "../../../lib/auth/totp";
import { prisma } from "../../../lib/prisma";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
	const customer = await getCustomerFromSession(cookies);
	if (!customer || !customer.totpEnabled || !customer.totpSecretEnc) {
		return new Response(null, { status: 302, headers: { Location: "/account/security" } });
	}

	let code: string | undefined;
	const ct = request.headers.get("content-type") ?? "";
	if (ct.includes("application/json")) {
		const body = await request.json().catch(() => ({}));
		code = body.code;
	} else {
		const fd = await request.formData().catch(() => new FormData());
		code = String(fd.get("code") ?? "");
	}

	if (!code) {
		return new Response(null, { status: 302, headers: { Location: "/account/security?error=missing-code" } });
	}

	const secret = decryptTotpFromStorage(customer.totpSecretEnc);
	const valid = verifyTotpCode(secret, code);

	if (!valid) {
		return new Response(null, { status: 302, headers: { Location: "/account/security?error=invalid-code" } });
	}

	await prisma.customer.update({
		where: { id: customer.id },
		data: { totpEnabled: false, totpSecretEnc: null, backupCodesHash: null },
	});

	return new Response(null, { status: 302, headers: { Location: "/account/security?2fa=disabled" } });
};
