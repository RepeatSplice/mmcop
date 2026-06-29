import type { APIRoute } from "astro";
import { prisma } from "../../../../lib/prisma";
import { getCustomerFromSession } from "../../../../lib/customer-auth/session";
import { generateSignedDownloadUrl } from "../../../../lib/storage";
import { hasR2 } from "../../../../lib/env";

export const prerender = false;

export const GET: APIRoute = async ({ params, cookies }) => {
	const customer = await getCustomerFromSession(cookies);
	if (!customer) {
		return new Response(null, { status: 302, headers: { Location: "/account/login" } });
	}

	const { orderItemId } = params;
	if (!orderItemId) {
		return new Response("Not found", { status: 404 });
	}

	const orderItem = await prisma.orderItem.findUnique({
		where: { id: orderItemId },
		include: {
			order: true,
			variant: true,
		},
	});

	if (!orderItem) {
		return new Response("Not found", { status: 404 });
	}

	if (orderItem.order.customerId !== customer.id) {
		return new Response("Forbidden", { status: 403 });
	}

	if (orderItem.order.status !== "PAID") {
		return new Response("Order not paid", { status: 403 });
	}

	const latestFile = await prisma.productFile.findFirst({
		where: { productId: orderItem.variant.productId, isLatest: true },
		orderBy: { uploadedAt: "desc" },
	});

	if (!latestFile) {
		return new Response("No file available", { status: 404 });
	}

	if (!hasR2()) {
		return new Response("File storage is not configured", { status: 503 });
	}

	const signedUrl = await generateSignedDownloadUrl(latestFile.storageKey);

	return new Response(null, {
		status: 302,
		headers: { Location: signedUrl },
	});
};
