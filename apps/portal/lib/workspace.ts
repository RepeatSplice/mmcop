import { getWorkspaceAccess, type WorkspaceAccess } from "@/lib/workspace-cache"

export type { WorkspaceAccess }

/**
 * Active staff (`staffProfile.active`) can read/write many workspace routes without
 * membership. That is intentional ops access — not a client bug. Tighten with an
 * explicit ops allowlist on the staff profile if you need stricter isolation.
 */

export async function requireWorkspaceMember(slug: string): Promise<WorkspaceAccess> {
  return getWorkspaceAccess(slug)
}

