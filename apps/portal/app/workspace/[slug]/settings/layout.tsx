import type { ReactNode } from "react"
import { requireWorkspaceMember } from "@/lib/workspace"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SettingsShell } from "@/components/settings/SettingsShell"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function WorkspaceSettingsLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const access = await requireWorkspaceMember(slug)
  const base = `/workspace/${access.workspace.slug}`
  const settingsBase = `${base}/settings`

  const session = await auth()
  const userId = (session?.user as { id?: string } | undefined)?.id
  const staff = userId
    ? await prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } })
    : null
  const canAdmin =
    Boolean(staff?.active) || access.role === "OWNER" || access.role === "ADMIN"

  return (
    <SettingsShell
      workspaceName={access.workspace.name}
      baseHref={settingsBase}
      workspaceBaseHref={base}
      showServer={canAdmin}
    >
      {children}
    </SettingsShell>
  )
}
