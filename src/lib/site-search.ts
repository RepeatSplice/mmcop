import { prisma } from "./prisma";
import { getCategoryLabel, type NewsCategory } from "./news";
import { hasAlgolia, getAlgoliaAppId, getAlgoliaSearchKey } from "./env";
import { SEARCH_INDEX, type AlgoliaRecord } from "./algolia";

export type SiteSearchResultType = "page" | "news" | "job" | "product";

export type SiteSearchResult = {
	title: string;
	href: string;
	excerpt: string;
	type: SiteSearchResultType;
	typeLabel: string;
};

// ---------------------------------------------------------------------------
// Algolia path
// ---------------------------------------------------------------------------

async function searchViaAlgolia(query: string): Promise<SiteSearchResult[]> {
	const { algoliasearch } = await import("algoliasearch");
	const client = algoliasearch(getAlgoliaAppId(), getAlgoliaSearchKey());
	const { results } = await client.search<AlgoliaRecord>({
		requests: [{ indexName: SEARCH_INDEX, query, hitsPerPage: 20 }],
	});
	const hits = (results[0] as { hits?: AlgoliaRecord[] }).hits ?? [];
	return hits.map((h) => ({
		title: h.title,
		href: h.href,
		excerpt: h.excerpt,
		type: h.type as SiteSearchResultType,
		typeLabel: h.typeLabel,
	}));
}

// ---------------------------------------------------------------------------
// In-process fallback (used when Algolia env vars are not set)
// ---------------------------------------------------------------------------

type StaticPage = {
	title: string;
	href: string;
	excerpt: string;
	keywords?: string;
};

const STATIC_SITE_PAGES: StaticPage[] = [
	{ title: "Home", href: "/", excerpt: "Monarch DayZ mods, servers, software, and hosting.", keywords: "monarch dayz" },
	{ title: "Monarch Modding", href: "/monarch-modding", excerpt: "Custom DayZ weapons, items, mapping, and mod packs." },
	{ title: "Operation Monarch", href: "/operation-monarch", excerpt: "Community servers, events, and live DayZ worlds." },
	{ title: "Monarch Software", href: "/monarch-software", excerpt: "Panels, APIs, bots, and server tooling." },
	{ title: "Monarch Hosting", href: "/monarch-hosting", excerpt: "Hosting aligned with Monarch stacks and ops." },
	{ title: "About Monarch", href: "/about-monarch", excerpt: "Who we are and what we build for DayZ communities." },
	{ title: "How we work", href: "/how-we-work", excerpt: "From brief to deploy: scope, build, handoff, and support." },
	{ title: "Partners", href: "/partners", excerpt: "Studios and communities we work with." },
	{ title: "News & updates", href: "/news", excerpt: "Announcements across modding, servers, software, and company." },
	{ title: "Careers", href: "/careers", excerpt: "Open roles and how to apply at Monarch." },
	{ title: "Contact", href: "/contact", excerpt: "Get in touch for commissions, partnerships, or support." },
	{ title: "Work with us", href: "/work-with-us", excerpt: "Commissioned content and ongoing partnerships." },
	{ title: "Join Operation Monarch", href: "/join-operation-monarch", excerpt: "Play on Operation Monarch servers and community." },
	{ title: "Privacy policy", href: "/privacy-policy", excerpt: "How we handle personal data and cookies." },
	{ title: "Terms and conditions", href: "/terms-and-conditions", excerpt: "Terms of use for Monarch sites and services." },
	{ title: "Legal information", href: "/legal-info", excerpt: "Company and legal disclosures." },
];

function haystack(...parts: (string | null | undefined)[]): string {
	return parts.filter(Boolean).join(" ").toLowerCase();
}

function scoreMatch(q: string, ...parts: (string | null | undefined)[]): number {
	const text = haystack(...parts);
	if (!text.includes(q)) return 0;
	let score = 1;
	const title = (parts[0] ?? "").toLowerCase();
	if (title.startsWith(q)) score += 4;
	else if (title.includes(q)) score += 2;
	if (text.indexOf(q) === 0) score += 1;
	return score;
}

async function searchInProcess(rawQuery: string): Promise<SiteSearchResult[]> {
	const q = rawQuery.trim().toLowerCase();
	if (q.length < 2) return [];

	const ranked: (SiteSearchResult & { score: number })[] = [];

	for (const page of STATIC_SITE_PAGES) {
		const score = scoreMatch(q, page.title, page.excerpt, page.keywords);
		if (score > 0) {
			ranked.push({ title: page.title, href: page.href, excerpt: page.excerpt, type: "page", typeLabel: "Page", score });
		}
	}

	try {
		const [newsPosts, jobs] = await Promise.all([
			prisma.newsPost.findMany({
				where: { status: "PUBLISHED" },
				select: { slug: true, title: true, excerpt: true, category: true },
				orderBy: { publishedAt: "desc" },
				take: 50,
			}),
			prisma.job.findMany({
				where: { status: "PUBLISHED" },
				select: { slug: true, title: true, excerpt: true, team: true, workType: true },
				orderBy: { title: "asc" },
				take: 50,
			}),
		]);

		for (const post of newsPosts) {
			const score = scoreMatch(q, post.title, post.excerpt, getCategoryLabel(post.category as NewsCategory));
			if (score > 0) {
				ranked.push({ title: post.title, href: `/news/${post.slug}`, excerpt: post.excerpt, type: "news", typeLabel: "News", score });
			}
		}

		for (const job of jobs) {
			const score = scoreMatch(q, job.title, job.excerpt, job.team, job.workType);
			if (score > 0) {
				ranked.push({ title: job.title, href: `/careers/${job.slug}`, excerpt: job.excerpt || `${job.team} · ${job.workType}`, type: "job", typeLabel: "Career", score });
			}
		}
	} catch {
		// DB unavailable; static pages still work
	}

	return ranked
		.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
		.slice(0, 20)
		.map(({ score: _score, ...result }) => result);
}

// ---------------------------------------------------------------------------
// Public API — auto-selects provider
// ---------------------------------------------------------------------------

export async function searchSite(rawQuery: string): Promise<SiteSearchResult[]> {
	const q = rawQuery.trim();
	if (q.length < 2) return [];
	if (hasAlgolia()) {
		try {
			return await searchViaAlgolia(q);
		} catch {
			// Fall through to in-process search if Algolia call fails
		}
	}
	return searchInProcess(q);
}
