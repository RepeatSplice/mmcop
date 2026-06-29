import type { APIRoute } from "astro";
import { readFile } from "node:fs/promises";
import { prisma } from "../../../../lib/prisma";
import { getStaffFromSession } from "../../../../lib/auth/session";

export const prerender = false;

export const GET: APIRoute = async ({ params, cookies }) => {
	const staff = await getStaffFromSession(cookies);
	if (!staff) return new Response("Unauthorized", { status: 401 });

	const file = await prisma.applicationFile.findUnique({
		where: { id: params.id },
	});
	if (!file) return new Response("Not found", { status: 404 });

	const buffer = await readFile(file.storagePath);
	return new Response(buffer, {
		headers: {
			"Content-Type": file.mimeType,
			"Content-Disposition": `attachment; filename="${file.filename}"`,
		},
	});
};
