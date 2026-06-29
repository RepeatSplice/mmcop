import { Events, type Attachment, type Client, type Message } from "discord.js"
import { config } from "../config.js"
import { prisma } from "../prisma.js"
import { notifyPortalInboundMessage } from "../portal-inbound.js"
import { registerOnce } from "../lib/register-once.js"

async function downloadDiscordAttachment(attachment: Attachment): Promise<{
  fileName: string
  mimeType: string
  contentBase64: string
  discordAttachmentId: string
} | null> {
  try {
    const res = await fetch(attachment.url, {
      headers: { Authorization: `Bot ${config.discordToken()}` },
    })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength === 0) return null
    return {
      fileName: attachment.name || "attachment",
      mimeType: attachment.contentType || "application/octet-stream",
      contentBase64: buf.toString("base64"),
      discordAttachmentId: attachment.id,
    }
  } catch (e) {
    console.warn("[gateway] attachment download failed", attachment.id, e)
    return null
  }
}

const GATEWAY_KEY = Symbol("messageCreate")

export function registerGatewayHandlers(client: Client) {
  registerOnce(client, Events.MessageCreate, GATEWAY_KEY, async (message: Message) => {
    if (message.author.bot) return
    if (!message.guild) return

    const discordRow = await prisma.workspaceDiscord.findFirst({
      where: { chatChannelId: message.channel.id },
    })
    if (!discordRow) return

    const body = message.content?.trim() ?? ""
    const attachmentPayloads = (
      await Promise.all([...message.attachments.values()].map(downloadDiscordAttachment))
    ).filter((a): a is NonNullable<typeof a> => a !== null)

    if (!body && attachmentPayloads.length === 0) return

    try {
      await notifyPortalInboundMessage({
        workspaceId: discordRow.workspaceId,
        discordMessageId: message.id,
        body,
        authorDiscordId: message.author.id,
        authorDisplayName:
          message.member?.displayName ?? message.author.displayName ?? message.author.username,
        attachments: attachmentPayloads,
      })
    } catch (e) {
      console.error("[gateway] inbound failed", e)
    }
  })
}
