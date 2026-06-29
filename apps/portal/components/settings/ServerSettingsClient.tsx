"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Textarea } from "@/components/ui/Input"
import {
  SettingsAlert,
  SettingsCard,
  SettingsPageHeader,
  SettingsSection,
} from "@/components/settings/SettingsSection"

export function ServerSettingsClient(props: {
  workspaceId: string
  canAdmin: boolean
  server: {
    online: boolean
    playerCount: number
    maxPlayers: number
    displayName: string | null
    provider: string
    lastSeenAt: string | null
  } | null
}) {
  const router = useRouter()
  const [online, setOnline] = useState(props.server?.online ?? false)
  const [players, setPlayers] = useState(props.server?.playerCount ?? 0)
  const [maxPlayers, setMaxPlayers] = useState(props.server?.maxPlayers ?? 60)
  const [pinned, setPinned] = useState("")
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  if (!props.canAdmin) {
    return (
      <>
        <SettingsPageHeader
          title="Server"
          description="DayZ server status and client-facing announcements."
        />
        <SettingsSection title="Access">
          <p className="text-sm text-fg-muted">Only workspace admins can manage server settings.</p>
        </SettingsSection>
      </>
    )
  }

  async function saveServer() {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/workspaces/${props.workspaceId}/server`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          online,
          playerCount: players,
          maxPlayers,
          provider: "MANUAL",
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setMsg({ type: "ok", text: "Server status saved." })
      router.refresh()
    } catch (e: unknown) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Failed" })
    } finally {
      setLoading(false)
    }
  }

  async function pinUpdate() {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/workspaces/${props.workspaceId}/pinned-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: pinned, mirrorDiscord: true }),
      })
      if (!res.ok) throw new Error(await res.text())
      setPinned("")
      setMsg({ type: "ok", text: "Pinned update posted to summary and Discord." })
      router.refresh()
    } catch (e: unknown) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Failed" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SettingsPageHeader
        title="Server"
        description="Manual DayZ server status for the workspace summary card, plus pinned announcements."
      />

      {msg ? (
        <div className="px-5 pb-0">
          <SettingsAlert variant={msg.type === "ok" ? "success" : "error"}>{msg.text}</SettingsAlert>
        </div>
      ) : null}

      <SettingsSection
        title="Live status"
        description="Shown on the workspace summary. Automate later via heartbeat webhook."
      >
        <SettingsCard className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium text-fg">
            <input
              type="checkbox"
              checked={online}
              onChange={(e) => setOnline(e.target.checked)}
              className="rounded border-border"
            />
            Server online
          </label>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
                Players
              </label>
              <input
                type="number"
                min={0}
                className="mt-1 block w-24 rounded-md border border-border bg-surface px-3 py-2 text-sm"
                value={players}
                onChange={(e) => setPlayers(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
                Max slots
              </label>
              <input
                type="number"
                min={0}
                className="mt-1 block w-24 rounded-md border border-border bg-surface px-3 py-2 text-sm"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
              />
            </div>
          </div>
          {props.server?.lastSeenAt ? (
            <p className="text-xs text-fg-muted">
              Last updated {new Date(props.server.lastSeenAt).toLocaleString()} · Provider:{" "}
              {props.server.provider}
            </p>
          ) : null}
          <Button type="button" size="sm" onClick={() => void saveServer()} isLoading={loading}>
            Save status
          </Button>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Pinned announcement"
        description="Posts to the summary home tab and optionally mirrors to Discord #announcements."
      >
        <div className="space-y-3 max-w-xl">
          <Textarea
            id="pinned-update"
            label="Message"
            value={pinned}
            onChange={(e) => setPinned(e.target.value)}
            placeholder="e.g. Server restart tonight 9pm UTC — expect 10 min downtime."
          />
          <Button
            type="button"
            size="sm"
            onClick={() => void pinUpdate()}
            isLoading={loading}
            disabled={!pinned.trim()}
          >
            Pin and announce
          </Button>
        </div>
      </SettingsSection>
    </>
  )
}
