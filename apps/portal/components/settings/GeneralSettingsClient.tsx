"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import {
  SettingsAlert,
  SettingsPageHeader,
  SettingsSection,
  SettingsCard,
} from "@/components/settings/SettingsSection"

export function GeneralSettingsClient(props: {
  workspaceId: string
  name: string
  slug: string
  calBookingUrl: string | null
  defaultCalUrl: string | null
  canEdit: boolean
}) {
  const router = useRouter()
  const [calUrl, setCalUrl] = useState(props.calBookingUrl ?? "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function save() {
    setBusy(true)
    setError(null)
    setOk(false)
    try {
      const trimmed = calUrl.trim()
      const res = await fetch(`/api/workspaces/${props.workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calBookingUrl: trimmed.length > 0 ? trimmed : null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setOk(true)
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <SettingsPageHeader
        title="General"
        description="Workspace identity and client-facing booking links shown on your summary."
      />

      <SettingsSection title="Workspace" description="Core identifiers for this retainer workspace.">
        <SettingsCard>
          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
                Display name
              </dt>
              <dd className="mt-1 font-medium text-fg">{props.name}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
                Workspace key
              </dt>
              <dd className="mt-1 font-mono text-fg">{props.slug}</dd>
              <dd className="mt-1 text-xs text-fg-muted">Ticket keys use {props.slug.toUpperCase()}-N</dd>
            </div>
          </dl>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Sprint review booking"
        description="Cal.com or other booking URL for scheduling check-ins with your team."
      >
        {props.canEdit ? (
          <div className="space-y-4 max-w-lg">
            <Input
              label="Booking URL"
              value={calUrl}
              onChange={(e) => setCalUrl(e.target.value)}
              placeholder={props.defaultCalUrl ?? "https://cal.com/your-link"}
            />
            {props.defaultCalUrl && !props.calBookingUrl ? (
              <p className="text-xs text-fg-muted">
                Portal default is used until you save a workspace-specific link.
              </p>
            ) : null}
            <Button type="button" onClick={() => void save()} isLoading={busy}>
              Save booking link
            </Button>
            {error ? <SettingsAlert variant="error">{error}</SettingsAlert> : null}
            {ok ? <SettingsAlert variant="success">Saved.</SettingsAlert> : null}
          </div>
        ) : (
          <SettingsCard>
            <p className="text-sm text-fg">
              {props.calBookingUrl || props.defaultCalUrl || "No booking link configured."}
            </p>
          </SettingsCard>
        )}
      </SettingsSection>
    </>
  )
}
