import type { APIRoute } from "astro";
import { prisma } from "../../../../lib/prisma";
import { getStaffFromSession } from "../../../../lib/auth/session";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, cookies }) => {
	const staff = await getStaffFromSession(cookies);
	if (!staff) {
		return new Response("Unauthorized", { status: 401 });
	}

	const reviewId = params.id;
	if (!reviewId) return new Response("Bad request", { status: 400 });

	const form = await request.formData();
	const action = String(form.get("_action") ?? "");
	const returnStatus = form.get("_returnStatus") ?? "PENDING";

	const redirect = `redirect:/manage/reviews?status=${returnStatus}`;

	if (action === "delete") {
		await prisma.productReview.delete({ where: { id: reviewId } });
	} else {
		const statusMap: Record<string, "APPROVED" | "REJECTED" | "PENDING"> = {
			approve: "APPROVED",
			reject: "REJECTED",
			pending: "PENDING",
		};
		const newStatus = statusMap[action];
		if (!newStatus) return new Response("Invalid action", { status: 400 });

		await prisma.productReview.update({
			where: { id: reviewId },
			data: { status: newStatus },
		});
	}

	return new Response(null, {
		status: 302,
		headers: { Location: `/manage/reviews?status=${returnStatus}` },
	});
};
