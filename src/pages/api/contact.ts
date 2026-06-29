import type { APIRoute } from "astro";
import { prisma } from "../../lib/prisma";
import { json } from "../../lib/http";
import { rateLimit } from "../../lib/auth/rate-limit";
import { parseContactForm } from "../../lib/contact-admin";
import { sendContactEnquiryEmails } from "../../lib/email/contact-enquiry";
import { hasTurnstile } from "../../lib/env";
import { verifyTurnstileToken } from "../../lib/turnstile";

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
	const ip = clientAddress ?? "unknown";
	if (!rateLimit(`contact:${ip}`, 5, 60_000)) {
		return json({ error: "Too many submissions. Please wait a minute and try again." }, 429);
	}

	const form = await request.formData();

	if (hasTurnstile()) {
		const token = String(form.get("cf-turnstile-response") ?? "");
		const ok = await verifyTurnstileToken(token, ip !== "unknown" ? ip : undefined);
		if (!ok) {
			return json({ error: "Please complete the security check and try again." }, 400);
		}
	}

	const parsed = parseContactForm(form);
	if ("error" in parsed) {
		return json({ error: parsed.error }, 400);
	}

	const enquiry = await prisma.contactEnquiry.create({
		data: {
			...parsed,
			status: "NEW",
		},
	});

	try {
		await sendContactEnquiryEmails(enquiry);
	} catch (err) {
		console.error("[contact] Email dispatch failed:", err);
		await prisma.contactEnquiry.update({
			where: { id: enquiry.id },
			data: {
				customerAckStatus: "FAILED",
				staffNotifyStatus: "FAILED",
			},
		});
	}

	return json({ ok: true, id: enquiry.id });
};
