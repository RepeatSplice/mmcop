import type { APIRoute } from "astro";
import { getStaffFromSession } from "../../../lib/auth/session";
import { json } from "../../../lib/http";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
	const staff = await getStaffFromSession(cookies);
	if (!staff) {
		return json({ error: "Unauthorized" }, 401);
	}
	return json({ staff });
};
