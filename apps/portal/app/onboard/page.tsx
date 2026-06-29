import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { OnboardWizard } from "@/components/onboard/OnboardWizard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Picks the membership most in need of onboarding (newest with no
 * `onboardedAt`). If everything is onboarded already we bounce home.
 */
export default async function OnboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ workspace?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const userId = (session.user as { id?: string }).id
  if (!userId) redirect("/login")

  const params = (await searchParams) ?? {}
  const targetSlug = params.workspace

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      workspace: {
        select: { id: true, slug: true, name: true },
      },
    },
  })

  const pending = memberships.find((m) => !m.onboardedAt && (!targetSlug || m.workspace.slug === targetSlug))
  const target = pending ?? memberships.find((m) => !targetSlug || m.workspace.slug === targetSlug)

  if (!target) {
    redirect("/")
  }
  if (!pending) {
    // Already onboarded — send them straight into the workspace.
    redirect(`/workspace/${encodeURIComponent(target.workspace.slug)}/summary`)
  }

  const discord = await prisma.account.findFirst({
    where: { userId, provider: "discord" },
    select: { id: true },
  })

  return (
    <OnboardWizard
      workspaceId={target.workspace.id}
      workspaceSlug={target.workspace.slug}
      workspaceName={target.workspace.name}
      hasDiscordLinked={Boolean(discord)}
    />
  )
}
