import { prisma } from "@/lib/prisma"

/** Resolve Discord snowflake ID for a portal user. */
export async function getDiscordUserId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { discordUserId: true },
  })
  if (user?.discordUserId) return user.discordUserId

  const account = await prisma.account.findFirst({
    where: { userId, provider: "discord" },
    select: { providerAccountId: true },
  })
  if (!account) return null

  await prisma.user.update({
    where: { id: userId },
    data: { discordUserId: account.providerAccountId },
  })
  return account.providerAccountId
}

/** Sync discordUserId on OAuth link (call from auth events if needed). */
export async function syncDiscordUserIdFromAccount(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "discord" },
    select: { providerAccountId: true },
  })
  if (!account) return
  await prisma.user.update({
    where: { id: userId },
    data: { discordUserId: account.providerAccountId },
  })
}
