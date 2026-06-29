import { prisma } from "./prisma";
import { parseCtaButtonsFromDb, type NewsCtaButton } from "./news-admin";

/** Matches `NewsCategory` in `prisma/schema.prisma` */
export type NewsCategory = "modding" | "servers" | "software" | "company";

export type NewsStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type NewsListItem = {
	slug: string;
	date: string;
	title: string;
	href: string;
	excerpt: string;
	category: NewsCategory;
	external: boolean;
};

type NewsPostSummary = {
	slug: string;
	title: string;
	excerpt: string;
	category: NewsCategory;
	publishedAt: Date;
	externalLink: string | null;
};

export type NewsPostRecord = {
	slug: string;
	title: string;
	excerpt: string;
	body: string;
	category: NewsCategory;
	status: NewsStatus;
	bannerImageUrl: string | null;
	heroImageUrl: string | null;
	externalLink: string | null;
	ctaButtons: NewsCtaButton[];
	publishedAt: Date;
};

const categoryLabels: Record<NewsCategory, string> = {
	modding: "Modding",
	servers: "Servers",
	software: "Software",
	company: "Company",
};

export function getCategoryLabel(category: NewsCategory): string {
	return categoryLabels[category];
}

function formatNewsDate(date: Date): string {
	const month = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(date);
	return `${month} ${date.getDate()}`;
}

export function formatLongDate(date: Date): string {
	return new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(date);
}

function mapPostRecord(row: {
	slug: string;
	title: string;
	excerpt: string;
	body: string;
	category: NewsCategory;
	status: NewsStatus;
	bannerImageUrl: string | null;
	heroImageUrl: string | null;
	externalLink: string | null;
	ctaButtons: unknown;
	publishedAt: Date;
}): NewsPostRecord {
	return {
		...row,
		ctaButtons: parseCtaButtonsFromDb(row.ctaButtons),
	};
}

export async function listPublishedNews(): Promise<NewsListItem[]> {
	const posts: NewsPostSummary[] = await prisma.newsPost.findMany({
		where: { status: "PUBLISHED" },
		orderBy: { publishedAt: "desc" },
		select: {
			slug: true,
			title: true,
			excerpt: true,
			category: true,
			publishedAt: true,
			externalLink: true,
		},
	});

	return posts.map((post) => ({
		slug: post.slug,
		date: formatNewsDate(post.publishedAt),
		title: post.title,
		excerpt: post.excerpt,
		href: `/news/${post.slug}`,
		category: post.category,
		external: Boolean(post.externalLink),
	}));
}

export async function getNewsBySlug(slug: string): Promise<NewsPostRecord | null> {
	const post = await prisma.newsPost.findFirst({
		where: { slug, status: "PUBLISHED" },
	});
	return post ? mapPostRecord(post) : null;
}

export async function getNewsBySlugAdmin(slug: string) {
	const post = await prisma.newsPost.findUnique({ where: { slug } });
	return post ? mapPostRecord(post) : null;
}
