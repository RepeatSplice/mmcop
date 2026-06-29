"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { DiscordProvisionButton } from "@/components/settings/DiscordProvisionButton"
import {
  SettingsAlert,
  SettingsCard,
  SettingsPageHeader,
  SettingsSection,
} from "@/components/settings/SettingsSection"

type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"

function canManage(role: Role) {
  return role === "OWNER" || role === "ADMIN"
}

type DiscordStatus = {
  provisionedAt: string | null
  lastError: string | null
  guildId: string | null
  categoryId: string | null
  chatChannelId: string | null
  announcementsChannelId: string | null
  logsChannelId: string | null
  infoChannelId: string | null
} | null

export function IntegrationsSettingsClient(props: {
  workspaceId: string
  workspaceSlug: string
  viewerRole: Role
  showServerLink: boolean
  discord: DiscordStatus
  connections: Array<{
    id: string
    type: "GITHUB_REPO" | "DISCORD_CHANNEL"
    externalId: string
    jobId: string | null
    createdAt: string
  }>
}) {
  const router = useRouter()
  const [type, setType] = useState<"GITHUB_REPO" | "DISCORD_CHANNEL">("GITHUB_REPO")
  const [externalId, setExternalId] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  async function save() {
    setBusy(true)
    setError(null)
    setOk(null)
    try {
      const res = await fetch(`/api/workspaces/${props.workspaceId}/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, externalId }),
      })
      if (!res.ok) throw new Error(await res.text())
      setOk("Integration saved.")
      setExternalId("")
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed")
    } finally {
      setBusy(false)
    }
  }

  const summaryHref = `/workspace/${props.workspaceSlug}/summary`

  return (
    <>
      <SettingsPageHeader
        title="Integrations"
        description="Discord workspace channels and GitHub activity feed connections."
      />

      {(error || ok) && (
        <div className="px-5 pb-0 space-y-2">
          {error ? <SettingsAlert variant="error">{error}</SettingsAlert> : null}
          {ok ? <SettingsAlert variant="success">{ok}</SettingsAlert> : null}
        </div>
      )}

      <SettingsSection
        title="Workspace Discord"
        description="Provisioned category and channels in the Monarch Discord server."
      >
        <SettingsCard>
          {props.discord?.provisionedAt ? (
            <div className="space-y-3">
              <SettingsAlert variant="success">
                Channels provisioned {new Date(props.discord.provisionedAt).toLocaleString()}
              </SettingsAlert>
              <dl className="grid gap-2 font-mono text-[10px] text-fg-subtle break-all sm:grid-cols-2">
                <div>
                  <dt className="uppercase tracking-widest text-fg-muted">Category</dt>
                  <dd className="text-fg">{props.discord.categoryId}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-widest text-fg-muted">#chat</dt>
                  <dd className="text-fg">{props.discord.chatChannelId}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-widest text-fg-muted">#announcements</dt>
                  <dd className="text-fg">{props.discord.announcementsChannelId}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-widest text-fg-muted">#logs</dt>
                  <dd className="text-fg">{props.discord.logsChannelId}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-widest text-fg-muted">#info</dt>
                  <dd className="text-fg">{props.discord.infoChannelId}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-fg-muted">
                {props.discord?.lastError
                  ? "Provisioning failed. An admin can retry below."
                  : "Discord channels are not provisioned yet."}
              </p>
              {props.discord?.lastError ? (
                <SettingsAlert variant="error">{props.discord.lastError}</SettingsAlert>
              ) : null}
            </div>
          )}
          {canManage(props.viewerRole) ? (
            <div className="mt-4">
              <DiscordProvisionButton
                workspaceId={props.workspaceId}
                alreadyProvisioned={Boolean(props.discord?.provisionedAt)}
              />
            </div>
          ) : null}
        </SettingsCard>
      </SettingsSection>

      {props.showServerLink ? (
        <SettingsSection title="Server & announcements">
          <p className="text-sm text-fg-muted">
            DayZ status and pinned updates live on the{" "}
            <Link href={summaryHref} className="text-fg underline underline-offset-2">
              Summary
            </Link>{" "}
            — use the “Manage” button on the server card to update status or pin
            an announcement.
          </p>
        </SettingsSection>
      ) : null}

      {canManage(props.viewerRole) ? (
        <SettingsSection title="Add feed connection" description="GitHub repos or Discord channels for the activity feed.">
          <div className="grid gap-3 md:grid-cols-3 max-w-3xl">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
                Type
              </label>
              <select
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
                value={type}
                onChange={(e) => setType(e.target.value as "GITHUB_REPO" | "DISCORD_CHANNEL")}
              >
                <option value="GITHUB_REPO">GitHub repo</option>
                <option value="DISCORD_CHANNEL">Discord channel/webhook</option>
              </select>
            </div>
            <Input
              label={type === "GITHUB_REPO" ? "Repo (owner/repo)" : "Channel ID or webhook URL"}
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
            />
            <div className="flex items-end">
              <Button type="button" onClick={() => void save()} isLoading={busy} disabled={!externalId.trim()}>
                Save
              </Button>
            </div>
          </div>
        </SettingsSection>
      ) : (
        <SettingsSection title="Access">
          <p className="text-sm text-fg-muted">You don’t have permission to manage integrations.</p>
        </SettingsSection>
      )}

      <SettingsSection title={`Connected (${props.connections.length})`}>
        {props.connections.length === 0 ? (
          <p className="text-sm text-fg-muted">No feed connections yet.</p>
        ) : (
          <div className="space-y-2">
            {props.connections.map((c) => (
              <SettingsCard key={c.id} padding="sm">
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
                  {c.type}
                </p>
                <p className="mt-1 text-sm text-fg break-all">{c.externalId}</p>
                <p className="mt-1 text-xs text-fg-muted">
                  Added {new Date(c.createdAt).toLocaleString()}
                </p>
              </SettingsCard>
            ))}
          </div>
        )}
      </SettingsSection>
    </>
  )
}
