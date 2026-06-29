import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hmacSha256Hex, timingSafeEqual } from "@/lib/crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function verifySignature(secret: string, body: string, sigHeader: string | null) {
  if (!sigHeader) return false
  const expected = `sha256=${hmacSha256Hex(secret, body)}`
  return timingSafeEqual(expected, sigHeader)
}

export async function POST(req: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 501 })

  const bodyText = await req.text()
  const sig = req.headers.get("x-hub-signature-256")
  if (!verifySignature(secret, bodyText, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const event = req.headers.get("x-github-event") || "unknown"
  const payload = JSON.parse(bodyText) as any
  const repoFullName: string | null =
    payload?.repository?.full_name ?? payload?.repo?.full_name ?? null

  if (!repoFullName) return NextResponse.json({ ok: true, ignored: true })

  const conn = await prisma.integrationConnection.findUnique({
    where: { type_externalId: { type: "GITHUB_REPO", externalId: repoFullName } },
  })
  if (!conn) return NextResponse.json({ ok: true, ignored: true })

  const summary =
    event === "push"
      ? `GitHub push to ${payload?.ref ?? ""}: ${payload?.head_commit?.message ?? ""}`
      : event === "pull_request"
        ? `GitHub PR: ${payload?.pull_request?.title ?? ""}`
        : event === "issues"
          ? `GitHub issue: ${payload?.issue?.title ?? ""}`
          : `GitHub ${event}`

  await prisma.activityEvent.create({
    data: {
      workspaceId: conn.workspaceId,
      jobId: conn.jobId,
      source: "GITHUB",
      type: `github.${event}`,
      body: summary,
    },
  })

  return NextResponse.json({ ok: true })
}

