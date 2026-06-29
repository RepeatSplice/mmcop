import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import {
  discordContactLabel,
  getApplicationProfile,
  isDefaultApplicationDescription,
} from "@/lib/application-profile"
import { ApplyForm } from "@/components/apply/ApplyForm"
import { PortalPageHeader, PortalPageLayout } from "@/components/portal/PortalPage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function notesFromDescription(description: string | undefined): string {
  if (!description || isDefaultApplicationDescription(description)) return ""
  return description
}

export default async function ApplyPage() {
  const session = await auth()
  if (!session?.user) redirect("/login?callbackUrl=/apply")

  const userId = (session.user as { id?: string }).id!

  const [profile, existing] = await Promise.all([
    getApplicationProfile(userId),
    prisma.application.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return (
    <PortalPageLayout backHref="/">
      <PortalPageHeader
        eyebrow="Monarch Portal"
        title="Request access"
        description="Submit a portal access request with your server name and community Discord. Staff will review your account and create a workspace for delivery tracking."
      />

      <ApplyForm
        profile={{
          email: profile.email,
          name: profile.name,
          discordLinked: profile.discordLinked,
          discordLabel: discordContactLabel(profile.discordUserId),
        }}
        initial={{
          serverName: existing?.serverName ?? "",
          serverDiscord: existing?.discord ?? "",
          desired: (existing?.desired as "RETAINER" | "PAYG" | "UNSURE") ?? "UNSURE",
          notes: notesFromDescription(existing?.description),
          status: (existing?.status as "SUBMITTED" | "APPROVED" | "REJECTED") ?? null,
        }}
      />
    </PortalPageLayout>
  )
}
