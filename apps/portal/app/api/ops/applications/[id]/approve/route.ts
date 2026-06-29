import { NextRequest, NextResponse } from "next/server"
import { requireStaff } from "@/lib/ops"
import { provisionWorkspaceFromApplication } from "@/lib/provision-from-application"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await requireStaff()
  const { id } = await ctx.params

  const result = await provisionWorkspaceFromApplication(id)
  if (!result.ok) {
    const url = new URL("/ops/applications", req.url)
    url.searchParams.set("error", encodeURIComponent(result.error))
    return NextResponse.redirect(url)
  }

  return NextResponse.redirect(new URL("/ops/applications", req.url))
}
