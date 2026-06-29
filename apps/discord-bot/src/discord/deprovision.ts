import type { Guild } from "discord.js"

export async function deprovisionWorkspaceChannels(
  guild: Guild,
  input: { categoryId: string; channelIds: string[] }
) {
  if (input.categoryId && input.categoryId !== "0") {
    const category = await guild.channels.fetch(input.categoryId).catch(() => null)
    if (category) {
      await category.delete("Monarch workspace deleted").catch(() => {})
      return
    }
  }

  for (const channelId of input.channelIds) {
    if (!channelId || channelId === "0") continue
    const ch = await guild.channels.fetch(channelId).catch(() => null)
    if (ch) await ch.delete("Monarch workspace deleted").catch(() => {})
  }
}
