import { prisma } from "../prisma.js"

export async function resolveDiscordUserId(userId: string): Promise<string | null> {
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
