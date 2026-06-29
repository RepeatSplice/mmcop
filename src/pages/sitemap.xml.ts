import type { APIRoute } from "astro";
import { prisma } from "../lib/prisma";
import { getSiteUrl } from "../lib/env";

export const prerender = false;

const STATIC_PAGES = [
	{ url: "/", priority: "1.0", changefreq: "weekly" },
	{ url: "/about-monarch", priority: "0.8", changefreq: "monthly" },
	{ url: "/how-we-work", priority: "0.7", changefreq: "monthly" },
	{ url: "/monarch-modding", priority: "0.8", changefreq: "monthly" },
	{ url: "/operation-monarch", priority: "0.8", changefreq: "monthly" },
	{ url: "/monarch-software", priority: "0.8", changefreq: "monthly" },
	{ url: "/monarch-hosting", priority: "0.8", changefreq: "monthly" },
	{ url: "/shop", priority: "0.9", changefreq: "weekly" },
	{ url: "/news", priority: "0.8", changefreq: "weekly" },
	{ url: "/careers", priority: "0.7", changefreq: "weekly" },
	{ url: "/partners", priority: "0.6", changefreq: "monthly" },
	{ url: "/contact", priority: "0.7", changefreq: "monthly" },
	{ url: "/work-with-us", priority: "0.6", changefreq: "monthly" },
	{ url: "/join-operation-monarch", priority: "0.6", changefreq: "monthly" },
	{ url: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
	{ url: "/terms-and-conditions", priority: "0.3", changefreq: "yearly" },
	{ url: "/legal-info", priority: "0.3", changefreq: "yearly" },
];

function xmlEscape(str: string): string {
	return str.replace(/&/g, "&amp;").replace(/'/g, "&apos;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const GET: APIRoute = async () => {
	const siteUrl = getSiteUrl();

	// Fetch published news and jobs from the DB
	const [newsPosts, jobs] = await Promise.all([
		prisma.newsPost.findMany({
			where: { status: "PUBLISHED" },
			select: { slug: true, publishedAt: true },
			orderBy: { publishedAt: "desc" },
		}),
		prisma.job.findMany({
			where: { status: "PUBLISHED" },
			select: { slug: true, updatedAt: true },
			orderBy: { title: "asc" },
		}),
	]);

	const urls: string[] = [];

	// Static pages
	for (const page of STATIC_PAGES) {
		urls.push(`  <url>
    <loc>${xmlEscape(siteUrl + page.url)}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
	}

	// Published news articles
	for (const post of newsPosts) {
		urls.push(`  <url>
    <loc>${xmlEscape(`${siteUrl}/news/${post.slug}`)}</loc>
    <lastmod>${post.publishedAt.toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
	}

	// Published job listings
	for (const job of jobs) {
		urls.push(`  <url>
    <loc>${xmlEscape(`${siteUrl}/careers/${job.slug}`)}</loc>
    <lastmod>${job.updatedAt.toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
	}

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

	return new Response(xml, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
};
