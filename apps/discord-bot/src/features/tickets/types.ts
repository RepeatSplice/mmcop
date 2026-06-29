export const TICKET_PREFIX = "tickets"

export const DiscordTicketType = {
  GENERAL_INQUIRY: "GENERAL_INQUIRY",
  CUSTOMER_SUPPORT: "CUSTOMER_SUPPORT",
  ORDER: "ORDER",
} as const

export type DiscordTicketType = (typeof DiscordTicketType)[keyof typeof DiscordTicketType]

export type TicketTypeSlug = "general" | "support" | "order"

export type TicketReason = {
  slug: string
  label: string
}

export type TicketTypeConfig = {
  type: DiscordTicketType
  slug: TicketTypeSlug
  command: string
  titleSuffix: string
  channelPrefix: string
  intro: string
  reasons: TicketReason[]
}

export const TICKET_TYPE_CONFIGS: Record<DiscordTicketType, TicketTypeConfig> = {
  [DiscordTicketType.GENERAL_INQUIRY]: {
    type: DiscordTicketType.GENERAL_INQUIRY,
    slug: "general",
    command: "general-inquiry",
    titleSuffix: "General Inquiry",
    channelPrefix: "general",
    intro: [
      "Questions about partnerships, licensing, careers, media, or anything else that is not account or order related.",
      "",
      "Select a reason below, then fill in the short form. A private channel will be opened for you and staff.",
    ].join("\n"),
    reasons: [
      { slug: "partnership", label: "Partnership" },
      { slug: "licensing", label: "Licensing" },
      { slug: "careers", label: "Careers" },
      { slug: "media", label: "Media" },
      { slug: "other", label: "Other" },
    ],
  },
  [DiscordTicketType.CUSTOMER_SUPPORT]: {
    type: DiscordTicketType.CUSTOMER_SUPPORT,
    slug: "support",
    command: "customer-support",
    titleSuffix: "Customer Support",
    channelPrefix: "support",
    intro: [
      "Account issues, ban appeals, technical help, billing, or reporting another user.",
      "",
      "Select a reason below, then fill in the short form. A private channel will be opened for you and staff.",
    ].join("\n"),
    reasons: [
      { slug: "account_issue", label: "Account issue" },
      { slug: "ban_appeal", label: "Ban appeal" },
      { slug: "technical_help", label: "Technical help" },
      { slug: "billing_question", label: "Billing question" },
      { slug: "report_user", label: "Report a user" },
      { slug: "other", label: "Other" },
    ],
  },
  [DiscordTicketType.ORDER]: {
    type: DiscordTicketType.ORDER,
    slug: "order",
    command: "order-ticket",
    titleSuffix: "Order Support",
    channelPrefix: "order",
    intro: [
      "Order status, missing deliveries, license issues, wrong products, or refund requests.",
      "",
      "Select a reason below, then fill in the short form. A private channel will be opened for you and staff.",
    ].join("\n"),
    reasons: [
      { slug: "order_status", label: "Order status" },
      { slug: "missing_delivery", label: "Missing delivery" },
      { slug: "license_issue", label: "License issue" },
      { slug: "wrong_product", label: "Wrong product" },
      { slug: "refund_request", label: "Refund request" },
      { slug: "other", label: "Other" },
    ],
  },
}

const slugToType = Object.values(TICKET_TYPE_CONFIGS).reduce(
  (acc, cfg) => {
    acc[cfg.slug] = cfg.type
    return acc
  },
  {} as Record<TicketTypeSlug, DiscordTicketType>
)

const commandToType = Object.values(TICKET_TYPE_CONFIGS).reduce(
  (acc, cfg) => {
    acc[cfg.command] = cfg.type
    return acc
  },
  {} as Record<string, DiscordTicketType>
)

export function ticketTypeFromSlug(slug: string): DiscordTicketType | null {
  return slugToType[slug as TicketTypeSlug] ?? null
}

export function ticketTypeFromCommand(command: string): DiscordTicketType | null {
  return commandToType[command] ?? null
}

export function getTicketTypeConfig(type: DiscordTicketType): TicketTypeConfig {
  return TICKET_TYPE_CONFIGS[type]
}

export function getReasonLabel(type: DiscordTicketType, reasonSlug: string): string {
  const cfg = TICKET_TYPE_CONFIGS[type]
  return cfg.reasons.find((r) => r.slug === reasonSlug)?.label ?? reasonSlug
}
