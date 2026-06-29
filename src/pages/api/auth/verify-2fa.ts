import type { APIRoute } from "astro";
import { prisma } from "../../../lib/prisma";
import {
	clearPending2FA,
	createSession,
	getPendingStaffId,
} from "../../../lib/auth/session";
import { decryptTotpFromStorage, verifyTotpCode, consumeBackupCode } from "../../../lib/auth/totp";
import { json, readFormJson } from "../../../lib/http";
import { rateLimit } from "../../../lib/auth/rate-limit";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
	const ip = clientAddress ?? "unknown";
	if (!rateLimit(`2fa:${ip}`, 8, 60_000)) {
		return json({ error: "Too many attempts." }, 429);
	}

	const staffId = await getPendingStaffId(cookies);
	if (!staffId) {
		return json({ error: "Session expired. Sign in again." }, 401);
	}

	const body = await readFormJson(request);
	const code = (body.code ?? "").trim();
	if (!code) {
		return json({ error: "Enter your 6-digit code or backup code." }, 400);
	}

	const staff = await prisma.staffUser.findUnique({ where: { id: staffId } });
	if (!staff || !staff.totpEnabled || !staff.totpSecretEnc) {
		return json({ error: "Two-factor is not configured." }, 400);
	}

	const secret = decryptTotpFromStorage(staff.totpSecretEnc);
	let verified = verifyTotpCode(secret, code);

	if (!verified && code.includes("-")) {
		const backup = await consumeBackupCode(staff.backupCodesHash, code);
		if (backup.ok) {
			verified = true;
			await prisma.staffUser.update({
				where: { id: staff.id },
				data: { backupCodesHash: backup.nextHash },
			});
		}
	}

	if (!verified) {
		return json({ error: "Invalid code." }, 401);
	}

	await clearPending2FA(cookies);
	await createSession(staff.id, cookies);
	return json({ ok: true, redirect: "/manage" });
};
