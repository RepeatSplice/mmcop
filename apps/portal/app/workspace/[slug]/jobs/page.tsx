import { redirect } from "next/navigation"
import { requireWorkspaceMember } from "@/lib/workspace"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function JobsRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const access = await requireWorkspaceMember(slug)
  redirect(`/workspace/${access.workspace.slug}/list`)
}
