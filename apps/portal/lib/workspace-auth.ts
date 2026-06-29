import type { WorkspaceRole } from "@prisma/client"

/** Active staff can access any workspace by id (ops tooling). Do not grant staff lightly. */
export function isOpsStaff(staff: { active: boolean } | null | undefined) {
  return Boolean(staff?.active)
}

export function canManageWorkspace(
  member: { role: WorkspaceRole } | null | undefined,
  staff: { active: boolean } | null | undefined
) {
  if (isOpsStaff(staff)) return true
  return member?.role === "OWNER" || member?.role === "ADMIN"
}

export function canManageBilling(member: { role: WorkspaceRole } | null | undefined) {
  return member?.role === "OWNER" || member?.role === "ADMIN"
}
