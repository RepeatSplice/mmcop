import crypto from "crypto"
import { sha256Hex } from "@/lib/crypto"

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function generateInviteToken() {
  return crypto.randomBytes(32).toString("hex")
}

export function hashInviteToken(token: string) {
  return sha256Hex(token)
}

