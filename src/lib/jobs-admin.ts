export type JobStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ApplyFormConfig = {
	intro: string;
	coverLetterLabel: string;
	coverLetterPlaceholder: string;
	coverLetterRequired: boolean;
	showPhone: boolean;
	requirePhone: boolean;
	showLocation: boolean;
	requireLocation: boolean;
	showPortfolio: boolean;
	requirePortfolio: boolean;
	showGithub: boolean;
	requireGithub: boolean;
	showDiscord: boolean;
	requireDiscord: boolean;
	showResume: boolean;
	requireResume: boolean;
	consentText: string;
	submitLabel: string;
	successTitle: string;
	successMessage: string;
};

export const defaultApplyFormConfig: ApplyFormConfig = {
	intro: "Submit your application below. We review every application and reply by email.",
	coverLetterLabel: "Cover letter",
	coverLetterPlaceholder: "Tell us why you are a fit for this role and what you have shipped in DayZ or similar projects.",
	coverLetterRequired: true,
	showPhone: true,
	requirePhone: false,
	showLocation: true,
	requireLocation: false,
	showPortfolio: true,
	requirePortfolio: false,
	showGithub: true,
	requireGithub: false,
	showDiscord: true,
	requireDiscord: false,
	showResume: true,
	requireResume: false,
	consentText:
		"I agree that Monarch may store and process my application data to evaluate this role. See our privacy policy at /privacy-policy.",
	submitLabel: "Submit application",
	successTitle: "Application received",
	successMessage: "Thank you. We have saved your application and will be in touch by email if we move forward.",
};

export type JobFormData = {
	slug: string;
	title: string;
	team: string;
	workType: string;
	excerpt: string;
	body: string;
	applicationEmail: string;
	status: JobStatus;
	applyFormConfig: ApplyFormConfig;
};

const STATUSES: JobStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export function slugifyJobTitle(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 80);
}

export function parseApplyFormConfigForm(form: FormData): ApplyFormConfig {
	return {
		intro: String(form.get("applyIntro") ?? "").trim() || defaultApplyFormConfig.intro,
		coverLetterLabel: String(form.get("coverLetterLabel") ?? "").trim() || defaultApplyFormConfig.coverLetterLabel,
		coverLetterPlaceholder: String(form.get("coverLetterPlaceholder") ?? "").trim() || defaultApplyFormConfig.coverLetterPlaceholder,
		coverLetterRequired: form.get("coverLetterRequired") === "on",
		showPhone: form.get("showPhone") === "on",
		requirePhone: form.get("requirePhone") === "on",
		showLocation: form.get("showLocation") === "on",
		requireLocation: form.get("requireLocation") === "on",
		showPortfolio: form.get("showPortfolio") === "on",
		requirePortfolio: form.get("requirePortfolio") === "on",
		showGithub: form.get("showGithub") === "on",
		requireGithub: form.get("requireGithub") === "on",
		showDiscord: form.get("showDiscord") === "on",
		requireDiscord: form.get("requireDiscord") === "on",
		showResume: form.get("showResume") === "on",
		requireResume: form.get("requireResume") === "on",
		consentText: String(form.get("consentText") ?? "").trim() || defaultApplyFormConfig.consentText,
		submitLabel: String(form.get("submitLabel") ?? "").trim() || defaultApplyFormConfig.submitLabel,
		successTitle: String(form.get("successTitle") ?? "").trim() || defaultApplyFormConfig.successTitle,
		successMessage: String(form.get("successMessage") ?? "").trim() || defaultApplyFormConfig.successMessage,
	};
}

export function parseJobForm(form: FormData): JobFormData | { error: string } {
	const slug = String(form.get("slug") ?? "").trim();
	const title = String(form.get("title") ?? "").trim();
	const team = String(form.get("team") ?? "").trim();
	const workType = String(form.get("workType") ?? "").trim();
	const excerpt = String(form.get("excerpt") ?? "").trim();
	const body = String(form.get("body") ?? "").trim();
	const applicationEmail = String(form.get("applicationEmail") ?? "").trim();
	const status = String(form.get("status") ?? "DRAFT") as JobStatus;

	if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
		return { error: "Slug is required (lowercase letters, numbers, hyphens only)." };
	}
	if (!title) return { error: "Title is required." };
	if (!team) return { error: "Team is required." };
	if (!workType) return { error: "Work type is required." };
	if (!excerpt) return { error: "Excerpt is required." };
	if (!body) return { error: "Role description is required." };
	if (!STATUSES.includes(status)) return { error: "Invalid status." };

	return {
		slug,
		title,
		team,
		workType,
		excerpt,
		body,
		applicationEmail: applicationEmail || "careers@monarch-modding.com",
		status,
		applyFormConfig: parseApplyFormConfigForm(form),
	};
}

export function parseApplyFormConfigFromDb(value: unknown): ApplyFormConfig {
	if (!value || typeof value !== "object") return { ...defaultApplyFormConfig };
	const v = value as Record<string, unknown>;
	return {
		...defaultApplyFormConfig,
		...(typeof v.intro === "string" && { intro: v.intro }),
		...(typeof v.coverLetterLabel === "string" && { coverLetterLabel: v.coverLetterLabel }),
		...(typeof v.coverLetterPlaceholder === "string" && { coverLetterPlaceholder: v.coverLetterPlaceholder }),
		...(typeof v.coverLetterRequired === "boolean" && { coverLetterRequired: v.coverLetterRequired }),
		...(typeof v.showPhone === "boolean" && { showPhone: v.showPhone }),
		...(typeof v.requirePhone === "boolean" && { requirePhone: v.requirePhone }),
		...(typeof v.showLocation === "boolean" && { showLocation: v.showLocation }),
		...(typeof v.requireLocation === "boolean" && { requireLocation: v.requireLocation }),
		...(typeof v.showPortfolio === "boolean" && { showPortfolio: v.showPortfolio }),
		...(typeof v.requirePortfolio === "boolean" && { requirePortfolio: v.requirePortfolio }),
		...(typeof v.showGithub === "boolean" && { showGithub: v.showGithub }),
		...(typeof v.requireGithub === "boolean" && { requireGithub: v.requireGithub }),
		...(typeof v.showDiscord === "boolean" && { showDiscord: v.showDiscord }),
		...(typeof v.requireDiscord === "boolean" && { requireDiscord: v.requireDiscord }),
		...(typeof v.showResume === "boolean" && { showResume: v.showResume }),
		...(typeof v.requireResume === "boolean" && { requireResume: v.requireResume }),
		...(typeof v.consentText === "string" && { consentText: v.consentText }),
		...(typeof v.submitLabel === "string" && { submitLabel: v.submitLabel }),
		...(typeof v.successTitle === "string" && { successTitle: v.successTitle }),
		...(typeof v.successMessage === "string" && { successMessage: v.successMessage }),
	};
}

export const jobStatusOptions: { value: JobStatus; label: string; description: string }[] = [
	{ value: "DRAFT", label: "Draft", description: "Hidden from careers pages" },
	{ value: "PUBLISHED", label: "Published", description: "Live on /careers" },
	{ value: "ARCHIVED", label: "Archived", description: "Hidden but kept for records" },
];

export function jobStatusLabel(status: JobStatus): string {
	return jobStatusOptions.find((s) => s.value === status)?.label ?? status;
}

export function jobStatusBadgeClass(status: JobStatus): string {
	switch (status) {
		case "DRAFT":
			return "bg-amber-100 text-amber-900";
		case "PUBLISHED":
			return "bg-emerald-100 text-emerald-900";
		case "ARCHIVED":
			return "bg-zinc-200 text-zinc-700";
	}
}
