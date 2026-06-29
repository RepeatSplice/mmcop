import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { seedJobs, seedNews } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
	for (const post of seedNews) {
		await prisma.newsPost.upsert({
			where: { slug: post.slug },
			create: post,
			update: post,
		});
	}

	for (const job of seedJobs) {
		await prisma.job.upsert({
			where: { slug: job.slug },
			create: { ...job, applicationEmail: job.applicationEmail ?? "careers@monarch-modding.com" },
			update: job,
		});
	}

	const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
	const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
	if (email && password) {
		const existing = await prisma.staffUser.count();
		if (existing === 0) {
			await prisma.staffUser.create({
				data: {
					email: email.toLowerCase(),
					name: "Monarch Admin",
					role: "ADMIN",
					passwordHash: await hashPassword(password),
				},
			});
			console.log(`Bootstrap admin created: ${email}`);
		}
	}

	console.log("Seed complete.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
