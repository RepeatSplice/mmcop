import type { APIRoute } from "astro";
import { prisma } from "../../../lib/prisma";
import { getStaffFromSession, getPendingStaffId } from "../../../lib/auth/session";
import {
	encryptTotpForStorage,
	generateTotpSecret,
	getTotpQrDataUrl,
} from "../../../lib/auth/totp";
import { json } from "../../../lib/http";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
	let staffId = (await getStaffFromSession(cookies))?.id;
	if (!staffId) {
		staffId = (await getPendingStaffId(cookies)) ?? undefined;
	}
	if (!staffId) {
		return json({ error: "Unauthorized" }, 401);
	}

	const staff = await prisma.staffUser.findUnique({ where: { id: staffId } });
	if (!staff) return json({ error: "Not found" }, 404);

	const secret = generateTotpSecret();
	const qrDataUrl = await getTotpQrDataUrl(staff.email, secret);

	// Store temporarily until confirmed (overwrite encrypted on confirm)
	await prisma.staffUser.update({
		where: { id: staff.id },
		data: { totpSecretEnc: encryptTotpForStorage(secret), totpEnabled: false },
	});

	return json({ qrDataUrl, secret, email: staff.email });
};
