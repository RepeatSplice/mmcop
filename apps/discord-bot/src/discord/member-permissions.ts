import { type Guild, type GuildChannel } from "discord.js"

import type { WorkspaceDiscordChannels } from "./workspace-discord-channels.js"



const DISCORD_SNOWFLAKE_RE = /^\d{17,20}$/



export async function applyMemberPermissions(

  guild: Guild,

  discord: WorkspaceDiscordChannels,

  discordUserId: string,

  action: "add" | "remove"

) {

  if (!DISCORD_SNOWFLAKE_RE.test(discordUserId)) {

    console.warn("[discord] applyMemberPermissions: invalid discord user id", discordUserId)

    return

  }



  try {

    await guild.members.fetch(discordUserId)

  } catch (err) {

    console.warn(

      "[discord] applyMemberPermissions: member not in guild",

      discordUserId,

      err instanceof Error ? err.message : err

    )

    return

  }



  const channelIds = [

    discord.chatChannelId,

    discord.announcementsChannelId,

    discord.logsChannelId,

    discord.infoChannelId,

  ]



  for (const channelId of channelIds) {

    try {

      const ch = await guild.channels.fetch(channelId)

      if (!ch || !("permissionOverwrites" in ch)) continue

      const channel = ch as GuildChannel



      if (action === "remove") {

        await channel.permissionOverwrites.delete(discordUserId).catch(() => {})

        continue

      }



      const isChat = channelId === discord.chatChannelId

      await channel.permissionOverwrites.edit(discordUserId, {

        ViewChannel: true,

        SendMessages: isChat,

        ReadMessageHistory: true,

      })

    } catch (err) {

      console.warn(

        "[discord] applyMemberPermissions: channel overwrite failed",

        channelId,

        discordUserId,

        err instanceof Error ? err.message : err

      )

    }

  }



  try {

    const category = await guild.channels.fetch(discord.categoryId)

    if (category && "permissionOverwrites" in category) {

      if (action === "remove") {

        await category.permissionOverwrites.delete(discordUserId).catch(() => {})

      } else {

        await category.permissionOverwrites.edit(discordUserId, {

          ViewChannel: true,

        })

      }

    }

  } catch (err) {

    console.warn(

      "[discord] applyMemberPermissions: category overwrite failed",

      discord.categoryId,

      discordUserId,

      err instanceof Error ? err.message : err

    )

  }

}

