import { redirect } from "next/navigation"
import { requireWorkspaceMember } from "@/lib/workspace"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function LegacyJobRedirectPage({
  params,
}: {
  params: Promise<{ slug: string; jobKey: string }>
}) {
  const { slug, jobKey } = await params
  const access = await requireWorkspaceMember(slug)

  const base = `/workspace/${access.workspace.slug}`
  const ticket = await prisma.ticket.findFirst({
    where: { workspaceId: access.workspace.id, key: jobKey },
    select: { key: true },
  })

  if (!ticket) redirect(`${base}/list`)
  redirect(`${base}/tickets/${ticket.key}`)
}
