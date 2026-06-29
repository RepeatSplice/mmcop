"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Mail, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import {
  SettingsAlert,
  SettingsCard,
  SettingsPageHeader,
  SettingsSection,
} from "@/components/settings/SettingsSection"

type Member = {
  id: string
  userId: string
  email: string
  name: string
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
  createdAt: string
}

type Invite = {
  id: string
  emailLower: string
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
  createdAt: string
  expiresAt: string
}

const ALL_ROLES: Array<Member["role"]> = ["OWNER", "ADMIN", "MEMBER", "VIEWER"]

const ROLE_DESCRIPTIONS: Record<Member["role"], string> = {
  OWNER: "Full control. Manages billing, members, and can delete the workspace.",
  ADMIN: "Manages members, integrations, and workspace settings — no billing access.",
  MEMBER: "Creates and edits tickets, comments, attachments, and chat.",
  VIEWER: "Read-only access. Cannot post, edit, or change ticket status.",
}

function canManage(viewerRole: Member["role"]) {
  return viewerRole === "OWNER" || viewerRole === "ADMIN"
}

function availableRolesForInviter(viewer: Member["role"]): Array<Member["role"]> {
  if (viewer === "OWNER") return ALL_ROLES
  return ALL_ROLES.filter((r) => r !== "OWNER")
}

export function MembersSettingsClient(props: {
  workspaceId: string
  workspaceSlug: string
  viewerRole: Member["role"]
  members: Member[]
  invites: Invite[]
}) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<Member["role"]>("MEMBER")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [copiedFor, setCopiedFor] = useState<string | null>(null)

  const allowedRoles = useMemo(
    () => availableRolesForInviter(props.viewerRole),
    [props.viewerRole]
  )

  const seats = useMemo(() => {
    return { members: props.members.length, pendingInvites: props.invites.length }
  }, [props.members.length, props.invites.length])

  async function copyText(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedFor(key)
      setTimeout(() => setCopiedFor((k) => (k === key ? null : k)), 1500)
    } catch {
      /* clipboard denied */
    }
  }

  async function sendInvite() {
    setBusy(true)
    setError(null)
    setOk(null)
    try {
      const res = await fetch(`/api/workspaces/${props.workspaceId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: inviteRole }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as { acceptUrl?: string }
      if (data.acceptUrl) {
        await copyText(data.acceptUrl, `new:${email}`)
        setOk(`Invite sent to ${email}. Accept link copied to clipboard.`)
      } else {
        setOk(`Invite sent to ${email}.`)
      }
      setEmail("")
      router.refresh()
    } catch (e: unknown) {
      setError(humanizeError(e))
    } finally {
      setBusy(false)
    }
  }

  async function changeRole(member: Member, role: Member["role"]) {
    if (role === member.role) return
    const confirmed = window.confirm(
      `Change ${member.name || member.email} from ${member.role} to ${role}?`
    )
    if (!confirmed) {
      // Force the select to re-render the original value.
      router.refresh()
      return
    }
    setBusy(true)
    setError(null)
    setOk(null)
    try {
      const res = await fetch(
        `/api/workspaces/${props.workspaceId}/members/${member.userId}/role`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        }
      )
      if (!res.ok) throw new Error(await res.text())
      setOk(`${member.name || member.email} is now ${role}.`)
      router.refresh()
    } catch (e: unknown) {
      setError(humanizeError(e))
    } finally {
      setBusy(false)
    }
  }

  async function removeMember(member: Member) {
    const confirmed = window.confirm(
      `Remove ${member.name || member.email} from this workspace? They will lose access immediately.`
    )
    if (!confirmed) return
    setBusy(true)
    setError(null)
    setOk(null)
    try {
      const res = await fetch(
        `/api/workspaces/${props.workspaceId}/members/${member.userId}`,
        {
          method: "DELETE",
        }
      )
      if (!res.ok) throw new Error(await res.text())
      setOk(`${member.name || member.email} removed.`)
      router.refresh()
    } catch (e: unknown) {
      setError(humanizeError(e))
    } finally {
      setBusy(false)
    }
  }

  async function revokeInvite(invite: Invite) {
    const confirmed = window.confirm(
      `Revoke invite to ${invite.emailLower}? The existing accept link will stop working.`
    )
    if (!confirmed) return
    setBusy(true)
    setError(null)
    setOk(null)
    try {
      const res = await fetch(
        `/api/workspaces/${props.workspaceId}/invites/${invite.id}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error(await res.text())
      setOk(`Invite to ${invite.emailLower} revoked.`)
      router.refresh()
    } catch (e: unknown) {
      setError(humanizeError(e))
    } finally {
      setBusy(false)
    }
  }

  async function resendInvite(invite: Invite) {
    setBusy(true)
    setError(null)
    setOk(null)
    try {
      const res = await fetch(
        `/api/workspaces/${props.workspaceId}/invites/${invite.id}/resend`,
        { method: "POST" }
      )
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as { acceptUrl?: string }
      if (data.acceptUrl) {
        await copyText(data.acceptUrl, invite.id)
        setOk(`New invite emailed to ${invite.emailLower}. Link copied to clipboard.`)
      } else {
        setOk(`New invite emailed to ${invite.emailLower}.`)
      }
      router.refresh()
    } catch (e: unknown) {
      setError(humanizeError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <SettingsPageHeader
        title="Members"
        description={`${seats.members} members · ${seats.pendingInvites} pending invites`}
      />

      {(error || ok) && (
        <div className="px-5 pb-0 space-y-2">
          {error ? <SettingsAlert variant="error">{error}</SettingsAlert> : null}
          {ok ? <SettingsAlert variant="success">{ok}</SettingsAlert> : null}
        </div>
      )}

      {canManage(props.viewerRole) ? (
        <SettingsSection
          title="Invite teammate"
          description="They receive an email with the accept link."
        >
          <div className="grid gap-3 md:grid-cols-3 max-w-3xl">
            <Input
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="someone@example.com"
            />
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
                Role
              </label>
              <select
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:border-monarch-500"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Member["role"])}
              >
                {allowedRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-fg-subtle mt-1">{ROLE_DESCRIPTIONS[inviteRole]}</p>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={() => void sendInvite()}
                isLoading={busy}
                disabled={!email.trim()}
              >
                Send invite
              </Button>
            </div>
          </div>
        </SettingsSection>
      ) : (
        <SettingsSection title="Access">
          <p className="text-sm text-fg-muted">
            Only OWNER and ADMIN can invite new members.
          </p>
        </SettingsSection>
      )}

      <SettingsSection title={`Members (${props.members.length})`}>
        <div className="space-y-2">
          {props.members.map((m) => {
            const rolesShown =
              props.viewerRole === "OWNER" ? ALL_ROLES : ALL_ROLES.filter((r) => r !== "OWNER" || m.role === "OWNER")
            const canEdit = canManage(props.viewerRole) && m.role !== "OWNER"
            return (
              <SettingsCard key={m.userId}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg truncate">
                      {m.name || m.email}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-muted truncate">{m.email}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-fg-subtle whitespace-nowrap">
                    {m.role}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-fg-subtle">
                  {ROLE_DESCRIPTIONS[m.role]}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <select
                    className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg disabled:opacity-50"
                    defaultValue={m.role}
                    disabled={!canEdit || busy}
                    onChange={(e) => void changeRole(m, e.target.value as Member["role"])}
                    title={
                      !canEdit
                        ? m.role === "OWNER"
                          ? "Only the OWNER can change their own role."
                          : "You don't have permission to change roles."
                        : undefined
                    }
                  >
                    {rolesShown.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {canEdit ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => void removeMember(m)}
                      disabled={busy}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" strokeWidth={1.75} />
                      Remove
                    </Button>
                  ) : null}
                </div>
              </SettingsCard>
            )
          })}
        </div>
      </SettingsSection>

      <SettingsSection title={`Pending invites (${props.invites.length})`}>
        {props.invites.length === 0 ? (
          <p className="text-sm text-fg-muted">No pending invites.</p>
        ) : (
          <div className="space-y-2">
            {props.invites.map((i) => (
              <SettingsCard key={i.id} padding="sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-fg truncate">{i.emailLower}</p>
                    <p className="mt-1 text-[11px] text-fg-muted">
                      {i.role} · Expires {new Date(i.expiresAt).toLocaleString()}
                    </p>
                  </div>
                  {canManage(props.viewerRole) ? (
                    <div className="flex flex-wrap gap-2 items-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => void resendInvite(i)}
                        disabled={busy}
                      >
                        <Mail className="h-3.5 w-3.5 mr-1" strokeWidth={1.75} />
                        Resend
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => void resendInvite(i)}
                        disabled={busy}
                        title="Re-issues the invite and copies the new link to your clipboard."
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" strokeWidth={1.75} />
                        {copiedFor === i.id ? "Copied" : "Copy link"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => void revokeInvite(i)}
                        disabled={busy}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" strokeWidth={1.75} />
                        Revoke
                      </Button>
                    </div>
                  ) : null}
                </div>
              </SettingsCard>
            ))}
          </div>
        )}
      </SettingsSection>
    </>
  )
}

/** Map known raw API error strings to friendlier copy. */
function humanizeError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e)
  if (!raw) return "Something went wrong."
  if (raw.includes("Forbidden")) return "You don't have permission to do that."
  if (raw.includes("Only OWNER can invite OWNER")) return "Only the OWNER can invite another OWNER."
  if (raw.includes("Not found")) return "That invite or member no longer exists."
  if (raw.includes("Already accepted")) return "That invite was already accepted."
  return raw.slice(0, 280)
}
