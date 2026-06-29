import type { ProductCategory, ProductStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { getStripeSecretKey } from "./env";
import Stripe from "stripe";

type CreateProductData = {
	slug: string;
	title: string;
	excerpt: string;
	body: string;
	category: ProductCategory;
	imageUrl?: string;
	previewImages?: string;
	status?: ProductStatus;
};

type UpdateProductData = Partial<CreateProductData>;

type CreateVariantData = {
	name: string;
	description?: string;
	priceUsd: number;
	maxServers?: number;
	sortOrder?: number;
};

type UpdateVariantData = Partial<CreateVariantData> & { active?: boolean; stripePriceId?: string };

type UploadFileData = {
	label: string;
	storageKey: string;
	version: string;
	sizeBytes: number;
};

export async function createProduct(data: CreateProductData) {
	return prisma.product.create({ data });
}

export async function updateProduct(id: string, data: UpdateProductData) {
	return prisma.product.update({ where: { id }, data });
}

export async function archiveProduct(id: string) {
	return prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
}

export async function createVariant(productId: string, data: CreateVariantData) {
	return prisma.productVariant.create({ data: { productId, ...data } });
}

export async function updateVariant(id: string, data: UpdateVariantData) {
	return prisma.productVariant.update({ where: { id }, data });
}

export async function uploadProductFile(productId: string, data: UploadFileData) {
	// Set all previous files for this product to not latest
	await prisma.productFile.updateMany({
		where: { productId, isLatest: true },
		data: { isLatest: false },
	});
	return prisma.productFile.create({ data: { productId, ...data, isLatest: true } });
}

export async function addChangelogEntry(productId: string, version: string, notes: string) {
	return prisma.productChangelog.create({ data: { productId, version, notes } });
}

export async function syncStripePrice(variantId: string): Promise<string> {
	const variant = await prisma.productVariant.findUnique({
		where: { id: variantId },
		include: { product: true },
	});
	if (!variant) throw new Error("Variant not found");

	if (variant.stripePriceId) return variant.stripePriceId;

	const stripe = new Stripe(getStripeSecretKey());

	const product = await stripe.products.create({
		name: `${variant.product.title} - ${variant.name}`,
		metadata: { productId: variant.productId, variantId },
	});

	const price = await stripe.prices.create({
		product: product.id,
		unit_amount: variant.priceUsd,
		currency: "gbp",
		metadata: { variantId },
	});

	await prisma.productVariant.update({
		where: { id: variantId },
		data: { stripePriceId: price.id },
	});

	return price.id;
}

export function statusBadgeClass(status: ProductStatus): string {
	const map: Record<ProductStatus, string> = {
		PUBLISHED: "bg-green-100 text-green-800",
		DRAFT: "bg-zinc-100 text-zinc-700",
		ARCHIVED: "bg-zinc-200 text-zinc-500",
		WAITLIST: "bg-yellow-100 text-yellow-800",
	};
	return map[status];
}

export function statusLabel(status: ProductStatus): string {
	const map: Record<ProductStatus, string> = {
		PUBLISHED: "Published",
		DRAFT: "Draft",
		ARCHIVED: "Archived",
		WAITLIST: "Waitlist",
	};
	return map[status];
}

export function categoryLabel(category: ProductCategory): string {
	const map: Record<ProductCategory, string> = {
		modding: "Modding",
		software: "Software",
		hosting: "Hosting",
		bundle: "Bundle",
		other: "Other",
	};
	return map[category];
}
