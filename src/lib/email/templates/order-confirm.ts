import { getSiteUrl } from "../../env";

type OrderItem = {
	variant: { name: string; product: { title: string } };
	priceMinorUnits: number;
};

type OrderConfirmParams = {
	orderId: string;
	customerName: string;
	items: OrderItem[];
	totalMinorUnits: number;
};

export function orderConfirmTemplate(params: OrderConfirmParams): {
	subject: string;
	html: string;
	text: string;
} {
	const { orderId, customerName, items, totalMinorUnits } = params;
	const siteUrl = getSiteUrl();
	const orderUrl = `${siteUrl}/account/orders/${orderId}`;
	const shortId = orderId.slice(-8).toUpperCase();

	const itemsHtml = items
		.map(
			(item) =>
				`<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
            ${item.variant.product.title} - ${item.variant.name}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;">
            &pound;${(item.priceMinorUnits / 100).toFixed(2)}
          </td>
        </tr>`,
		)
		.join("");

	const itemsText = items
		.map(
			(item) =>
				`- ${item.variant.product.title} (${item.variant.name}): $${(item.priceMinorUnits / 100).toFixed(2)}`,
		)
		.join("\n");

	const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h1 style="font-size:20px;color:#101c27;">Order Confirmed</h1>
      <p>Hi ${customerName},</p>
      <p>Thank you for your order. Your license has been activated and is ready to use.</p>
      <p><strong>Order #${shortId}</strong></p>
      <table style="width:100%;border-collapse:collapse;">
        ${itemsHtml}
        <tr>
          <td style="padding:12px 0;font-weight:bold;">Total</td>
          <td style="padding:12px 0;text-align:right;font-weight:bold;">
            &pound;${(totalMinorUnits / 100).toFixed(2)}
          </td>
        </tr>
      </table>
      <p style="margin-top:24px;">
        <a href="${orderUrl}" style="background:#355a7a;color:#fff;padding:10px 20px;text-decoration:none;display:inline-block;">
          View Order &amp; Download
        </a>
      </p>
      <p style="color:#666;font-size:13px;">
        You can manage your server IP registrations from your 
        <a href="${siteUrl}/account/licenses">licenses page</a>.
      </p>
    </div>
  `;

	const text = `Order Confirmed - Order #${shortId}

Hi ${customerName},

Thank you for your order! Your license has been activated.

${itemsText}

Total: $${(totalMinorUnits / 100).toFixed(2)}

View order and download: ${orderUrl}
Manage licenses: ${siteUrl}/account/licenses
`;

	return {
		subject: `Your Monarch license order #${shortId}`,
		html,
		text,
	};
}
