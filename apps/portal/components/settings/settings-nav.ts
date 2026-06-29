import type { LucideIcon } from "lucide-react"
import {
  CreditCard,
  LayoutGrid,
  Plug,
  Settings2,
  Users,
} from "lucide-react"

export type SettingsNavItem = {
  id: string
  label: string
  description: string
  href: string
  icon: LucideIcon
  adminOnly?: boolean
}

/**
 * `opts.showServer` is intentionally ignored — Server status and admin
 * controls now live on Summary (via the ServerStatusCard + modal).
 * The kwarg is kept so call-sites compile without churn.
 */
export function buildSettingsNav(
  baseHref: string,
  _opts?: { showServer?: boolean }
): SettingsNavItem[] {
  const items: SettingsNavItem[] = [
    {
      id: "overview",
      label: "Overview",
      description: "Summary and quick links",
      href: baseHref,
      icon: LayoutGrid,
    },
    {
      id: "general",
      label: "General",
      description: "Workspace profile and booking",
      href: `${baseHref}/general`,
      icon: Settings2,
    },
    {
      id: "members",
      label: "Members",
      description: "Team access and invites",
      href: `${baseHref}/members`,
      icon: Users,
    },
    {
      id: "integrations",
      label: "Integrations",
      description: "Discord and GitHub",
      href: `${baseHref}/integrations`,
      icon: Plug,
    },
  ]

  items.push({
    id: "billing",
    label: "Billing",
    description: "Retainer and shop orders",
    href: `${baseHref}/billing`,
    icon: CreditCard,
  })

  return items
}
