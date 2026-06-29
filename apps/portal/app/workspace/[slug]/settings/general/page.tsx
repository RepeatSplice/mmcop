import { requireWorkspaceMember } from "@/lib/workspace"
import { prisma } from "@/lib/prisma"
import { GeneralSettingsClient } from "@/components/settings/GeneralSettingsClient"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function GeneralSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const access = await requireWorkspaceMember(slug)

  const ws = await prisma.workspace.findUnique({
    where: { id: access.workspace.id },
    select: { name: true, slug: true, calBookingUrl: true },
  })

  const canEdit = access.role === "OWNER" || access.role === "ADMIN"
  const defaultCal = process.env.PORTAL_DEFAULT_CAL_URL ?? null

  return (
    <GeneralSettingsClient
      workspaceId={access.workspace.id}
      name={ws?.name ?? access.workspace.name}
      slug={ws?.slug ?? access.workspace.slug}
      calBookingUrl={ws?.calBookingUrl ?? null}
      defaultCalUrl={defaultCal}
      canEdit={canEdit}
    />
  )
}
