import { getSiteUrl } from "../../env";

type LicenseIpRemovedParams = {
	customerName: string;
	productTitle: string;
	ipAddress: string;
};

export function licenseIpRemovedTemplate(params: LicenseIpRemovedParams): {
	subject: string;
	html: string;
	text: string;
} {
	const { customerName, productTitle, ipAddress } = params;
	const siteUrl = getSiteUrl();

	const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h1 style="font-size:20px;color:#101c27;">Server IP Removed</h1>
      <p>Hi ${customerName},</p>
      <p>A server IP has been removed from your <strong>${productTitle}</strong> license.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9f9f9;padding:12px;">
        <tr>
          <td style="padding:8px;"><strong>IP Address</strong></td>
          <td style="padding:8px;font-family:monospace;">${ipAddress}</td>
        </tr>
      </table>
      <p>If you did not make this change, please contact support immediately.</p>
      <p style="margin-top:24px;">
        <a href="${siteUrl}/account/licenses" style="background:#355a7a;color:#fff;padding:10px 20px;text-decoration:none;display:inline-block;">
          Manage Licenses
        </a>
      </p>
    </div>
  `;

	const text = `Server IP Removed from ${productTitle}

Hi ${customerName},

A server IP has been removed from your ${productTitle} license:
IP: ${ipAddress}

If you did not make this change, please contact support immediately.

Manage your licenses: ${siteUrl}/account/licenses
`;

	return {
		subject: `Server IP removed from ${productTitle}`,
		html,
		text,
	};
}
