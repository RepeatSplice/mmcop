import { NextRequest, NextResponse } from "next/server"

import { randomUUID } from "crypto"

import { auth } from "@/lib/auth"

import {

  MAX_CHAT_BODY_LENGTH,

  MAX_CHAT_FILES_PER_MESSAGE,

  chatMessageSelect,

  chatUploadHttpStatus,

  deleteChatFiles,

  saveChatFileFromBuffer,

} from "@/lib/chat-attachments"

import { notifyChatMessage } from "@/lib/chat-notifications"

import { serializeChatMessage } from "@/lib/chat-message"

import { sendDiscordChatMessage } from "@/lib/discord-bot-client"

import { prisma } from "@/lib/prisma"

import { checkRateLimit } from "@/lib/rate-limit"



export const runtime = "nodejs"

export const dynamic = "force-dynamic"



async function canAccessWorkspace(workspaceId: string, userId: string) {

  const [member, staff] = await Promise.all([

    prisma.workspaceMember.findUnique({

      where: { workspaceId_userId: { workspaceId, userId } },

      select: { id: true, role: true },

    }),

    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),

  ])

  return { member, staff, canRead: Boolean(member || staff?.active) }

}



export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {

  const session = await auth()

  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })



  const userId = (session.user as { id?: string }).id!

  const { id: workspaceId } = await ctx.params



  const access = await canAccessWorkspace(workspaceId, userId)

  if (!access.canRead) return NextResponse.json({ error: "Forbidden" }, { status: 403 })



  const { searchParams } = new URL(req.url)

  const cursor = searchParams.get("cursor")

  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)))



  const messages = await prisma.workspaceChatMessage.findMany({

    where: {

      workspaceId,

      channel: "CHAT",

      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),

    },

    orderBy: { createdAt: "desc" },

    take: limit + 1,

    select: chatMessageSelect,

  })



  const hasMore = messages.length > limit

  const page = hasMore ? messages.slice(0, limit) : messages

  const nextCursor = hasMore ? page[page.length - 1]!.createdAt.toISOString() : null



  return NextResponse.json({

    messages: page.reverse().map(serializeChatMessage),

    nextCursor,

  })

}



export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {

  const session = await auth()

  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })



  const userId = (session.user as { id?: string }).id!

  const { id: workspaceId } = await ctx.params



  const access = await canAccessWorkspace(workspaceId, userId)

  const canWrite =

    Boolean(access.staff?.active) || (access.member && access.member.role !== "VIEWER")

  if (!canWrite) return NextResponse.json({ error: "Forbidden" }, { status: 403 })



  const limited = checkRateLimit(`chat-post:${userId}`, { max: 30, windowMs: 60_000 })

  if (!limited.ok) {

    return NextResponse.json(

      { error: "Too many messages. Slow down and try again." },

      { status: 429, headers: { "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)) } }

    )

  }



  const discord = await prisma.workspaceDiscord.findUnique({

    where: { workspaceId },

    select: { provisionedAt: true },

  })

  if (!discord?.provisionedAt) {

    return NextResponse.json({ error: "Discord not provisioned for this workspace" }, { status: 503 })

  }



  const contentType = req.headers.get("content-type") ?? ""

  let bodyText = ""

  let files: File[] = []



  if (contentType.includes("multipart/form-data")) {

    const form = await req.formData()

    bodyText = String(form.get("body") ?? "").trim()

    files = form.getAll("files").filter((v) => v instanceof File) as File[]

  } else {

    const json = await req.json().catch(() => null)

    bodyText = String(json?.body ?? "").trim()

  }



  if (!bodyText && files.length === 0) {

    return NextResponse.json({ error: "Message or file required" }, { status: 400 })

  }

  if (bodyText.length > MAX_CHAT_BODY_LENGTH) {

    return NextResponse.json(

      { error: `Message too long (max ${MAX_CHAT_BODY_LENGTH} characters)` },

      { status: 400 }

    )

  }

  if (files.length > MAX_CHAT_FILES_PER_MESSAGE) {

    return NextResponse.json({ error: `Max ${MAX_CHAT_FILES_PER_MESSAGE} files per message` }, { status: 400 })

  }



  const displayName = session.user?.name ?? session.user?.email?.split("@")[0] ?? "Member"

  const messageId = randomUUID()



  const message = await prisma.workspaceChatMessage.create({

    data: {

      id: messageId,

      workspaceId,

      channel: "CHAT",

      body: bodyText,

      authorUserId: userId,

      authorDisplayName: displayName,

      source: "PORTAL",

    },

    select: chatMessageSelect,

  })



  const savedFiles: Array<{

    storagePath: string

    fileName: string

    mimeType: string

    byteSize: number

  }> = []



  try {

    for (const f of files) {

      const buf = Buffer.from(await f.arrayBuffer())

      const saved = await saveChatFileFromBuffer({

        workspaceId,

        messageId,

        fileName: f.name,

        mimeType: f.type || "application/octet-stream",

        buffer: buf,

      })

      savedFiles.push(saved)

    }



    if (savedFiles.length > 0) {

      await prisma.workspaceChatAttachment.createMany({

        data: savedFiles.map((f) => ({

          messageId,

          fileName: f.fileName,

          mimeType: f.mimeType,

          byteSize: f.byteSize,

          storagePath: f.storagePath,

        })),

      })

    }

  } catch (err) {

    await deleteChatFiles(savedFiles.map((f) => f.storagePath))

    await prisma.workspaceChatMessage.delete({ where: { id: messageId } }).catch(() => {})

    const status = chatUploadHttpStatus(err)

    const msg = err instanceof Error ? err.message : "Upload failed"

    return NextResponse.json({ error: msg }, { status })

  }



  const fullMessage = await prisma.workspaceChatMessage.findUnique({

    where: { id: messageId },

    select: chatMessageSelect,

  })



  const botResult = await sendDiscordChatMessage({

    workspaceId,

    body: bodyText,

    authorDisplayName: displayName,

    attachmentPaths: savedFiles.map((f) => f.storagePath),

  })



  if (botResult.ok && (botResult.data as { discordMessageId?: string })?.discordMessageId) {

    await prisma.workspaceChatMessage.update({

      where: { id: message.id },

      data: {

        discordMessageId: (botResult.data as { discordMessageId: string }).discordMessageId,

      },

    })

  }



  const workspace = await prisma.workspace.findUnique({

    where: { id: workspaceId },

    select: { slug: true, name: true },

  })

  if (workspace) {

    void notifyChatMessage({

      workspaceId,

      workspaceSlug: workspace.slug,

      workspaceName: workspace.name,

      body: bodyText,

      authorUserId: userId,

      authorDisplayName: displayName,

    })

  }



  return NextResponse.json(

    { message: serializeChatMessage(fullMessage ?? message) },

    { status: 201 }

  )

}

