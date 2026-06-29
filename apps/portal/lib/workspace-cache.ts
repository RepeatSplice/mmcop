import { cache } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type WorkspaceAccess = {
  userId: string
  workspace: { id: string; slug: string; name: string }
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
  isStaff: boolean
  onboardedAt: Date | null
}

/** Dedupes membership + auth when layout + page run in the same request. */
export const getWorkspaceAccess = cache(async (slug: string): Promise<WorkspaceAccess> => {
  const session = await auth()
  if (!session?.user) redirect(`/login?callbackUrl=/workspace/${encodeURIComponent(slug)}/summary`)

  const userId = (session.user as { id?: string }).id!
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, workspace: { slug, active: true } },
    select: {
      role: true,
      onboardedAt: true,
      workspace: { select: { id: true, slug: true, name: true } },
      user: { select: { staffProfile: { select: { active: true } } } },
    },
  })

  if (!membership) redirect("/")

  return {
    userId,
    role: membership.role,
    workspace: membership.workspace,
    isStaff: Boolean(membership.user.staffProfile?.active),
    onboardedAt: membership.onboardedAt,
  }
})
