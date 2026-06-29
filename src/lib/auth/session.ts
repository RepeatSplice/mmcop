import type { AstroCookies } from "astro";
import { prisma } from "../prisma";
import { randomToken } from "../crypto";
import { isProduction } from "../env";

const SESSION_COOKIE = "monarch_session";
const PENDING_2FA_COOKIE = "monarch_pending_2fa";
const SESSION_DAYS = 7;
const PENDING_MINUTES = 10;

export type StaffSession = {
	id: string;
	email: string;
	name: string;
	role: "ADMIN" | "EDITOR" | "SHOP_MANAGER";
	totpEnabled: boolean;
};

function sessionExpiry(): Date {
	return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

function pendingExpiry(): Date {
	return new Date(Date.now() + PENDING_MINUTES * 60 * 1000);
}

function cookieOptions(maxAgeSeconds: number) {
	return {
		httpOnly: true,
		secure: isProduction(),
		sameSite: "lax" as const,
		path: "/",
		maxAge: maxAgeSeconds,
	};
}

export async function createSession(staffId: string, cookies: AstroCookies): Promise<void> {
	const session = await prisma.session.create({
		data: { staffId, expiresAt: sessionExpiry() },
	});
	cookies.set(SESSION_COOKIE, session.id, cookieOptions(SESSION_DAYS * 86400));
	cookies.delete(PENDING_2FA_COOKIE, { path: "/" });
}

export async function createPending2FA(staffId: string, cookies: AstroCookies): Promise<void> {
	await prisma.pendingTwoFactor.deleteMany({ where: { staffId } });
	const pending = await prisma.pendingTwoFactor.create({
		data: { staffId, expiresAt: pendingExpiry() },
	});
	cookies.set(PENDING_2FA_COOKIE, pending.id, cookieOptions(PENDING_MINUTES * 60));
}

export async function getPendingStaffId(cookies: AstroCookies): Promise<string | null> {
	const id = cookies.get(PENDING_2FA_COOKIE)?.value;
	if (!id) return null;
	const pending = await prisma.pendingTwoFactor.findUnique({ where: { id } });
	if (!pending || pending.expiresAt < new Date()) {
		cookies.delete(PENDING_2FA_COOKIE, { path: "/" });
		if (pending) await prisma.pendingTwoFactor.delete({ where: { id } }).catch(() => {});
		return null;
	}
	return pending.staffId;
}

export async function clearPending2FA(cookies: AstroCookies): Promise<void> {
	const id = cookies.get(PENDING_2FA_COOKIE)?.value;
	cookies.delete(PENDING_2FA_COOKIE, { path: "/" });
	if (id) await prisma.pendingTwoFactor.deleteMany({ where: { id } });
}

export async function getStaffFromSession(cookies: AstroCookies): Promise<StaffSession | null> {
	const sessionId = cookies.get(SESSION_COOKIE)?.value;
	if (!sessionId) return null;

	const session = await prisma.session.findUnique({
		where: { id: sessionId },
		include: { staff: true },
	});

	if (!session || session.expiresAt < new Date()) {
		cookies.delete(SESSION_COOKIE, { path: "/" });
		if (session) await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
		return null;
	}

	return {
		id: session.staff.id,
		email: session.staff.email,
		name: session.staff.name,
		role: session.staff.role,
		totpEnabled: session.staff.totpEnabled,
	};
}

export async function destroySession(cookies: AstroCookies): Promise<void> {
	const sessionId = cookies.get(SESSION_COOKIE)?.value;
	cookies.delete(SESSION_COOKIE, { path: "/" });
	await clearPending2FA(cookies);
	if (sessionId) {
		await prisma.session.deleteMany({ where: { id: sessionId } });
	}
}

export function generateCsrfToken(): string {
	return randomToken(24);
}

export function verifyCsrf(cookieToken: string | undefined, bodyToken: string | null): boolean {
	if (!cookieToken || !bodyToken) return false;
	return cookieToken === bodyToken;
}
