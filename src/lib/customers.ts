import type { Customer, OAuthProvider } from "@prisma/client";
import { prisma } from "./prisma";

export async function upsertCustomerFromOAuth(
	provider: OAuthProvider,
	providerId: string,
	data: { username: string; avatarUrl: string; email?: string },
): Promise<Customer> {
	const existing = await prisma.connectedAccount.findUnique({
		where: { provider_providerId: { provider, providerId } },
		include: { customer: true },
	});

	if (existing) {
		// Update the connected account tokens and customer display info
		await prisma.connectedAccount.update({
			where: { id: existing.id },
			data: { username: data.username },
		});
		const customer = await prisma.customer.update({
			where: { id: existing.customerId },
			data: {
				displayName: data.username,
				avatarUrl: data.avatarUrl,
				...(data.email ? { email: data.email } : {}),
			},
		});
		return customer;
	}

	// Create new customer + connected account (onboarding not yet complete)
	const customer = await prisma.customer.create({
		data: {
			displayName: data.username,
			avatarUrl: data.avatarUrl,
			email: data.email ?? null,
			onboardingComplete: false,
			accounts: {
				create: {
					provider,
					providerId,
					username: data.username,
				},
			},
		},
	});

	return customer;
}

export async function linkOAuthToCustomer(
	customerId: string,
	provider: OAuthProvider,
	providerId: string,
	username: string,
): Promise<void> {
	await prisma.connectedAccount.upsert({
		where: { provider_providerId: { provider, providerId } },
		create: { customerId, provider, providerId, username },
		update: { username },
	});
}

export async function getCustomerById(id: string): Promise<Customer | null> {
	return prisma.customer.findUnique({ where: { id } });
}

export async function getCustomerWithDetails(id: string) {
	return prisma.customer.findUnique({
		where: { id },
		include: {
			accounts: true,
			orders: {
				orderBy: { createdAt: "desc" },
				take: 5,
				include: { items: { include: { variant: { include: { product: true } } } } },
			},
			licenses: {
				where: { status: { in: ["ACTIVE", "GRACE"] } },
				include: {
					variant: { include: { product: true } },
					servers: true,
				},
			},
		},
	});
}
