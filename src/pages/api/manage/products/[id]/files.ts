import type { APIRoute } from "astro";
import { prisma } from "../../../../../lib/prisma";
import { uploadProductFile } from "../../../../../lib/products-admin";
import { uploadToR2 } from "../../../../../lib/storage";
import { getStaffFromSession, } from "../../../../../lib/auth/session";
import { hasR2 } from "../../../../../lib/env";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, cookies }) => {
	const staff = await getStaffFromSession(cookies);
	if (!staff) {
		return new Response("Unauthorized", { status: 401 });
	}

	if (!hasR2()) {
		return new Response(
			JSON.stringify({ error: "Cloudflare R2 is not configured. Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET to your .env." }),
			{ status: 503, headers: { "Content-Type": "application/json" } },
		);
	}

	const { id } = params;
	if (!id) {
		return new Response(JSON.stringify({ error: "Product id required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const product = await prisma.product.findUnique({ where: { id } });
	if (!product) {
		return new Response(JSON.stringify({ error: "Product not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	const formData = await request.formData();
	const file = formData.get("file") as File | null;
	const label = String(formData.get("label") ?? "").trim();
	const version = String(formData.get("version") ?? "").trim();
	const redirectTo = String(formData.get("_redirect") ?? "").trim() || `/manage/products/${product.slug}`;
	const origin = new URL(request.url).origin;

	if (!file || !label || !version) {
		return Response.redirect(`${origin}${redirectTo}?error=missing-fields`, 303);
	}

	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	const storageKey = `products/${id}/${version}/${file.name}`;

	await uploadToR2(storageKey, buffer, file.type || "application/octet-stream");

	await uploadProductFile(id, {
		label,
		storageKey,
		version,
		sizeBytes: buffer.length,
	});

	// Email active license holders about the update (non-fatal)
	try {
		const activeLicenses = await prisma.serverLicense.findMany({
			where: {
				status: { in: ["ACTIVE", "GRACE"] },
				variant: { productId: id },
			},
			include: { customer: true },
			distinct: ["customerId"],
		});
		const customers = activeLicenses.map((l) => l.customer);
		if (customers.length > 0) {
			const { sendModUpdated } = await import("../../../../../lib/email/shop");
			await sendModUpdated(product, version, label, customers);
		}
	} catch (emailErr) {
		console.error("[file-upload] Email notification error:", emailErr);
	}

	return Response.redirect(`${origin}${redirectTo}?success=file-uploaded`, 303);
};
