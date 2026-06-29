import { NextRequest, NextResponse } from "next/server"
import * as path from "path"
import * as fs from "fs/promises"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id as string
  const { id } = await ctx.params

  const attachment = await prisma.ticketAttachment.findUnique({
    where: { id },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      byteSize: true,
      storagePath: true,
      ticket: { select: { id: true, workspaceId: true } },
    },
  })
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [member, staff] = await Promise.all([
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: attachment.ticket.workspaceId, userId } },
      select: { id: true },
    }),
    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),
  ])
  const canRead = Boolean(staff?.active) || Boolean(member)
  if (!canRead) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const absPath = path.join(process.cwd(), attachment.storagePath)
  const buf = await fs.readFile(absPath).catch(() => null)
  if (!buf) return NextResponse.json({ error: "Missing file on disk" }, { status: 404 })

  const isInline =
    attachment.mimeType.startsWith("image/") ||
    attachment.mimeType === "application/pdf" ||
    attachment.mimeType.startsWith("text/")

  return new NextResponse(buf, {
    headers: {
      "Content-Type": attachment.mimeType || "application/octet-stream",
      "Content-Length": String(attachment.byteSize),
      "Content-Disposition": `${isInline ? "inline" : "attachment"}; filename="${encodeURIComponent(
        attachment.fileName
      )}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  })
}

