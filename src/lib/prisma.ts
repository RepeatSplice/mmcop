import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
	prisma?: PrismaClient;
};

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log: import.meta.env.DEV ? ["error", "warn"] : ["error"],
	});

if (import.meta.env.DEV) {
	globalForPrisma.prisma = prisma;
}
