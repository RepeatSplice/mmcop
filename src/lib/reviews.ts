import { prisma } from "./prisma";
import type { Customer, ProductReview } from "@prisma/client";

export type ReviewWithCustomer = ProductReview & {
	customer: Pick<Customer, "id" | "displayName" | "avatarUrl">;
};

export type ProductRating = {
	average: number;
	count: number;
};

/** Approved reviews for a product, newest first. */
export async function getProductReviews(productId: string): Promise<ReviewWithCustomer[]> {
	return prisma.productReview.findMany({
		where: { productId, status: "APPROVED" },
		include: { customer: { select: { id: true, displayName: true, avatarUrl: true } } },
		orderBy: { createdAt: "desc" },
	});
}

/** Average rating and count of approved reviews for a product. */
export async function getProductRating(productId: string): Promise<ProductRating> {
	const result = await prisma.productReview.aggregate({
		where: { productId, status: "APPROVED" },
		_avg: { rating: true },
		_count: { rating: true },
	});
	return {
		average: result._avg.rating ?? 0,
		count: result._count.rating,
	};
}

/**
 * Top approved reviews across all products for the homepage testimonial strip.
 * Returns 5-star reviews, newest first, up to `limit`.
 */
export async function getStoreReviews(limit = 6): Promise<ReviewWithCustomer[]> {
	return prisma.productReview.findMany({
		where: { status: "APPROVED", rating: 5 },
		include: { customer: { select: { id: true, displayName: true, avatarUrl: true } } },
		orderBy: { createdAt: "desc" },
		take: limit,
	});
}

/** True if the customer has already submitted a review for this product. */
export async function hasCustomerReviewed(customerId: string, productId: string): Promise<boolean> {
	const existing = await prisma.productReview.findUnique({
		where: { productId_customerId: { productId, customerId } },
		select: { id: true },
	});
	return Boolean(existing);
}

/**
 * True if the customer has at least one PAID order containing a variant
 * that belongs to this product. Used to gate review submission.
 */
export async function customerCanReview(customerId: string, productId: string): Promise<boolean> {
	const item = await prisma.orderItem.findFirst({
		where: {
			order: { customerId, status: "PAID" },
			variant: { productId },
		},
		select: { id: true },
	});
	return Boolean(item);
}
