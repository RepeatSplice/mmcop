import { randomUUID } from "crypto"
import * as fs from "fs/promises"
import * as path from "path"

export type StoredObject = {
  storagePath: string
  byteSize: number
}

export function objectKey(prefix: string, fileName: string): string {
  const safe = fileName.replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 180)
  return `${prefix}/${randomUUID()}-${safe}`.replace(/\\/g, "/")
}

/** Write bytes; returns relative storagePath under uploads/. */
export async function putObject(storagePath: string, buffer: Buffer): Promise<StoredObject> {
  const normalized = storagePath.replace(/\\/g, "/")
  const abs = path.join(process.cwd(), normalized)
  await fs.mkdir(path.dirname(abs), { recursive: true })
  await fs.writeFile(abs, buffer)
  return { storagePath: normalized, byteSize: buffer.byteLength }
}

export async function getObjectBuffer(storagePath: string): Promise<Buffer | null> {
  const abs = path.join(process.cwd(), storagePath.replace(/\\/g, "/"))
  try {
    return await fs.readFile(abs)
  } catch {
    return null
  }
}

export function resolveLocalPath(storagePath: string): string {
  return path.join(process.cwd(), storagePath.replace(/\\/g, "/"))
}
