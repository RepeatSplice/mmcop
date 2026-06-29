import { NextRequest } from "next/server"

export function verifyInternalBearer(req: NextRequest): boolean {
  const secret = process.env.DISCORD_BOT_INTERNAL_SECRET
  if (!secret) return false
  const auth = req.headers.get("authorization") || ""
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : ""
  return token === secret
}
