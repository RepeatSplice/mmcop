import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { z } from "zod"
import { chatMessageSelect, saveChatFileFromBuffer } from "@/lib/chat-attachments"
import { notifyChatMessage } from "@/lib/chat-notifications"
import { serializeChatMessage } from "@/lib/chat-message"
import { verifyInternalBearer } from "@/lib/internal-auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_ATTACHMENTS = 5
const MAX_BASE64_CHARS = 7_000_000 // ~5 MB decoded
const MAX_DECODED_BYTES = 5 * 1024 * 1024

const attachmentSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(200),
  contentBase64: z.string().min(1).max(MAX_BASE64_CHARS),
  discordAttachmentId: z.string().optional(),
})

const inboundSchema = z.object({
  workspaceId: z.string().min(1),
  discordMessageId: z.string().min(1),
  body: z.string().optional().default(""),
  authorDiscordId: z.string().min(1),
  authorDisplayName: z.string().min(1),
  attachments: z.array(attachmentSchema).max(MAX_ATTACHMENTS).optional().default([]),
})

export async function POST(req: NextRequest) {
  if (!verifyInternalBearer(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = inboundSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const {
    workspaceId,
    discordMessageId,
    body,
    authorDiscordId,
    authorDisplayName,
    attachments,
  } = parsed.data

  if (!body.trim() && attachments.length === 0) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 })
  }

  const discord = await prisma.workspaceDiscord.findUnique({
    where: { workspaceId },
    select: { chatChannelId: true },
  })
  if (!discord) {
    return NextResponse.json({ error: "Workspace not provisioned" }, { status: 404 })
  }

  const existing = await prisma.workspaceChatMessage.findUnique({
    where: { discordMessageId },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  const user = await prisma.user.findUnique({
    where: { discordUserId: authorDiscordId },
    select: { id: true },
  })

  const messageId = randomUUID()
  const savedAttachments: Array<{
    fileName: string
    mimeType: string
    byteSize: number
    storagePath: string
    discordAttachmentId?: string
  }> = []

  for (const a of attachments) {
    const buffer = Buffer.from(a.contentBase64, "base64")
    if (buffer.byteLength > MAX_DECODED_BYTES) {
      return NextResponse.json({ error: "Attachment too large" }, { status: 413 })
    }
    const saved = await saveChatFileFromBuffer({
      workspaceId,
      messageId,
      fileName: a.fileName,
      mimeType: a.mimeType,
      buffer,
    })
    savedAttachments.push({
      fileName: saved.fileName,
      mimeType: saved.mimeType,
      byteSize: saved.byteSize,
      storagePath: saved.storagePath,
      discordAttachmentId: a.discordAttachmentId,
    })
  }

  const message = await prisma.workspaceChatMessage.create({
    data: {
      id: messageId,
      workspaceId,
      channel: "CHAT",
      body: body.trim(),
      authorUserId: user?.id ?? null,
      authorDiscordId,
      authorDisplayName,
      source: "DISCORD",
      discordMessageId,
      attachments: {
        create: savedAttachments.map((a) => ({
          fileName: a.fileName,
          mimeType: a.mimeType,
          byteSize: a.byteSize,
          storagePath: a.storagePath,
          discordAttachmentId: a.discordAttachmentId,
        })),
      },
    },
    select: chatMessageSelect,
  })

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { slug: true, name: true },
  })
  if (workspace) {
    void notifyChatMessage({
      workspaceId,
      workspaceSlug: workspace.slug,
      workspaceName: workspace.name,
      body: body.trim(),
      authorUserId: user?.id ?? null,
      authorDisplayName,
    })
  }

  return NextResponse.json({ message: serializeChatMessage(message) })
}
