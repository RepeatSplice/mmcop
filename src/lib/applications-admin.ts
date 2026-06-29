export type ApplicationStatus = "NEW" | "REVIEWED" | "SHORTLISTED" | "REJECTED";

export const applicationStatusOptions: { value: ApplicationStatus; label: string }[] = [
	{ value: "NEW", label: "New" },
	{ value: "REVIEWED", label: "Reviewed" },
	{ value: "SHORTLISTED", label: "Shortlisted" },
	{ value: "REJECTED", label: "Rejected" },
];

export function applicationStatusLabel(status: ApplicationStatus): string {
	return applicationStatusOptions.find((s) => s.value === status)?.label ?? status;
}

export function applicationStatusBadgeClass(status: ApplicationStatus): string {
	switch (status) {
		case "NEW":
			return "bg-emerald-100 text-emerald-900";
		case "REVIEWED":
			return "bg-blue-100 text-blue-900";
		case "SHORTLISTED":
			return "bg-violet-100 text-violet-900";
		case "REJECTED":
			return "bg-zinc-200 text-zinc-700";
	}
}
