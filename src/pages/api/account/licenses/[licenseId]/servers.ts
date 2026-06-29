import type { APIRoute } from "astro";
import { prisma } from "../../../../../lib/prisma";
import { getCustomerFromSession } from "../../../../../lib/customer-auth/session";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, cookies }) => {
	const customer = await getCustomerFromSession(cookies);
	if (!customer) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const { licenseId } = params;
	if (!licenseId) {
		return new Response(JSON.stringify({ error: "licenseId required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const license = await prisma.serverLicense.findUnique({
		where: { id: licenseId },
		include: { servers: true },
	});

	if (!license || license.customerId !== customer.id) {
		return new Response(JSON.stringify({ error: "Not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	if (license.status !== "ACTIVE") {
		return new Response(JSON.stringify({ error: "License is not active" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const body = (await request.json()) as {
		ipAddress?: string;
		label?: string;
		isTestServer?: boolean;
	};
	const { ipAddress, label, isTestServer = false } = body;

	if (!ipAddress) {
		return new Response(JSON.stringify({ error: "ipAddress required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	// Check server limit (test servers don't count)
	if (!isTestServer && license.maxServers !== null) {
		const realCount = license.servers.filter((s) => !s.isTestServer).length;
		if (realCount >= license.maxServers) {
			return new Response(JSON.stringify({ error: "Server limit reached" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}
	}

	const server = await prisma.registeredServer.upsert({
		where: { licenseId_ipAddress: { licenseId, ipAddress } },
		create: { licenseId, ipAddress, label: label ?? null, isTestServer },
		update: { label: label ?? null, isTestServer },
	});

	return new Response(JSON.stringify(server), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
	const customer = await getCustomerFromSession(cookies);
	if (!customer) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const { licenseId } = params;
	if (!licenseId) {
		return new Response(JSON.stringify({ error: "licenseId required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const body = (await request.json()) as { serverId?: string };
	const { serverId } = body;

	if (!serverId) {
		return new Response(JSON.stringify({ error: "serverId required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const server = await prisma.registeredServer.findUnique({
		where: { id: serverId },
		include: { license: true },
	});

	if (!server || server.license.customerId !== customer.id || server.licenseId !== licenseId) {
		return new Response(JSON.stringify({ error: "Not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	await prisma.registeredServer.delete({ where: { id: serverId } });

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
