import { transitionsFor } from "@/lib/ticket-status"

/**
 * Returns the valid next-status set for a ticket detail dropdown.
 * Backed by `transitionsFor` so illegal jumps never appear in the UI.
 */
export function statusOptionsForTicket(currentStatus: string): readonly string[] {
  return transitionsFor(currentStatus)
}
