import { getSiteUrl } from "../../env";

type ModUpdatedParams = {
	productTitle: string;
	productSlug: string;
	version: string;
	notes: string;
	customerName: string;
};

export function modUpdatedTemplate(params: ModUpdatedParams): {
	subject: string;
	html: string;
	text: string;
} {
	const { productTitle, productSlug, version, notes, customerName } = params;
	const siteUrl = getSiteUrl();
	const shopUrl = `${siteUrl}/shop/${productSlug}`;

	const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h1 style="font-size:20px;color:#101c27;">${productTitle} Updated</h1>
      <p>Hi ${customerName},</p>
      <p><strong>${productTitle}</strong> has been updated to version <strong>v${version}</strong>.</p>
      <h2 style="font-size:15px;">What's new in v${version}</h2>
      <pre style="background:#f5f5f5;padding:12px;white-space:pre-wrap;font-size:13px;">${notes}</pre>
      <p style="margin-top:24px;">
        <a href="${siteUrl}/account" style="background:#355a7a;color:#fff;padding:10px 20px;text-decoration:none;display:inline-block;">
          Download Update
        </a>
      </p>
      <p style="color:#666;font-size:13px;">
        View product: <a href="${shopUrl}">${shopUrl}</a>
      </p>
    </div>
  `;

	const text = `${productTitle} has been updated (v${version})

Hi ${customerName},

${productTitle} has been updated to version v${version}.

What's new:
${notes}

Download the update from your account: ${siteUrl}/account

View product: ${shopUrl}
`;

	return {
		subject: `${productTitle} has been updated (v${version})`,
		html,
		text,
	};
}
