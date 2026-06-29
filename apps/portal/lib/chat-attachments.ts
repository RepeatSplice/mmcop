import { randomUUID } from "crypto"
import * as fs from "fs/promises"
import * as path from "path"

export const MAX_CHAT_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 25 * 1024 * 1024)
export const MAX_CHAT_FILES_PER_MESSAGE = 5
export const MAX_CHAT_BODY_LENGTH = 4000

export function chatUploadHttpStatus(err: unknown): number {
  const msg = err instanceof Error ? err.message : String(err)
  if (/too large/i.test(msg)) return 413
  if (/empty file/i.test(msg)) return 400
  return 400
}

export async function deleteChatFiles(storagePaths: string[]) {
  await Promise.all(
    storagePaths.map(async (rel) => {
      try {
        await fs.unlink(chatUploadAbsPath(rel))
      } catch {
        // ignore missing files
      }
    })
  )
}

export function safeChatFileName(name: string) {
  const base = path.basename(name || "file")
  return base.replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 180)
}

export function chatUploadRelPath(workspaceId: string, messageId: string, fileName: string) {
  return path.join("uploads", "chat", workspaceId, messageId, fileName).replace(/\\/g, "/")
}

export function chatUploadAbsPath(relPath: string) {
  return path.join(process.cwd(), relPath)
}

export type SavedChatFile = {
  fileName: string
  mimeType: string
  byteSize: number
  storagePath: string
  buffer: Buffer
}

export async function saveChatFileFromBuffer(input: {
  workspaceId: string
  messageId: string
  fileName: string
  mimeType: string
  buffer: Buffer
}): Promise<SavedChatFile> {
  const byteSize = input.buffer.byteLength
  if (byteSize <= 0) throw new Error("Empty file")
  if (byteSize > MAX_CHAT_UPLOAD_BYTES) {
    throw new Error(`File too large (max ${MAX_CHAT_UPLOAD_BYTES} bytes)`)
  }

  const fileName = safeChatFileName(input.fileName)
  const attachmentId = randomUUID()
  const storedName = `${attachmentId}-${fileName}`
  const storagePath = chatUploadRelPath(input.workspaceId, input.messageId, storedName)
  const absPath = chatUploadAbsPath(storagePath)

  await fs.mkdir(path.dirname(absPath), { recursive: true })
  await fs.writeFile(absPath, input.buffer)

  return {
    fileName,
    mimeType: input.mimeType || "application/octet-stream",
    byteSize,
    storagePath,
    buffer: input.buffer,
  }
}

export type ChatAttachmentDto = {
  id: string
  fileName: string
  mimeType: string
  byteSize: number
  url: string
}

export function mapChatAttachments(
  rows: Array<{
    id: string
    fileName: string
    mimeType: string
    byteSize: number
  }>
): ChatAttachmentDto[] {
  return rows.map((a) => ({
    id: a.id,
    fileName: a.fileName,
    mimeType: a.mimeType,
    byteSize: a.byteSize,
    url: `/api/chat/attachments/${a.id}`,
  }))
}

export const chatMessageSelect = {
  id: true,
  body: true,
  authorUserId: true,
  authorDiscordId: true,
  authorDisplayName: true,
  source: true,
  createdAt: true,
  attachments: {
    select: { id: true, fileName: true, mimeType: true, byteSize: true },
    orderBy: { createdAt: "asc" as const },
  },
} as const
