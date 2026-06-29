import type { APIRoute } from "astro";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../../lib/prisma";
import { json } from "../../lib/http";
import { rateLimit } from "../../lib/auth/rate-limit";
import { parseApplyFormConfigFromDb } from "../../lib/jobs-admin";
import { sendEmail } from "../../lib/email/index";
import { applicantAckEmail, staffApplicationEmail } from "../../lib/email/templates/application";

export const prerender = false;

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const POST: APIRoute = async ({ request, clientAddress }) => {
	const ip = clientAddress ?? "unknown";
	if (!rateLimit(`apply:${ip}`, 10, 60_000)) {
		return json({ error: "Too many submissions. Try again shortly." }, 429);
	}

	const form = await request.formData();
	const jobSlug = String(form.get("jobSlug") ?? "").trim();
	const fullName = String(form.get("fullName") ?? "").trim();
	const email = String(form.get("email") ?? "").trim().toLowerCase();
	const coverLetter = String(form.get("coverLetter") ?? "").trim();
	const consent = form.get("consent") === "on" || form.get("consent") === "true";

	if (!jobSlug || !fullName || !email || !consent) {
		return json({ error: "Please complete all required fields and accept the privacy notice." }, 400);
	}

	const job = await prisma.job.findFirst({ where: { slug: jobSlug, status: "PUBLISHED" } });
	if (!job) {
		return json({ error: "This role is no longer accepting applications." }, 404);
	}

	// Duplicate application check
	const existing = await prisma.jobApplication.findFirst({
		where: { jobId: job.id, email },
		select: { id: true },
	});
	if (existing) {
		return json(
			{ error: "You have already applied for this role. Check your email for a confirmation." },
			409
		);
	}

	const cfg = parseApplyFormConfigFromDb(job.applyFormConfig);

	if (cfg.coverLetterRequired && !coverLetter) {
		return json({ error: "Please add a cover letter." }, 400);
	}

	const phone = String(form.get("phone") ?? "").trim();
	const location = String(form.get("location") ?? "").trim();
	const portfolioUrl = String(form.get("portfolioUrl") ?? "").trim();
	const githubUrl = String(form.get("githubUrl") ?? "").trim();
	const discord = String(form.get("discord") ?? "").trim();

	if (cfg.requirePhone && !phone) return json({ error: "Phone is required for this role." }, 400);
	if (cfg.requireLocation && !location) return json({ error: "Location is required for this role." }, 400);
	if (cfg.requirePortfolio && !portfolioUrl) return json({ error: "Portfolio URL is required for this role." }, 400);
	if (cfg.requireGithub && !githubUrl) return json({ error: "GitHub URL is required for this role." }, 400);
	if (cfg.requireDiscord && !discord) return json({ error: "Discord is required for this role." }, 400);

	const resume = form.get("resume");
	let fileMeta: { filename: string; storagePath: string; mimeType: string; sizeBytes: number } | null = null;

	if (resume && resume instanceof File && resume.size > 0) {
		if (resume.size > MAX_BYTES) {
			return json({ error: "CV must be 5 MB or smaller." }, 400);
		}
		if (!ALLOWED_TYPES.has(resume.type)) {
			return json({ error: "CV must be PDF or Word document." }, 400);
		}
		const safeName = resume.name.replace(/[^a-zA-Z0-9._-]/g, "_");
		const relDir = path.join("data", "uploads", "applications");
		await mkdir(relDir, { recursive: true });
		const storagePath = path.join(relDir, `${Date.now()}-${safeName}`);
		const buffer = Buffer.from(await resume.arrayBuffer());
		await writeFile(storagePath, buffer);
		fileMeta = {
			filename: safeName,
			storagePath,
			mimeType: resume.type,
			sizeBytes: resume.size,
		};
	} else if (cfg.requireResume) {
		return json({ error: "CV is required for this role." }, 400);
	}

	const application = await prisma.jobApplication.create({
		data: {
			jobId: job.id,
			fullName,
			email,
			phone: phone || null,
			location: location || null,
			portfolioUrl: portfolioUrl || null,
			githubUrl: githubUrl || null,
			discord: discord || null,
			coverLetter: coverLetter || "",
			files: fileMeta ? { create: fileMeta } : undefined,
		},
	});

	// Fire-and-forget emails — don't block the response
	const emailData = {
		id: application.id,
		fullName,
		email,
		jobTitle: job.title,
		jobSlug: job.slug,
		phone: phone || null,
		location: location || null,
		portfolioUrl: portfolioUrl || null,
		githubUrl: githubUrl || null,
		discord: discord || null,
		coverLetter: coverLetter || null,
	};

	void sendEmail({ to: email, ...applicantAckEmail(emailData) });

	if (job.applicationEmail) {
		void sendEmail({ to: job.applicationEmail, ...staffApplicationEmail(emailData) });
	}

	return json({ ok: true, id: application.id });
};
