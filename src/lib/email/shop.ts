import type { Customer, Order, OrderItem, Product, ServerLicense } from "@prisma/client";
import { sendEmail } from "./index";
import { orderConfirmTemplate } from "./templates/order-confirm";
import { modUpdatedTemplate } from "./templates/mod-updated";
import { licenseIpAddedTemplate } from "./templates/license-ip-added";
import { licenseIpRemovedTemplate } from "./templates/license-ip-removed";
import { licenseRevokedTemplate } from "./templates/license-revoked";
import { reviewRequestTemplate } from "./templates/review-request";

type OrderWithItems = Order & {
	items: (OrderItem & { variant: { name: string; product: { title: string } } })[];
	customer: Customer;
};

export async function sendOrderConfirm(order: OrderWithItems): Promise<void> {
	const customer = order.customer;
	if (!customer.email) return;

	const { subject, html, text } = orderConfirmTemplate({
		orderId: order.id,
		customerName: customer.displayName,
		items: order.items,
		totalMinorUnits: order.totalMinorUnits,
	});

	await sendEmail({ to: customer.email, subject, html, text });
}

export async function sendModUpdated(
	product: Product,
	version: string,
	notes: string,
	customers: Customer[],
): Promise<void> {
	const emailPromises = customers
		.filter((c) => c.email)
		.map((customer) => {
			const { subject, html, text } = modUpdatedTemplate({
				productTitle: product.title,
				productSlug: product.slug,
				version,
				notes,
				customerName: customer.displayName,
			});
			return sendEmail({ to: customer.email!, subject, html, text });
		});
	await Promise.allSettled(emailPromises);
}

export async function sendLicenseIpAdded(
	customer: Customer,
	license: ServerLicense & { variant: { product: { title: string } } },
	ip: string,
	label?: string,
): Promise<void> {
	if (!customer.email) return;
	const { subject, html, text } = licenseIpAddedTemplate({
		customerName: customer.displayName,
		productTitle: license.variant.product.title,
		licenseId: license.id,
		ipAddress: ip,
		label,
	});
	await sendEmail({ to: customer.email, subject, html, text });
}

export async function sendLicenseIpRemoved(
	customer: Customer,
	license: ServerLicense & { variant: { product: { title: string } } },
	ip: string,
): Promise<void> {
	if (!customer.email) return;
	const { subject, html, text } = licenseIpRemovedTemplate({
		customerName: customer.displayName,
		productTitle: license.variant.product.title,
		ipAddress: ip,
	});
	await sendEmail({ to: customer.email, subject, html, text });
}

export async function sendReviewRequest(
	customer: Customer,
	product: { title: string; slug: string },
): Promise<void> {
	if (!customer.email) return;
	const { subject, html, text } = reviewRequestTemplate({
		customerName: customer.displayName,
		productTitle: product.title,
		productSlug: product.slug,
	});
	await sendEmail({ to: customer.email, subject, html, text });
}

export async function sendLicenseRevoked(
	customer: Customer,
	license: ServerLicense & { variant: { product: { title: string } } },
	reason: string,
): Promise<void> {
	if (!customer.email) return;
	const { subject, html, text } = licenseRevokedTemplate({
		customerName: customer.displayName,
		productTitle: license.variant.product.title,
		reason,
	});
	await sendEmail({ to: customer.email, subject, html, text });
}
