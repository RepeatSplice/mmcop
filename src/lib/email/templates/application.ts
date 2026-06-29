import { getSiteUrl } from "../../env";

export type ApplicationEmailData = {
	id: string;
	fullName: string;
	email: string;
	jobTitle: string;
	jobSlug: string;
	phone?: string | null;
	location?: string | null;
	portfolioUrl?: string | null;
	githubUrl?: string | null;
	discord?: string | null;
	coverLetter?: string | null;
};

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/** Sent to the applicant confirming receipt of their application. */
export function applicantAckEmail(data: ApplicationEmailData): { subject: string; html: string; text: string } {
	const ref = data.id.slice(-8).toUpperCase();
	const subject = `Application received — ${data.jobTitle} (ref ${ref})`;

	const text = `Hi ${data.fullName},

Thank you for applying for the ${data.jobTitle} role at Monarch. We have received your application and will review it shortly.

Reference: ${ref}

We will be in touch if your application progresses. In the meantime, feel free to reply to this email if you have any questions.

Monarch
${getSiteUrl()}`;

	const html = `
<p>Hi ${escapeHtml(data.fullName)},</p>
<p>Thank you for applying for the <strong>${escapeHtml(data.jobTitle)}</strong> role at <strong>Monarch</strong>. We have received your application and will review it shortly.</p>
<p><strong>Reference:</strong> ${ref}</p>
<p>We will be in touch if your application progresses. In the meantime, feel free to reply to this email if you have any questions.</p>
<p style="color:#666;font-size:14px;">Monarch &middot; <a href="${getSiteUrl()}">${getSiteUrl()}</a></p>
`.trim();

	return { subject, html, text };
}

/** Sent to staff (job.applicationEmail) when a new application arrives. */
export function staffApplicationEmail(data: ApplicationEmailData): { subject: string; html: string; text: string } {
	const siteUrl = getSiteUrl();
	const adminUrl = `${siteUrl}/manage/applications/${data.id}`;
	const subject = `[Application] ${data.jobTitle}: ${data.fullName}`;

	const rows: Array<[string, string]> = [
		["Name", data.fullName],
		["Email", data.email],
	];
	if (data.phone) rows.push(["Phone", data.phone]);
	if (data.location) rows.push(["Location", data.location]);
	if (data.portfolioUrl) rows.push(["Portfolio", data.portfolioUrl]);
	if (data.githubUrl) rows.push(["GitHub", data.githubUrl]);
	if (data.discord) rows.push(["Discord", data.discord]);

	const text = `New application for ${data.jobTitle}

${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}

${data.coverLetter ? `Cover letter:\n${data.coverLetter}\n\n` : ""}View in admin: ${adminUrl}`;

	const htmlRows = rows
		.map(
			([k, v]) =>
				`<tr><td style="padding:4px 12px 4px 0;color:#666;white-space:nowrap;">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`
		)
		.join("");

	const html = `
<h2 style="margin:0 0 12px;font-family:sans-serif;">New application — ${escapeHtml(data.jobTitle)}</h2>
<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
${htmlRows}
</table>
${
	data.coverLetter?.trim()
		? `<p style="font-family:sans-serif;font-size:13px;color:#444;margin:16px 0 4px;font-weight:600;">Cover letter</p>
<p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap;background:#f4f4f5;padding:12px;border-radius:4px;margin:0;">${escapeHtml(data.coverLetter.trim())}</p>`
		: ""
}
<p style="margin:16px 0 0;"><a href="${adminUrl}" style="font-family:sans-serif;font-size:14px;">Open in admin →</a></p>
`.trim();

	return { subject, html, text };
}
