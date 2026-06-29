import { ChannelType, type Guild, type GuildChannel } from "discord.js"
import { config } from "../../config.js"
import type { CaptchaConfig } from "./config.js"

async function patchChannel(
  channel: GuildChannel,
  cfg: CaptchaConfig,
  guild: Guild
) {
  const everyone = guild.roles.everyone.id
  const isVerify = channel.id === cfg.channelId

  await channel.permissionOverwrites.edit(everyone, {
    ViewChannel: isVerify ? false : false,
  })

  await channel.permissionOverwrites.edit(cfg.unverifiedRoleId, {
    ViewChannel: isVerify,
    SendMessages: isVerify,
    ReadMessageHistory: isVerify,
    AttachFiles: isVerify,
  })

  await channel.permissionOverwrites.edit(cfg.verifiedRoleId, {
    ViewChannel: !isVerify,
    SendMessages: !isVerify ? false : undefined,
    ReadMessageHistory: !isVerify ? false : undefined,
  })

  const staffRoleId = config.staffRoleId()
  if (staffRoleId) {
    await channel.permissionOverwrites.edit(staffRoleId, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    })
  }

  const me = guild.members.me
  if (me) {
    await channel.permissionOverwrites.edit(me.id, {
      ViewChannel: true,
      SendMessages: true,
      ManageChannels: true,
      ManageRoles: true,
    })
  }
}

export async function applyCaptchaPermissions(guild: Guild, cfg: CaptchaConfig) {
  const channels = await guild.channels.fetch()
  for (const channel of channels.values()) {
    if (!channel || channel.isDMBased()) continue
    if (
      channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildVoice &&
      channel.type !== ChannelType.GuildCategory &&
      channel.type !== ChannelType.GuildAnnouncement &&
      channel.type !== ChannelType.GuildStageVoice &&
      channel.type !== ChannelType.GuildForum
    ) {
      continue
    }
    await patchChannel(channel as GuildChannel, cfg, guild)
  }
}
