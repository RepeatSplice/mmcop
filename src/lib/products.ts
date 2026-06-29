import type { ProductCategory } from "@prisma/client";
import { prisma } from "./prisma";

export async function listPublishedProducts(category?: ProductCategory) {
	return prisma.product.findMany({
		where: {
			status: { in: ["PUBLISHED", "WAITLIST"] },
			...(category ? { category } : {}),
		},
		include: {
			variants: { where: { active: true }, orderBy: { sortOrder: "asc" } },
		},
		orderBy: { createdAt: "desc" },
	});
}

export async function getProductBySlug(slug: string) {
	return prisma.product.findUnique({
		where: { slug },
		include: {
			variants: { orderBy: { sortOrder: "asc" } },
			files: { where: { isLatest: true } },
			changelog: { orderBy: { createdAt: "desc" }, take: 10 },
		},
	});
}

export async function getProductVariants(productId: string) {
	return prisma.productVariant.findMany({
		where: { productId, active: true },
		orderBy: { sortOrder: "asc" },
	});
}

export async function getLatestProductFiles(productId: string) {
	return prisma.productFile.findMany({
		where: { productId, isLatest: true },
		orderBy: { uploadedAt: "desc" },
	});
}

export async function getProductChangelog(productId: string) {
	return prisma.productChangelog.findMany({
		where: { productId },
		orderBy: { createdAt: "desc" },
	});
}
