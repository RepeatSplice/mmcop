import { getSiteUrl } from "../../env";

type LicenseRevokedParams = {
	customerName: string;
	productTitle: string;
	reason: string;
};

export function licenseRevokedTemplate(params: LicenseRevokedParams): {
	subject: string;
	html: string;
	text: string;
} {
	const { customerName, productTitle, reason } = params;
	const siteUrl = getSiteUrl();

	const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h1 style="font-size:20px;color:#101c27;">License Revoked</h1>
      <p>Hi ${customerName},</p>
      <p>Your license for <strong>${productTitle}</strong> has been revoked.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>
        If you believe this is an error or would like to appeal, please 
        <a href="${siteUrl}/contact">contact support</a>.
      </p>
    </div>
  `;

	const text = `Your license for ${productTitle} has been revoked

Hi ${customerName},

Your license for ${productTitle} has been revoked.

Reason: ${reason}

If you believe this is an error, please contact support: ${siteUrl}/contact
`;

	return {
		subject: `Your license for ${productTitle} has been revoked`,
		html,
		text,
	};
}
