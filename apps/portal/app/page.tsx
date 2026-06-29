import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { discordContactLabel, getApplicationProfile } from "@/lib/application-profile"
import { HomeSignedIn } from "@/components/home/HomeSignedIn"
import { HomeSignedOut } from "@/components/home/HomeSignedOut"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    return <HomeSignedOut />
  }

  const userId = (session.user as { id?: string }).id!
  const firstName = session.user.name?.split(" ")[0] ?? "there"

  const [staff, memberships, application, profile] = await Promise.all([
    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),
    prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: { select: { id: true, name: true, slug: true, active: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.application.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { status: true },
    }),
    getApplicationProfile(userId),
  ])

  const workspaces = memberships
    .filter((m) => m.workspace.active)
    .map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
    }))

  return (
    <HomeSignedIn
      firstName={firstName}
      email={session.user.email}
      name={profile.name}
      discordLinked={profile.discordLinked}
      discordLabel={discordContactLabel(profile.discordUserId)}
      isStaff={Boolean(staff?.active)}
      workspaces={workspaces}
      application={application ? { status: application.status } : null}
    />
  )
}
