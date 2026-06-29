import express from "express"
import { resolve } from "node:path"
import { AttachmentBuilder, type Client } from "discord.js"
import { TextChannel } from "discord.js"
import { config } from "../config.js"
import { requireInternalAuth } from "./auth.js"
import { prisma } from "../prisma.js"
import { deprovisionWorkspaceChannels } from "../discord/deprovision.js"
import {
  applyMemberPermissions,
  provisionWorkspace,
  resolveDiscordUserId,
} from "../discord/provision.js"
import {
  lockWorkspaceVisibility,
  repairWorkspacePermissions,
} from "../discord/workspace-permissions.js"

export function createHttpServer(client: Client) {
  const app = express()
  app.use(express.json({ limit: "30mb" }))

  app.get("/health", (_req, res) => {
    res.json({ ok: true, ready: client.isReady() })
  })

  app.use(requireInternalAuth)

  app.post("/provision", async (req, res) => {
    const { workspaceId, name, slug, ownerUserId } = req.body ?? {}
    if (!workspaceId || !name || !slug || !ownerUserId) {
      res.status(400).json({ error: "workspaceId, name, slug, ownerUserId required" })
      return
    }

    const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID!)
    if (!guild) {
      res.status(500).json({ error: "Guild not found" })
      return
    }

    try {
      const channels = await provisionWorkspace(guild, {
        workspaceId,
        name,
        slug,
        ownerUserId,
      })

      const discordUserId = await resolveDiscordUserId(ownerUserId)
      if (discordUserId) {
        await applyMemberPermissions(guild, channels, discordUserId, "add")
      }

      await repairWorkspacePermissions(guild, workspaceId).catch(() => {})

      res.json({ ok: true, channels })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Provision failed"
      await prisma.workspaceDiscord
        .updateMany({ where: { workspaceId }, data: { lastError: msg } })
        .catch(() => {})
      res.status(500).json({ error: msg })
    }
  })

  app.post("/sync-member", async (req, res) => {
    const { workspaceId, userId, action } = req.body ?? {}
    if (!workspaceId || !userId || !["add", "remove"].includes(action)) {
      res.status(400).json({ error: "workspaceId, userId, action (add|remove) required" })
      return
    }

    const discord = await prisma.workspaceDiscord.findUnique({ where: { workspaceId } })
    if (!discord?.provisionedAt) {
      res.status(404).json({ error: "Discord not provisioned" })
      return
    }

    const guild = await client.guilds.fetch(discord.guildId)
    const channelIds = {
      categoryId: discord.categoryId,
      chatChannelId: discord.chatChannelId,
      announcementsChannelId: discord.announcementsChannelId,
      logsChannelId: discord.logsChannelId,
      infoChannelId: discord.infoChannelId,
    }

    if (action === "remove") {
      const discordUserId = await resolveDiscordUserId(userId)
      if (discordUserId) {
        await applyMemberPermissions(guild, channelIds, discordUserId, "remove")
      }
      res.json({ ok: true })
      return
    }

    const discordUserId = await resolveDiscordUserId(userId)
    if (!discordUserId) {
      res.status(400).json({ error: "User has no linked Discord account" })
      return
    }

    await lockWorkspaceVisibility(guild, channelIds)
    await applyMemberPermissions(guild, channelIds, discordUserId, "add")
    res.json({ ok: true })
  })

  app.post("/repair-permissions", async (req, res) => {
    const { workspaceId } = req.body ?? {}
    if (!workspaceId) {
      res.status(400).json({ error: "workspaceId required" })
      return
    }

    const discord = await prisma.workspaceDiscord.findUnique({ where: { workspaceId } })
    if (!discord?.provisionedAt) {
      res.status(404).json({ error: "Discord not provisioned" })
      return
    }

    const guild = await client.guilds.fetch(discord.guildId)
    try {
      await repairWorkspacePermissions(guild, workspaceId)
      res.json({ ok: true })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Repair failed"
      res.status(500).json({ error: msg })
    }
  })

  app.post("/send-message", async (req, res) => {
    const { workspaceId, body, authorDisplayName, attachmentPaths } = req.body ?? {}
    const paths = Array.isArray(attachmentPaths) ? (attachmentPaths as string[]) : []
    const text = typeof body === "string" ? body.trim() : ""

    if (!workspaceId || (!text && paths.length === 0)) {
      res.status(400).json({ error: "workspaceId and body or attachmentPaths required" })
      return
    }

    const discord = await prisma.workspaceDiscord.findUnique({ where: { workspaceId } })
    if (!discord?.chatChannelId) {
      res.status(404).json({ error: "Chat channel not provisioned" })
      return
    }

    const channel = await client.channels.fetch(discord.chatChannelId)
    if (!channel?.isTextBased()) {
      res.status(500).json({ error: "Invalid chat channel" })
      return
    }

    const uploadsRoot = config.portalUploadsRoot()
    const files = paths.slice(0, 5).map((rel) => {
      const abs = resolve(uploadsRoot, rel.replace(/\\/g, "/"))
      return new AttachmentBuilder(abs)
    })

    const prefix = authorDisplayName ? `**${authorDisplayName}** (portal)` : ""
    const content = [prefix, text].filter(Boolean).join(text ? ": " : "").slice(0, 2000)

    const sent = await (channel as TextChannel).send({
      content: content || undefined,
      files: files.length > 0 ? files : undefined,
    })
    res.json({ ok: true, discordMessageId: sent.id })
  })

  app.post("/announce", async (req, res) => {
    const { workspaceId, title, body } = req.body ?? {}
    if (!workspaceId || !title) {
      res.status(400).json({ error: "workspaceId and title required" })
      return
    }

    const discord = await prisma.workspaceDiscord.findUnique({ where: { workspaceId } })
    if (!discord?.announcementsChannelId) {
      res.json({ ok: true, skipped: true })
      return
    }

    const channel = await client.channels.fetch(discord.announcementsChannelId)
    if (channel?.isTextBased()) {
      await (channel as TextChannel).send({
        embeds: [{ title, description: body?.slice(0, 4000) ?? "", color: 0xffffff }],
      })
    }
    res.json({ ok: true })
  })

  app.post("/deprovision", async (req, res) => {
    const { guildId, categoryId, channelIds } = req.body ?? {}
    if (!guildId || !categoryId) {
      res.status(400).json({ error: "guildId and categoryId required" })
      return
    }

    const guild = await client.guilds.fetch(guildId)
    const ids = Array.isArray(channelIds) ? (channelIds as string[]) : []

    try {
      await deprovisionWorkspaceChannels(guild, { categoryId, channelIds: ids })
      res.json({ ok: true })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Deprovision failed"
      res.status(500).json({ error: msg })
    }
  })

  app.post("/log", async (req, res) => {
    const { workspaceId, body } = req.body ?? {}
    if (!workspaceId || !body) {
      res.status(400).json({ error: "workspaceId and body required" })
      return
    }

    const discord = await prisma.workspaceDiscord.findUnique({ where: { workspaceId } })
    if (!discord?.logsChannelId) {
      res.json({ ok: true, skipped: true })
      return
    }

    const channel = await client.channels.fetch(discord.logsChannelId)
    if (channel?.isTextBased()) {
      await (channel as TextChannel).send(body.slice(0, 2000))
    }
    res.json({ ok: true })
  })

  return app
}
