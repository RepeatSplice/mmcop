import type { TicketStatus } from "@prisma/client"

/**
 * Two ticket "lanes":
 *  - workflow: standard sprint flow (retainer work).
 *  - billing: gated path that requires staff/payment action (PayG / quoted work).
 *
 * Every ticket lives on exactly one lane at a time; the lane is derived from status.
 */
export type TicketLane = "workflow" | "billing"

export const WORKFLOW_STATUSES: TicketStatus[] = [
  "BACKLOG",
  "PLANNED",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
  "CANCELLED",
]

export const BILLING_STATUSES: TicketStatus[] = [
  "REQUESTED",
  "QUOTED",
  "AWAITING_PAYMENT",
  "ACTIVE",
  "AWAITING_CLIENT",
]

export const ALL_STATUSES: TicketStatus[] = [...WORKFLOW_STATUSES, ...BILLING_STATUSES]

const WORKFLOW_SET = new Set<TicketStatus>(WORKFLOW_STATUSES)
const BILLING_SET = new Set<TicketStatus>(BILLING_STATUSES)

export function laneOf(status: string): TicketLane {
  if (BILLING_SET.has(status as TicketStatus)) return "billing"
  return "workflow"
}

export function isWorkflowStatus(status: string): boolean {
  return WORKFLOW_SET.has(status as TicketStatus)
}

export function isBillingStatus(status: string): boolean {
  return BILLING_SET.has(status as TicketStatus)
}

export const LANE_LABELS: Record<TicketLane, string> = {
  workflow: "Workflow",
  billing: "Billing",
}

export const LANE_DESCRIPTIONS: Record<TicketLane, string> = {
  workflow: "Standard retainer work on the sprint board.",
  billing: "Requires a quote, payment, or input before sprint work resumes.",
}

/**
 * Allowed next statuses from `current`. Keeps the dropdown honest — only valid
 * transitions appear, and the lane is preserved unless we cross a known bridge.
 *
 * Bridges:
 *  - billing.AWAITING_CLIENT -> workflow.PLANNED|IN_PROGRESS (work resumes)
 *  - billing.ACTIVE -> workflow.IN_PROGRESS (active PayG kicks off real work)
 *  - workflow.* -> billing.AWAITING_CLIENT (needs client input mid-flight)
 */
export function transitionsFor(current: string): TicketStatus[] {
  const c = current as TicketStatus

  const workflowMap: Partial<Record<TicketStatus, TicketStatus[]>> = {
    BACKLOG: ["PLANNED", "CANCELLED"],
    PLANNED: ["BACKLOG", "IN_PROGRESS", "AWAITING_CLIENT", "CANCELLED"],
    IN_PROGRESS: ["REVIEW", "PLANNED", "AWAITING_CLIENT", "CANCELLED"],
    REVIEW: ["DONE", "IN_PROGRESS", "AWAITING_CLIENT", "CANCELLED"],
    DONE: ["IN_PROGRESS"],
    CANCELLED: ["BACKLOG"],
  }

  const billingMap: Partial<Record<TicketStatus, TicketStatus[]>> = {
    REQUESTED: ["QUOTED", "AWAITING_CLIENT", "CANCELLED"],
    QUOTED: ["AWAITING_PAYMENT", "AWAITING_CLIENT", "REQUESTED", "CANCELLED"],
    AWAITING_PAYMENT: ["ACTIVE", "AWAITING_CLIENT", "QUOTED", "CANCELLED"],
    ACTIVE: ["IN_PROGRESS", "AWAITING_CLIENT", "DONE", "CANCELLED"],
    AWAITING_CLIENT: ["PLANNED", "IN_PROGRESS", "REVIEW", "QUOTED", "CANCELLED"],
  }

  const allowed = (isBillingStatus(c) ? billingMap[c] : workflowMap[c]) ?? []
  // Always include current so the dropdown can render it selected without surprise.
  return Array.from(new Set<TicketStatus>([c, ...allowed]))
}

/** Color hint per status for badges/pills (Tailwind class fragments). */
export function statusToneClass(status: string): string {
  switch (status as TicketStatus) {
    case "DONE":
      return "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
    case "CANCELLED":
      return "border-border text-fg-subtle"
    case "IN_PROGRESS":
    case "ACTIVE":
      return "border-blue-500/40 text-blue-600 dark:text-blue-400"
    case "REVIEW":
      return "border-amber-500/40 text-amber-600 dark:text-amber-400"
    case "AWAITING_CLIENT":
    case "AWAITING_PAYMENT":
      return "border-orange-500/40 text-orange-600 dark:text-orange-400"
    case "REQUESTED":
    case "QUOTED":
      return "border-violet-500/40 text-violet-600 dark:text-violet-400"
    case "PLANNED":
      return "border-fg/40 text-fg"
    case "BACKLOG":
    default:
      return "border-border text-fg-muted"
  }
}
