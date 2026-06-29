export type ContactTopic = "general" | "partnership" | "modding" | "servers" | "software" | "other";
export type ContactEnquiryStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "SPAM";
export type EmailDeliveryStatus = "PENDING" | "SENT" | "SKIPPED" | "FAILED";

export const contactTopicOptions: { value: ContactTopic; label: string }[] = [
	{ value: "general", label: "General enquiry" },
	{ value: "partnership", label: "Partnership / commissioning" },
	{ value: "modding", label: "Modding" },
	{ value: "servers", label: "Servers / Operation Monarch" },
	{ value: "software", label: "Software / tools" },
	{ value: "other", label: "Other" },
];

export const enquiryStatusOptions: { value: ContactEnquiryStatus; label: string }[] = [
	{ value: "NEW", label: "New" },
	{ value: "IN_PROGRESS", label: "In progress" },
	{ value: "RESOLVED", label: "Resolved" },
	{ value: "SPAM", label: "Spam" },
];

export function contactTopicLabel(topic: ContactTopic): string {
	return contactTopicOptions.find((t) => t.value === topic)?.label ?? topic;
}

export function enquiryStatusLabel(status: ContactEnquiryStatus): string {
	return enquiryStatusOptions.find((s) => s.value === status)?.label ?? status;
}

export function enquiryStatusBadgeClass(status: ContactEnquiryStatus): string {
	switch (status) {
		case "NEW":
			return "bg-emerald-100 text-emerald-900";
		case "IN_PROGRESS":
			return "bg-blue-100 text-blue-900";
		case "RESOLVED":
			return "bg-zinc-200 text-zinc-700";
		case "SPAM":
			return "bg-red-100 text-red-800";
	}
}

export function emailDeliveryBadgeClass(status: EmailDeliveryStatus): string {
	switch (status) {
		case "SENT":
			return "bg-emerald-100 text-emerald-900";
		case "SKIPPED":
			return "bg-amber-100 text-amber-900";
		case "FAILED":
			return "bg-red-100 text-red-800";
		default:
			return "bg-zinc-100 text-zinc-700";
	}
}

export function emailDeliveryLabel(status: EmailDeliveryStatus): string {
	switch (status) {
		case "SENT":
			return "Sent";
		case "SKIPPED":
			return "Skipped (no API key)";
		case "FAILED":
			return "Failed";
		default:
			return "Pending";
	}
}

const TOPICS: ContactTopic[] = ["general", "partnership", "modding", "servers", "software", "other"];
const STATUSES: ContactEnquiryStatus[] = ["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"];

export function parseContactForm(form: FormData): {
	fullName: string;
	email: string;
	phone: string | null;
	company: string | null;
	topic: ContactTopic;
	message: string;
} | { error: string } {
	if (String(form.get("website") ?? "").trim()) {
		return { error: "Submission rejected." };
	}

	const fullName = String(form.get("fullName") ?? "").trim();
	const email = String(form.get("email") ?? "").trim().toLowerCase();
	const topic = String(form.get("topic") ?? "general") as ContactTopic;
	const message = String(form.get("message") ?? "").trim();
	const consent = form.get("consent") === "on";

	if (!fullName) return { error: "Please enter your name." };
	if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email." };
	if (!TOPICS.includes(topic)) return { error: "Please select a topic." };
	if (message.length < 10) return { error: "Please enter a message (at least 10 characters)." };
	if (!consent) return { error: "Please accept the privacy notice." };

	return {
		fullName,
		email,
		phone: String(form.get("phone") ?? "").trim() || null,
		company: String(form.get("company") ?? "").trim() || null,
		topic,
		message,
	};
}
