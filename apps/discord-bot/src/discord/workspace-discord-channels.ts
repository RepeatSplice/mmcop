export type WorkspaceDiscordChannels = {
  categoryId: string
  chatChannelId: string
  announcementsChannelId: string
  logsChannelId: string
  infoChannelId: string
}

export function workspaceChannelIds(discord: WorkspaceDiscordChannels): string[] {
  return [
    discord.categoryId,
    discord.chatChannelId,
    discord.announcementsChannelId,
    discord.logsChannelId,
    discord.infoChannelId,
  ]
}
