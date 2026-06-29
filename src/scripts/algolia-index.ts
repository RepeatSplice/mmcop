/**
 * One-shot script to push all site content into Algolia.
 * Run with: npx tsx src/scripts/algolia-index.ts
 *
 * Requires ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY, ALGOLIA_APP_ID in .env
 */
import "dotenv/config";
import { algoliasearch } from "algoliasearch";
import { PrismaClient } from "@prisma/client";

const SEARCH_INDEX = "monarch";

type AlgoliaRecord = {
	objectID: string;
	title: string;
	excerpt: string;
	href: string;
	type: "page" | "product" | "news" | "job";
	typeLabel: string;
};

const STATIC_PAGES: AlgoliaRecord[] = [
	{ objectID: "page-home", title: "Home", href: "/", excerpt: "Monarch DayZ mods, servers, software, and hosting.", type: "page", typeLabel: "Page" },
	{ objectID: "page-monarch-modding", title: "Monarch Modding", href: "/monarch-modding", excerpt: "Custom DayZ weapons, items, mapping, and mod packs.", type: "page", typeLabel: "Page" },
	{ objectID: "page-operation-monarch", title: "Operation Monarch", href: "/operation-monarch", excerpt: "Community servers, events, and live DayZ worlds.", type: "page", typeLabel: "Page" },
	{ objectID: "page-monarch-software", title: "Monarch Software", href: "/monarch-software", excerpt: "Panels, APIs, bots, and server tooling.", type: "page", typeLabel: "Page" },
	{ objectID: "page-monarch-hosting", title: "Monarch Hosting", href: "/monarch-hosting", excerpt: "Hosting aligned with Monarch stacks and ops.", type: "page", typeLabel: "Page" },
	{ objectID: "page-about", title: "About Monarch", href: "/about-monarch", excerpt: "Who we are and what we build for DayZ communities.", type: "page", typeLabel: "Page" },
	{ objectID: "page-how-we-work", title: "How we work", href: "/how-we-work", excerpt: "From brief to deploy: scope, build, handoff, and support.", type: "page", typeLabel: "Page" },
	{ objectID: "page-partners", title: "Partners", href: "/partners", excerpt: "Studios and communities we work with.", type: "page", typeLabel: "Page" },
	{ objectID: "page-news", title: "News & updates", href: "/news", excerpt: "Announcements across modding, servers, software, and company.", type: "page", typeLabel: "Page" },
	{ objectID: "page-careers", title: "Careers", href: "/careers", excerpt: "Open roles and how to apply at Monarch.", type: "page", typeLabel: "Page" },
	{ objectID: "page-contact", title: "Contact", href: "/contact", excerpt: "Get in touch for commissions, partnerships, or support.", type: "page", typeLabel: "Page" },
	{ objectID: "page-work-with-us", title: "Work with us", href: "/work-with-us", excerpt: "Commissioned content and ongoing partnerships.", type: "page", typeLabel: "Page" },
	{ objectID: "page-shop", title: "Shop", href: "/shop", excerpt: "DayZ mod packs, tools, and digital content from Monarch.", type: "page", typeLabel: "Page" },
	{ objectID: "page-join-om", title: "Join Operation Monarch", href: "/join-operation-monarch", excerpt: "Play on Operation Monarch servers and community.", type: "page", typeLabel: "Page" },
	{ objectID: "page-privacy", title: "Privacy policy", href: "/privacy-policy", excerpt: "How we handle personal data and cookies.", type: "page", typeLabel: "Page" },
	{ objectID: "page-terms", title: "Terms and conditions", href: "/terms-and-conditions", excerpt: "Terms of use for Monarch sites and services.", type: "page", typeLabel: "Page" },
	{ objectID: "page-legal", title: "Legal information", href: "/legal-info", excerpt: "Company and legal disclosures.", type: "page", typeLabel: "Page" },
];

async function main() {
	const appId = process.env.ALGOLIA_APP_ID;
	const adminKey = process.env.ALGOLIA_ADMIN_KEY;

	if (!appId || !adminKey) {
		console.error("Missing ALGOLIA_APP_ID or ALGOLIA_ADMIN_KEY in .env");
		process.exit(1);
	}

	const client = algoliasearch(appId, adminKey);
	const prisma = new PrismaClient();

	const records: AlgoliaRecord[] = [...STATIC_PAGES];

	const [products, newsPosts, jobs] = await Promise.all([
		prisma.product.findMany({
			where: { status: { in: ["PUBLISHED", "WAITLIST"] } },
			select: { id: true, slug: true, title: true, excerpt: true },
		}),
		prisma.newsPost.findMany({
			where: { status: "PUBLISHED" },
			select: { slug: true, title: true, excerpt: true },
		}),
		prisma.job.findMany({
			where: { status: "PUBLISHED" },
			select: { slug: true, title: true, excerpt: true, team: true },
		}),
	]);

	for (const p of products) {
		records.push({
			objectID: `product-${p.id}`,
			title: p.title,
			excerpt: p.excerpt,
			href: `/shop/${p.slug}`,
			type: "product",
			typeLabel: "Product",
		});
	}

	for (const n of newsPosts) {
		records.push({
			objectID: `news-${n.slug}`,
			title: n.title,
			excerpt: n.excerpt,
			href: `/news/${n.slug}`,
			type: "news",
			typeLabel: "News",
		});
	}

	for (const j of jobs) {
		records.push({
			objectID: `job-${j.slug}`,
			title: j.title,
			excerpt: j.excerpt ?? j.team ?? "",
			href: `/careers/${j.slug}`,
			type: "job",
			typeLabel: "Career",
		});
	}

	console.log(`Indexing ${records.length} records into "${SEARCH_INDEX}"...`);

	await client.replaceAllObjects({ indexName: SEARCH_INDEX, objects: records });

	console.log("Done.");
	await prisma.$disconnect();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
