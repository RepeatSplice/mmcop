import type { AstroCookies } from "astro";
import type { Customer } from "@prisma/client";
import { prisma } from "../prisma";
import { isProduction } from "../env";

const CUSTOMER_COOKIE = "monarch_customer";
const SESSION_DAYS = 30;

function cookieOptions(maxAgeSeconds: number) {
	return {
		httpOnly: true,
		secure: isProduction(),
		sameSite: "lax" as const,
		path: "/",
		maxAge: maxAgeSeconds,
	};
}

export async function createCustomerSession(
	customerId: string,
	cookies: AstroCookies,
): Promise<void> {
	const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
	const session = await prisma.customerSession.create({
		data: { customerId, expiresAt },
	});
	cookies.set(CUSTOMER_COOKIE, session.id, cookieOptions(SESSION_DAYS * 86400));
}

export async function getCustomerFromSession(
	cookies: AstroCookies,
): Promise<Customer | null> {
	const sessionId = cookies.get(CUSTOMER_COOKIE)?.value;
	if (!sessionId) return null;

	const session = await prisma.customerSession.findUnique({
		where: { id: sessionId },
		include: { customer: true },
	});

	if (!session || session.expiresAt < new Date()) {
		cookies.delete(CUSTOMER_COOKIE, { path: "/" });
		if (session) {
			await prisma.customerSession.delete({ where: { id: sessionId } }).catch(() => {});
		}
		return null;
	}

	return session.customer;
}

export async function destroyCustomerSession(cookies: AstroCookies): Promise<void> {
	const sessionId = cookies.get(CUSTOMER_COOKIE)?.value;
	cookies.delete(CUSTOMER_COOKIE, { path: "/" });
	if (sessionId) {
		await prisma.customerSession.deleteMany({ where: { id: sessionId } });
	}
}
