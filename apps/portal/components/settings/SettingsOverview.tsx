import Link from "next/link"
import { ChevronRight } from "lucide-react"
import {
  SettingsPageHeader,
  SettingsSection,
  SettingsStatGrid,
  SettingsCard,
} from "@/components/settings/SettingsSection"
import { buildSettingsNav } from "@/components/settings/settings-nav"

export function SettingsOverview(props: {
  baseHref: string
  showServer: boolean
  stats: {
    members: number
    pendingInvites: number
    integrations: number
    discordReady: boolean
    serverOnline: boolean | null
    serverPlayers: string | null
    subscriptionStatus: string | null
    hasBookingLink: boolean
  }
}) {
  const nav = buildSettingsNav(props.baseHref, { showServer: props.showServer }).filter(
    (n) => n.id !== "overview"
  )

  return (
    <>
      <SettingsPageHeader
        title="Overview"
        description="Quick health check for your workspace. Open a section in the sidebar for details."
      />

      <SettingsSection title="At a glance">
        <SettingsStatGrid
          items={[
            { label: "Members", value: props.stats.members, hint: `${props.stats.pendingInvites} pending invites` },
            { label: "Integrations", value: props.stats.integrations },
            {
              label: "Discord",
              value: props.stats.discordReady ? "Ready" : "Setup",
              hint: props.stats.discordReady ? "Channels provisioned" : "Provision in Integrations",
            },
            {
              label: "Billing",
              value: props.stats.subscriptionStatus ?? "—",
              hint: "Stripe retainer",
            },
          ]}
        />
      </SettingsSection>

      {props.showServer && props.stats.serverOnline !== null ? (
        <SettingsSection title="DayZ server">
          <SettingsCard padding="sm">
            <p className="text-sm text-fg">
              {props.stats.serverOnline ? "Online" : "Offline"}
              {props.stats.serverPlayers ? ` · ${props.stats.serverPlayers}` : ""}
            </p>
            <Link
              href={`${props.baseHref}/server`}
              className="mt-2 inline-flex text-xs text-fg-muted hover:text-fg"
            >
              Manage server settings →
            </Link>
          </SettingsCard>
        </SettingsSection>
      ) : null}

      <SettingsSection title="Sections" description="Jump to any settings area.">
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface overflow-hidden">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2 transition-colors group"
                >
                  <Icon className="h-4 w-4 text-fg-subtle shrink-0" strokeWidth={1.75} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-fg">{item.label}</p>
                    <p className="text-xs text-fg-muted">{item.description}</p>
                  </div>
                  <ChevronRight
                    className="h-4 w-4 text-fg-subtle group-hover:text-fg shrink-0"
                    strokeWidth={1.75}
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      </SettingsSection>

      {!props.stats.hasBookingLink ? (
        <SettingsSection title="Tip">
          <SettingsCard padding="sm">
            <p className="text-sm text-fg-muted">
              Add a sprint review booking link in{" "}
              <Link href={`${props.baseHref}/general`} className="text-fg underline underline-offset-2">
                General
              </Link>{" "}
              so clients can schedule check-ins from the summary.
            </p>
          </SettingsCard>
        </SettingsSection>
      ) : null}
    </>
  )
}
