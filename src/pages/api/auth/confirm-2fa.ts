import type { APIRoute } from "astro";
import { prisma } from "../../../lib/prisma";
import {
	createSession,
	getPendingStaffId,
	getStaffFromSession,
} from "../../../lib/auth/session";
import {
	decryptTotpFromStorage,
	generateBackupCodes,
	verifyTotpCode,
} from "../../../lib/auth/totp";
import { json, readFormJson } from "../../../lib/http";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
	let staffId = (await getStaffFromSession(cookies))?.id;
	if (!staffId) staffId = (await getPendingStaffId(cookies)) ?? undefined;
	if (!staffId) return json({ error: "Unauthorized" }, 401);

	const body = await readFormJson(request);
	const code = (body.code ?? "").trim();
	const staff = await prisma.staffUser.findUnique({ where: { id: staffId } });
	if (!staff?.totpSecretEnc) {
		return json({ error: "Start setup again." }, 400);
	}

	const secret = decryptTotpFromStorage(staff.totpSecretEnc);
	if (!verifyTotpCode(secret, code)) {
		return json({ error: "Invalid code. Try again." }, 401);
	}

	const { plain, hashedJson } = await generateBackupCodes();
	await prisma.staffUser.update({
		where: { id: staff.id },
		data: { totpEnabled: true, backupCodesHash: hashedJson },
	});

	await createSession(staff.id, cookies);
	return json({ ok: true, backupCodes: plain, redirect: "/manage" });
};
