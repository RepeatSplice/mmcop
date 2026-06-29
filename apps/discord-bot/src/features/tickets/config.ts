import { prisma } from "../../prisma.js"
import type { DiscordTicketType } from "./types.js"

export async function getTicketPanel(guildId: string, type: DiscordTicketType) {
  return prisma.discordTicketPanel.findUnique({
    where: { guildId_type: { guildId, type } },
  })
}

export async function getTicketCategoryId(guildId: string): Promise<string | null> {
  const row = await prisma.discordTicketPanel.findFirst({
    where: { guildId, categoryId: { not: null } },
    select: { categoryId: true },
  })
  return row?.categoryId ?? null
}
