import type { APIRoute } from "astro";
import { prisma } from "../../../../lib/prisma";
import { getStaffFromSession } from "../../../../lib/auth/session";
import { json } from "../../../../lib/http";

export const prerender = false;

const STATUSES = ["NEW", "REVIEWED", "SHORTLISTED", "REJECTED"] as const;

export const GET: APIRoute = async ({ params, cookies }) => {
	const staff = await getStaffFromSession(cookies);
	if (!staff) return json({ error: "Unauthorized" }, 401);

	const app = await prisma.jobApplication.findUnique({
		where: { id: params.id },
		include: { job: true, files: true },
	});
	if (!app) return json({ error: "Not found" }, 404);
	return json({ application: app });
};

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
	const staff = await getStaffFromSession(cookies);
	if (!staff) return json({ error: "Unauthorized" }, 401);

	const body = await request.json().catch(() => null);
	const status = body?.status;
	if (!STATUSES.includes(status)) {
		return json({ error: "Invalid status" }, 400);
	}

	const app = await prisma.jobApplication.update({
		where: { id: params.id },
		data: { status },
	});
	return json({ application: app });
};
