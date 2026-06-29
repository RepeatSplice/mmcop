import { prisma } from "@/lib/prisma"
import { syncDiscordMember } from "@/lib/discord-bot-client"

/** After Discord OAuth link, sync channel access for every workspace the user belongs to. */
export async function syncDiscordForAllUserWorkspaces(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    select: { workspaceId: true },
  })

  for (const { workspaceId } of memberships) {
    const discord = await prisma.workspaceDiscord.findUnique({
      where: { workspaceId },
      select: { provisionedAt: true },
    })
    if (!discord?.provisionedAt) continue

    void syncDiscordMember({ workspaceId, userId, action: "add" }).catch((e) =>
      console.warn("[discord] sync-member failed", workspaceId, e)
    )
  }
}
