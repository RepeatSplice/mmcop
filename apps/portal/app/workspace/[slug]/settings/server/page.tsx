import { redirect } from "next/navigation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * The dedicated Server settings page is gone — status & manual controls now
 * live on Summary. Anyone still hitting this URL is bounced to the summary.
 */
export default async function ServerSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/workspace/${encodeURIComponent(slug)}/summary`)
}
