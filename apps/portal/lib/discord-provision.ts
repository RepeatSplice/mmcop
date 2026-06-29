import { prisma } from "@/lib/prisma"
import {
  provisionWorkspaceDiscord,
  repairWorkspaceDiscordPermissions,
  syncDiscordMember,
} from "@/lib/discord-bot-client"

export async function tryProvisionWorkspaceDiscord(input: {
  workspaceId: string
  name: string
  slug: string
  ownerUserId: string
}) {
  const result = await provisionWorkspaceDiscord(input)
  if (!result.ok) {
    const guildId = process.env.DISCORD_GUILD_ID ?? "0"
    await prisma.workspaceDiscord
      .upsert({
        where: { workspaceId: input.workspaceId },
        create: {
          workspaceId: input.workspaceId,
          guildId,
          categoryId: "0",
          chatChannelId: "0",
          announcementsChannelId: "0",
          logsChannelId: "0",
          infoChannelId: "0",
          lastError: result.error,
        },
        update: { lastError: result.error },
      })
      .catch(() => {})
    return { ok: false as const, error: result.error }
  }
  return { ok: true as const }
}

export async function trySyncDiscordMember(workspaceId: string, userId: string, action: "add" | "remove") {
  return syncDiscordMember({ workspaceId, userId, action })
}

export async function tryRepairWorkspaceDiscordPermissions(workspaceId: string) {
  return repairWorkspaceDiscordPermissions(workspaceId)
}
