import { Resend } from "resend";
import { getEmailFrom, hasResendApiKey } from "../env";
import type { EmailDeliveryStatus } from "../contact-admin";

export type SendEmailResult = {
	status: EmailDeliveryStatus;
	error?: string;
};

export async function sendEmail(params: {
	to: string;
	subject: string;
	html: string;
	text: string;
}): Promise<SendEmailResult> {
	if (!hasResendApiKey()) {
		if (import.meta.env.DEV) {
			console.warn("[email] RESEND_API_KEY not set; skipping send to", params.to, params.subject);
		}
		return { status: "SKIPPED" };
	}

	try {
		const resend = new Resend(import.meta.env.RESEND_API_KEY);
		const { error } = await resend.emails.send({
			from: getEmailFrom(),
			to: params.to,
			subject: params.subject,
			html: params.html,
			text: params.text,
		});

		if (error) {
			console.error("[email] Resend error:", error);
			return { status: "FAILED", error: error.message };
		}

		return { status: "SENT" };
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		console.error("[email] Send failed:", message);
		return { status: "FAILED", error: message };
	}
}
