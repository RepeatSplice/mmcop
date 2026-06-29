import { getSiteUrl } from "../../env";

type LicenseIpAddedParams = {
	customerName: string;
	productTitle: string;
	licenseId: string;
	ipAddress: string;
	label?: string;
};

export function licenseIpAddedTemplate(params: LicenseIpAddedParams): {
	subject: string;
	html: string;
	text: string;
} {
	const { customerName, productTitle, licenseId: _licenseId, ipAddress, label } = params;
	const siteUrl = getSiteUrl();

	const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h1 style="font-size:20px;color:#101c27;">Server IP Registered</h1>
      <p>Hi ${customerName},</p>
      <p>A server IP has been added to your <strong>${productTitle}</strong> license.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9f9f9;padding:12px;">
        <tr>
          <td style="padding:8px;"><strong>IP Address</strong></td>
          <td style="padding:8px;font-family:monospace;">${ipAddress}</td>
        </tr>
        ${label ? `<tr><td style="padding:8px;"><strong>Label</strong></td><td style="padding:8px;">${label}</td></tr>` : ""}
      </table>
      <p>If you did not make this change, please contact support immediately.</p>
      <p style="margin-top:24px;">
        <a href="${siteUrl}/account/licenses" style="background:#355a7a;color:#fff;padding:10px 20px;text-decoration:none;display:inline-block;">
          Manage Licenses
        </a>
      </p>
    </div>
  `;

	const text = `Server IP Registered for ${productTitle}

Hi ${customerName},

A server IP has been added to your ${productTitle} license:
IP: ${ipAddress}${label ? `\nLabel: ${label}` : ""}

If you did not make this change, please contact support immediately.

Manage your licenses: ${siteUrl}/account/licenses
`;

	return {
		subject: `Server IP registered for ${productTitle}`,
		html,
		text,
	};
}
