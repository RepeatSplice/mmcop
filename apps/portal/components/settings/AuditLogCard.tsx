import { SettingsSection } from "@/components/settings/SettingsSection"

export type AuditEvent = {
  id: string
  createdAt: string
  type: string
  body: string
  actorName: string | null
}

function labelForType(type: string): string {
  const map: Record<string, string> = {
    "workspace.member_added": "Member added",
    "workspace.member_removed": "Member removed",
    "workspace.member_role_changed": "Role changed",
    "workspace.updated": "Workspace updated",
    "invite.sent": "Invite sent",
    "invite.accepted": "Invite accepted",
    "invite.revoked": "Invite revoked",
    "integration.added": "Integration linked",
    "integration.removed": "Integration removed",
    "integration.updated": "Integration updated",
  }
  return map[type] ?? type
}

export function AuditLogCard(props: { title?: string; events: AuditEvent[] }) {
  return (
    <SettingsSection
      title={props.title ?? "Audit log"}
      description="Recent activity on members and integrations. The last 25 events."
    >
      {props.events.length === 0 ? (
        <p className="text-sm text-fg-muted">No recent activity.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border bg-surface">
          {props.events.map((e) => (
            <li key={e.id} className="px-3 py-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[11px] font-medium uppercase tracking-widest text-fg-subtle">
                  {labelForType(e.type)}
                </span>
                <span className="text-[10px] tabular-nums text-fg-subtle">
                  {new Date(e.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-sm text-fg-muted">
                {e.body || labelForType(e.type)}
                {e.actorName ? <span className="text-fg-subtle"> · {e.actorName}</span> : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </SettingsSection>
  )
}
