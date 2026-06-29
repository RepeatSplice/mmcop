export const seedNews = [
	{
		slug: "2026-03-12-vyse-weapon-line",
		title: "Vyse custom weapon line now available through Monarch Modding",
		excerpt:
			"The Vyse weapon line is live for partner servers, with configs tuned for seasonal wipes and server rulesets.",
		body: `The Vyse custom weapon line is now available through Monarch Modding for partner servers and commissioned packs.

Each platform ships with balancing notes, attachment compatibility, and configuration examples so server owners can drop assets in without rework between wipes.

For commissioning or licensing, visit Monarch Modding or contact us through Work with us.`,
		category: "modding" as const,
		status: "PUBLISHED" as const,
		bannerImageUrl: "/Banner Vyse Drip.png",
		heroImageUrl: "/Banne Vyse Gun.png",
		externalLink: "https://monarch-modding.com",
		ctaButtons: [{ label: "Monarch Modding", href: "https://monarch-modding.com", external: true, style: "primary" }],
		publishedAt: new Date("2026-03-12"),
	},
	{
		slug: "2026-02-28-opm-q1-schedule",
		title: "Operation Monarch publishes Q1 event and wipe schedule",
		excerpt: "Q1 dates for wipes, seasonal events, and community play are published for Operation Monarch servers.",
		body: `Operation Monarch has published the Q1 event and wipe schedule for community servers running Monarch-aligned content.

Players can plan around seasonal resets, weekend events, and mod pack rollouts tied to the wider Monarch release calendar.

Full dates and server listings are on the Operation Monarch site.`,
		category: "servers" as const,
		status: "PUBLISHED" as const,
		bannerImageUrl: "/Banner AR50.png",
		externalLink: "https://play-opm.com",
		publishedAt: new Date("2026-02-28"),
	},
	{
		slug: "2026-02-06-software-stats-beta",
		title: "Monarch Software server stats panel enters closed beta",
		excerpt: "A closed beta for live server stats and player-facing panels is underway with select partner communities.",
		body: `Monarch Software has opened a closed beta for its server stats panel, aimed at communities that want DayZ metrics on the web without custom glue code.

Early partners receive dashboards for population, performance signals, and wipe-aware reporting hooks that tie into existing Monarch hosting workflows.

We are onboarding a small cohort before wider release.`,
		category: "software" as const,
		status: "PUBLISHED" as const,
		bannerImageUrl: "/Operation Monarch Logo.png",
		externalLink: null,
		publishedAt: new Date("2026-02-06"),
	},
	{
		slug: "2026-01-19-hosting-2027",
		title: "Monarch Hosting confirmed for early 2027 as a standalone product",
		excerpt: "Monarch Hosting will launch as a standalone product in early 2027, separate from modding and software services.",
		body: `Monarch Hosting is confirmed for early 2027 as a standalone product for DayZ communities that want infrastructure aligned with Monarch Modding and Monarch Software.

The offering will focus on predictable performance, wipe-friendly operations, and integration with tools already used by Monarch partner servers.`,
		category: "company" as const,
		status: "PUBLISHED" as const,
		bannerImageUrl: "/Monarch Modding.png",
		externalLink: null,
		publishedAt: new Date("2026-01-19"),
	},
	{
		slug: "2025-12-08-ar50-balance",
		title: "AR-50 weapon pack balance pass shipped for partner servers",
		excerpt: "Balance and configuration updates for the AR-50 pack are live for partner servers ahead of the holiday season.",
		body: `A balance pass for the AR-50 weapon pack has shipped to partner servers, with updated damage curves, attachment behaviour, and economy notes for server owners.`,
		category: "modding" as const,
		status: "PUBLISHED" as const,
		bannerImageUrl: "/Banner AR50.png",
		externalLink: "https://monarch-modding.com",
		publishedAt: new Date("2025-12-08"),
	},
	{
		slug: "2025-11-21-opm-guidelines",
		title: "Operation Monarch community guidelines updated for seasonal play",
		excerpt: "Community guidelines are updated for seasonal play, events, and moderation on Operation Monarch servers.",
		body: `Operation Monarch has updated its community guidelines to reflect seasonal play, event weekends, and moderation expectations across partner servers.`,
		category: "servers" as const,
		status: "PUBLISHED" as const,
		bannerImageUrl: "/Operation Monarch Logo.png",
		externalLink: "https://play-opm.com",
		publishedAt: new Date("2025-11-21"),
	},
	{
		slug: "2025-10-14-pbo-workflow",
		title: "Internal PBO authoring workflow tools rolled out to Monarch dev teams",
		excerpt: "Internal tooling for PBO authoring and review is now standard across Monarch Modding and Software teams.",
		body: `Monarch has rolled out internal PBO authoring workflow tools to development teams across Modding and Software.

The tooling standardises packaging, review checkpoints, and handoff to QA before content reaches partner servers or public releases.`,
		category: "software" as const,
		status: "PUBLISHED" as const,
		bannerImageUrl: "/Monarch Modding.png",
		externalLink: null,
		publishedAt: new Date("2025-10-14"),
	},
];

import { defaultApplyFormConfig } from "../src/lib/jobs-admin";

export const seedJobs = [
	{
		slug: "dayz-developer",
		status: "PUBLISHED" as const,
		applyFormConfig: defaultApplyFormConfig,
		title: "DayZ developer",
		team: "Monarch Modding / Software",
		workType: "Remote",
		excerpt: "Build and maintain DayZ mods, configs, and tooling across Monarch Modding and Software pipelines.",
		body: `## About the role

You will work on gameplay systems, mod packaging, and automation that ships to real servers.

## What you will do

- Implement and balance gameplay content with designers and server partners
- Maintain build pipelines and release notes for partner communities
- Debug live issues reported from Operation Monarch and commissioned servers

## How to apply

Use the form on this page. We review applications weekly and reply by email.`,
	},
	{
		slug: "ui-ux-designer",
		status: "PUBLISHED" as const,
		applyFormConfig: defaultApplyFormConfig,
		title: "UI/UX designer",
		team: "Monarch group",
		workType: "Remote",
		excerpt: "Shape web panels, branding, and in-game UI so Monarch services feel cohesive across mods and software.",
		body: `## About the role

You will design interfaces for Monarch Software products, marketing pages, and in-game overlays.

## How to apply

Use the form on this page. Include a portfolio link in your application.`,
	},
	{
		slug: "community-server-operator",
		status: "PUBLISHED" as const,
		applyFormConfig: defaultApplyFormConfig,
		title: "Community & server operator",
		team: "Operation Monarch",
		workType: "Remote",
		excerpt: "Run live Operation Monarch servers, events, and community moderation aligned with Monarch content releases.",
		body: `## About the role

You will operate community servers, plan wipes and events, and keep players informed when Monarch content lands.

## How to apply

Use the form on this page. Tell us which servers or communities you have operated.`,
	},
];
