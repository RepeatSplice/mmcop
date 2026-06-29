import { contactTopicLabel, type ContactTopic } from "../../contact-admin";
import { getSiteUrl } from "../../env";

export type ContactEmailData = {
	id: string;
	fullName: string;
	email: string;
	phone: string | null;
	company: string | null;
	topic: ContactTopic;
	message: string;
	createdAt: Date;
};

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function customerAckEmail(data: ContactEmailData): { subject: string; html: string; text: string } {
	const topic = contactTopicLabel(data.topic);
	const ref = data.id.slice(-8).toUpperCase();
	const subject = `We received your message, Monarch (ref ${ref})`;

	const text = `Hi ${data.fullName},

Thank you for contacting Monarch. We have received your enquiry about "${topic}" and will review it shortly.

Reference: ${ref}
Submitted: ${data.createdAt.toLocaleString("en-GB")}

If your matter is urgent, you can reply to this email.

Monarch
${getSiteUrl()}`;

	const html = `
<p>Hi ${escapeHtml(data.fullName)},</p>
<p>Thank you for contacting <strong>Monarch</strong>. We have received your enquiry about <strong>${escapeHtml(topic)}</strong> and will review it shortly.</p>
<p><strong>Reference:</strong> ${ref}<br><strong>Submitted:</strong> ${escapeHtml(data.createdAt.toLocaleString("en-GB"))}</p>
<p>If your matter is urgent, you can reply to this email.</p>
<p style="color:#666;font-size:14px;">Monarch · <a href="${getSiteUrl()}">${getSiteUrl()}</a></p>
`.trim();

	return { subject, html, text };
}

export function staffNotifyEmail(data: ContactEmailData): { subject: string; html: string; text: string } {
	const topic = contactTopicLabel(data.topic);
	const siteUrl = getSiteUrl();
	const adminUrl = `${siteUrl}/manage/enquiries/${data.id}`;
	const subject = `[Contact] ${topic}: ${data.fullName}`;

	const text = `New contact enquiry

Name: ${data.fullName}
Email: ${data.email}
Phone: ${data.phone ?? "N/A"}
Company / Discord: ${data.company ?? "N/A"}
Topic: ${topic}

Message:
${data.message}

View in admin: ${adminUrl}`;

	const html = `
<h2 style="margin:0 0 12px;font-family:sans-serif;">New contact enquiry</h2>
<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
<tr><td style="padding:4px 12px 4px 0;color:#666;">Name</td><td>${escapeHtml(data.fullName)}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#666;">Email</td><td><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#666;">Phone</td><td>${escapeHtml(data.phone ?? "N/A")}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#666;">Company</td><td>${escapeHtml(data.company ?? "N/A")}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#666;">Topic</td><td>${escapeHtml(topic)}</td></tr>
</table>
<p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap;background:#f4f4f5;padding:12px;border-radius:4px;">${escapeHtml(data.message)}</p>
<p><a href="${adminUrl}" style="font-family:sans-serif;">Open in admin →</a></p>
`.trim();

	return { subject, html, text };
}
