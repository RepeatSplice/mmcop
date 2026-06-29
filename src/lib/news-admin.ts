import type { NewsCategory } from "./news";

export type NewsStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type NewsCtaButton = {
	label: string;
	href: string;
	external?: boolean;
	style?: "primary" | "secondary";
};

export type NewsFormData = {
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

const CATEGORIES: NewsCategory[] = ["modding", "servers", "software", "company"];
const STATUSES: NewsStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export const newsAssetPicker = [
	"/Banner AR50.png",
	"/Banner Vyse Drip.png",
	"/Banne Vyse Gun.png",
	"/Operation Monarch Logo.png",
	"/Monarch Modding.png",
	"/Vyse Logo.png",
	"/VYKIX Logo.png",
] as const;

export function slugifyTitle(title: string): string {
	const date = new Date().toISOString().slice(0, 10);
	const base = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 60);
	return `${date}-${base || "post"}`;
}

export function parseCtaButtons(form: FormData): NewsCtaButton[] {
	const buttons: NewsCtaButton[] = [];
	for (let i = 0; i < 3; i++) {
		const label = String(form.get(`ctaLabel${i}`) ?? "").trim();
		const href = String(form.get(`ctaHref${i}`) ?? "").trim();
		if (!label || !href) continue;
		buttons.push({
			label,
			href,
			external: form.get(`ctaExternal${i}`) === "on",
			style: i === 0 ? "primary" : "secondary",
		});
	}
	return buttons;
}

export function parseNewsForm(form: FormData): NewsFormData | { error: string } {
	const slug = String(form.get("slug") ?? "").trim();
	const title = String(form.get("title") ?? "").trim();
	const excerpt = String(form.get("excerpt") ?? "").trim();
	const body = String(form.get("body") ?? "").trim();
	const category = String(form.get("category") ?? "company") as NewsCategory;
	const status = String(form.get("status") ?? "DRAFT") as NewsStatus;
	const publishedRaw = String(form.get("publishedAt") ?? "").trim();

	if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
		return { error: "Slug is required (lowercase letters, numbers, hyphens only)." };
	}
	if (!title) return { error: "Title is required." };
	if (!excerpt) return { error: "Excerpt is required." };
	if (!body) return { error: "Body is required." };
	if (!CATEGORIES.includes(category)) return { error: "Invalid category." };
	if (!STATUSES.includes(status)) return { error: "Invalid status." };
	if (!publishedRaw) return { error: "Published date is required." };

	const publishedAt = new Date(`${publishedRaw}T12:00:00`);
	if (Number.isNaN(publishedAt.getTime())) {
		return { error: "Invalid published date." };
	}

	return {
		slug,
		title,
		excerpt,
		body,
		category,
		status,
		bannerImageUrl: String(form.get("bannerImageUrl") ?? "").trim() || null,
		heroImageUrl: String(form.get("heroImageUrl") ?? "").trim() || null,
		externalLink: String(form.get("externalLink") ?? "").trim() || null,
		ctaButtons: parseCtaButtons(form),
		publishedAt,
	};
}

export function toDateInputValue(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

export const newsCategoryOptions: { value: NewsCategory; label: string }[] = [
	{ value: "modding", label: "Modding" },
	{ value: "servers", label: "Servers" },
	{ value: "software", label: "Software" },
	{ value: "company", label: "Company" },
];

export const newsStatusOptions: { value: NewsStatus; label: string; description: string }[] = [
	{ value: "DRAFT", label: "Draft", description: "Hidden from the public site" },
	{ value: "PUBLISHED", label: "Published", description: "Live on /news" },
	{ value: "ARCHIVED", label: "Archived", description: "Hidden but kept for records" },
];

export function statusLabel(status: NewsStatus): string {
	return newsStatusOptions.find((s) => s.value === status)?.label ?? status;
}

export function statusBadgeClass(status: NewsStatus): string {
	switch (status) {
		case "DRAFT":
			return "bg-amber-100 text-amber-900";
		case "PUBLISHED":
			return "bg-emerald-100 text-emerald-900";
		case "ARCHIVED":
			return "bg-zinc-200 text-zinc-700";
	}
}

export function parseCtaButtonsFromDb(value: unknown): NewsCtaButton[] {
	if (!Array.isArray(value)) return [];
	return value
		.filter((b): b is Record<string, unknown> => typeof b === "object" && b !== null)
		.map((b) => ({
			label: String(b.label ?? ""),
			href: String(b.href ?? ""),
			external: Boolean(b.external),
			style: (b.style === "secondary" ? "secondary" : "primary") as "primary" | "secondary",
		}))
		.filter((b) => b.label && b.href);
}
