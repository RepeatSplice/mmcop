import { prisma } from "./prisma";
import { parseApplyFormConfigFromDb, type ApplyFormConfig } from "./jobs-admin";

export type JobStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type JobListItem = {
	id: string;
	slug: string;
	title: string;
	team: string;
	workType: string;
	excerpt: string;
	href: string;
};

export type JobRecord = {
	id: string;
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

function mapJob(row: {
	id: string;
	slug: string;
	title: string;
	team: string;
	workType: string;
	excerpt: string;
	body: string;
	applicationEmail: string;
	status: JobStatus;
	applyFormConfig: unknown;
}): JobRecord {
	return {
		...row,
		applyFormConfig: parseApplyFormConfigFromDb(row.applyFormConfig),
	};
}

export async function listPublishedJobs(): Promise<JobListItem[]> {
	const jobs = await prisma.job.findMany({
		where: { status: "PUBLISHED" },
		orderBy: { title: "asc" },
	});

	return jobs.map((job) => ({
		id: job.id,
		slug: job.slug,
		title: job.title,
		team: job.team,
		workType: job.workType,
		excerpt: job.excerpt,
		href: `/careers/${job.slug}`,
	}));
}

export async function getJobBySlug(slug: string): Promise<JobRecord | null> {
	const job = await prisma.job.findFirst({
		where: { slug, status: "PUBLISHED" },
	});
	return job ? mapJob(job) : null;
}

export async function getJobBySlugAdmin(slug: string): Promise<JobRecord | null> {
	const job = await prisma.job.findUnique({ where: { slug } });
	return job ? mapJob(job) : null;
}
