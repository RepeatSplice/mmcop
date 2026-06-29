import { ChannelType, type Guild } from "discord.js"
import { config } from "../config.js"
import { prisma } from "../prisma.js"
import type { WorkspaceDiscordChannels } from "./workspace-discord-channels.js"
import { lockWorkspaceVisibility, privateVisibilityOverwrites } from "./workspace-permissions.js"


export async function provisionWorkspace(guild: Guild, input: {
  workspaceId: string
  name: string
  slug: string
  ownerUserId: string
}) {
  const categoryName = (input.name.slice(0, 100) || input.slug).replace(/[^\w\s-]/g, "").trim()
  const privateOverwrites = privateVisibilityOverwrites(guild)

  const category = await guild.channels.create({
    name: categoryName,
    type: ChannelType.GuildCategory,
    permissionOverwrites: privateOverwrites,
    reason: `Monarch workspace: ${input.slug}`,
  })

  const createText = (name: string, topic?: string) =>
    guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: category.id,
      topic,
      permissionOverwrites: privateOverwrites,
      reason: `Monarch workspace ${input.slug}`,
    })

  const [chat, announcements, logs, info] = await Promise.all([
    createText("chat", "Two-way chat with the Monarch portal"),
    createText("announcements", "Sprint and ticket updates"),
    createText("logs", "Automation and audit log"),
    createText("info", "Workspace links and onboarding"),
  ])

  const guildId = config.guildId()
  const portalUrl = `${config.portalPublicUrl()}/workspace/${input.slug}`

  await prisma.workspaceDiscord.upsert({
    where: { workspaceId: input.workspaceId },
    create: {
      workspaceId: input.workspaceId,
      guildId,
      categoryId: category.id,
      chatChannelId: chat.id,
      announcementsChannelId: announcements.id,
      logsChannelId: logs.id,
      infoChannelId: info.id,
      provisionedAt: new Date(),
      lastError: null,
    },
    update: {
      guildId,
      categoryId: category.id,
      chatChannelId: chat.id,
      announcementsChannelId: announcements.id,
      logsChannelId: logs.id,
      infoChannelId: info.id,
      provisionedAt: new Date(),
      lastError: null,
    },
  })

  const channels: WorkspaceDiscordChannels = {
    categoryId: category.id,
    chatChannelId: chat.id,
    announcementsChannelId: announcements.id,
    logsChannelId: logs.id,
    infoChannelId: info.id,
  }

  await lockWorkspaceVisibility(guild, channels)

  await info.send({
    embeds: [
      {
        title: input.name,
        description: [
          `**Portal:** ${portalUrl}`,
          `**Slug:** \`${input.slug}\``,
          "",
          "Use **#chat** to talk with your team — messages sync with the portal Chat tab.",
          "**#announcements** — sprint and ticket updates.",
          "**#logs** — system events (read-only).",
        ].join("\n"),
        color: 0xffffff,
      },
    ],
  })

  return channels
}

export { applyMemberPermissions } from "./member-permissions.js"
export { resolveDiscordUserId } from "./discord-user.js"
