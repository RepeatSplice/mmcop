import type { APIRoute } from "astro";
import { prisma } from "../../../lib/prisma";
import { verifyPassword } from "../../../lib/auth/password";
import { createPending2FA, createSession } from "../../../lib/auth/session";
import { json, readFormJson } from "../../../lib/http";
import { rateLimit } from "../../../lib/auth/rate-limit";

export const prerender = false;

const LOCK_AFTER = 10;
const LOCK_MINUTES = 15;

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
	const ip = clientAddress ?? "unknown";
	const body = await readFormJson(request);
	const email = (body.email ?? "").trim().toLowerCase();
	const password = body.password ?? "";

	if (!email || !password) {
		return json({ error: "Email and password are required." }, 400);
	}

	if (!rateLimit(`login:${ip}`, 5, 60_000) || !rateLimit(`login:${email}`, 5, 60_000)) {
		return json({ error: "Too many attempts. Wait a minute and try again." }, 429);
	}

	const staff = await prisma.staffUser.findUnique({ where: { email } });
	if (!staff) {
		return json({ error: "Invalid email or password." }, 401);
	}

	if (staff.lockedUntil && staff.lockedUntil > new Date()) {
		return json({ error: "Account temporarily locked. Try again later." }, 423);
	}

	const valid = await verifyPassword(password, staff.passwordHash);
	if (!valid) {
		const attempts = staff.failedLoginAttempts + 1;
		await prisma.staffUser.update({
			where: { id: staff.id },
			data: {
				failedLoginAttempts: attempts,
				lockedUntil:
					attempts >= LOCK_AFTER ? new Date(Date.now() + LOCK_MINUTES * 60_000) : staff.lockedUntil,
			},
		});
		return json({ error: "Invalid email or password." }, 401);
	}

	await prisma.staffUser.update({
		where: { id: staff.id },
		data: { failedLoginAttempts: 0, lockedUntil: null },
	});

	if (!staff.totpEnabled) {
		await createPending2FA(staff.id, cookies);
		return json({ ok: true, requires2fa: false, setup2fa: true });
	}

	await createPending2FA(staff.id, cookies);
	return json({ ok: true, requires2fa: true, setup2fa: false });
};
