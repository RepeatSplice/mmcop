import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import * as path from "path"
import * as fs from "fs/promises"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 25 * 1024 * 1024)

function safeName(name: string) {
  const base = path.basename(name || "file")
  return base.replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 180)
}

function uploadStatus(err: unknown): number {
  const msg = err instanceof Error ? err.message : String(err)
  if (/too large/i.test(msg)) return 413
  return 500
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id!
  const { id } = await ctx.params

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { id: true, workspaceId: true, key: true, title: true },
  })
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [member, staff] = await Promise.all([
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: ticket.workspaceId, userId } },
      select: { role: true },
    }),
    prisma.staffProfile.findUnique({ where: { userId }, select: { active: true } }),
  ])
  const canWrite = Boolean(staff?.active) || (member && member.role !== "VIEWER")
  if (!canWrite) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const form = await req.formData()
  const files = form.getAll("files").filter((v) => v instanceof File) as File[]
  if (files.length === 0) return NextResponse.json({ error: "No files uploaded" }, { status: 400 })

  type PendingFile = {
    attachmentId: string
    fileName: string
    mimeType: string
    byteSize: number
    relPath: string
    absPath: string
    buffer: Buffer
  }

  const pending: PendingFile[] = []

  try {
    for (const f of files) {
      const byteSize = f.size
      if (!Number.isFinite(byteSize) || byteSize <= 0) continue
      if (byteSize > MAX_UPLOAD_BYTES) {
        throw new Error(`File too large (max ${MAX_UPLOAD_BYTES} bytes)`)
      }

      const attachmentId = randomUUID()
      const fileName = safeName(f.name)
      const mimeType = f.type || "application/octet-stream"
      const relPath = path
        .join("uploads", ticket.workspaceId, ticket.id, `${attachmentId}-${fileName}`)
        .replace(/\\/g, "/")
      const absPath = path.join(process.cwd(), relPath)
      const buffer = Buffer.from(await f.arrayBuffer())

      pending.push({
        attachmentId,
        fileName,
        mimeType,
        byteSize,
        relPath,
        absPath,
        buffer,
      })
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid upload" },
      { status: uploadStatus(err) }
    )
  }

  if (pending.length === 0) {
    return NextResponse.json({ error: "No valid files to upload" }, { status: 400 })
  }

  let attachments: Array<{
    id: string
    fileName: string
    mimeType: string
    byteSize: number
    url: string
    createdAt: string
    absPath: string
    buffer: Buffer
  }> = []

  try {
    attachments = await prisma.$transaction(async (tx) => {
      const created: typeof attachments = []

      for (const p of pending) {
        const row = await tx.ticketAttachment.create({
          data: {
            id: p.attachmentId,
            ticketId: ticket.id,
            uploaderId: userId,
            fileName: p.fileName,
            mimeType: p.mimeType,
            byteSize: p.byteSize,
            storagePath: p.relPath,
          },
          select: { id: true, fileName: true, mimeType: true, byteSize: true, createdAt: true },
        })

        created.push({
          id: row.id,
          fileName: row.fileName,
          mimeType: row.mimeType,
          byteSize: row.byteSize,
          url: `/api/attachments/${row.id}`,
          createdAt: row.createdAt.toISOString(),
          absPath: p.absPath,
          buffer: p.buffer,
        })
      }

      if (created.length > 0) {
        await tx.activityEvent.create({
          data: {
            workspaceId: ticket.workspaceId,
            ticketId: ticket.id,
            source: "PORTAL",
            type: "ticket.attachment",
            body: `${ticket.key}: attachment uploaded`,
            actorUserId: userId,
          },
        })
      }

      return created
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    )
  }

  const written: string[] = []
  try {
    for (const a of attachments) {
      await fs.mkdir(path.dirname(a.absPath), { recursive: true })
      await fs.writeFile(a.absPath, a.buffer)
      written.push(a.absPath)
    }
  } catch (err) {
    await Promise.all(written.map((p) => fs.unlink(p).catch(() => {})))
    await prisma.ticketAttachment.deleteMany({
      where: { id: { in: attachments.map((a) => a.id) } },
    })
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to store files" },
      { status: 500 }
    )
  }

  const response = attachments.map(({ absPath: _a, buffer: _b, ...rest }) => rest)

  return NextResponse.json({ attachments: response }, { status: 201 })
}
