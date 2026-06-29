import { NextRequest, NextResponse } from "next/server"
import * as fs from "fs/promises"
import { auth } from "@/lib/auth"
import { chatUploadAbsPath } from "@/lib/chat-attachments"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params

  const attachment = await prisma.workspaceChatAttachment.findUnique({
    where: { id },
    select: {
      fileName: true,
      mimeType: true,
      byteSize: true,
      storagePath: true,
      message: { select: { workspaceId: true } },
    },
  })
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [member, staff] = await Promise.all([
    prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: attachment.message.workspaceId, userId },
      },
      select: { id: true },
    }),
    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),
  ])
  if (!member && !staff?.active) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const absPath = chatUploadAbsPath(attachment.storagePath)
  let buf: Buffer
  try {
    buf = await fs.readFile(absPath)
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 404 })
  }

  const isInline =
    attachment.mimeType.startsWith("image/") ||
    attachment.mimeType === "application/pdf" ||
    attachment.mimeType.startsWith("text/")

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": attachment.mimeType || "application/octet-stream",
      "Content-Length": String(attachment.byteSize),
      "Content-Disposition": `${isInline ? "inline" : "attachment"}; filename="${encodeURIComponent(
        attachment.fileName
      )}"`,
      "Cache-Control": "private, max-age=3600",
    },
  })
}
