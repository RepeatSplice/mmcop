export function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

export async function readFormJson(request: Request): Promise<Record<string, string>> {
	const contentType = request.headers.get("content-type") ?? "";
	if (contentType.includes("application/json")) {
		return (await request.json()) as Record<string, string>;
	}
	const form = await request.formData();
	const out: Record<string, string> = {};
	for (const [k, v] of form.entries()) {
		if (typeof v === "string") out[k] = v;
	}
	return out;
}
