/**
 * Product defaults for open questions in the 100x roadmap.
 * Override via env where noted.
 */
export const PORTAL_DECISIONS = {
  /** Default monitoring: manual status until staff configures provider. */
  monitoringProvider: "MANUAL" as const,
  /** Link Medusa customers by matching workspace owner email. */
  medusaLinkStrategy: "owner_email" as const,
  /** Clients with MEMBER+ can create REQUESTED tickets; VIEWER cannot. */
  clientTicketCreation: true,
  /** AI may process ticket/chat text when OPENAI_API_KEY is set. */
  aiDataPolicy: "cloud_optional" as const,
} as const

export function aiEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}
