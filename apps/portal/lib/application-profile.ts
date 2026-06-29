import { getDiscordUserId } from "@/lib/discord-user"
import { prisma } from "@/lib/prisma"

export type ApplicationProfile = {
  email: string
  name: string | null
  discordLinked: boolean
  discordUserId: string | null
}

export async function getApplicationProfile(userId: string): Promise<ApplicationProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  })

  const discordUserId = await getDiscordUserId(userId)

  return {
    email: user?.email ?? "",
    name: user?.name ?? null,
    discordLinked: Boolean(discordUserId),
    discordUserId,
  }
}

export function defaultServerName(profile: ApplicationProfile): string {
  const fromName = profile.name?.trim()
  if (fromName) return fromName
  const local = profile.email.split("@")[0]?.trim()
  if (local) return local
  return "New server"
}

export const DEFAULT_APPLICATION_DESCRIPTION =
  "Portal access request. Server name and project details will be added after workspace setup."

export function defaultApplicationDescription(notes?: string | null): string {
  const trimmed = notes?.trim()
  if (trimmed) return trimmed
  return DEFAULT_APPLICATION_DESCRIPTION
}

export function isDefaultApplicationDescription(description: string): boolean {
  return description.trim() === DEFAULT_APPLICATION_DESCRIPTION
}

export function discordContactLabel(discordUserId: string | null): string | null {
  if (!discordUserId) return null
  return `Connected · ID ${discordUserId}`
}
