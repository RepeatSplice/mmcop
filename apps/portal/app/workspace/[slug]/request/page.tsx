import Link from "next/link"
import { requireWorkspaceMember } from "@/lib/workspace"
import { NewTicketRequestForm } from "@/components/tickets/NewTicketRequestForm"
import { PageShell } from "@/components/layout/PageShell"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function RequestWorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const access = await requireWorkspaceMember(slug)
  const canEdit = access.role !== "VIEWER"
  const base = `/workspace/${access.workspace.slug}`

  return (
    <PageShell>
      <div className="bg-surface-1 px-4 sm:px-5 py-6 border-b border-border">
        <h2 className="text-sm font-medium text-fg">Request work</h2>
        <p className="mt-1 text-xs text-fg-muted">
          Submit a new task or quote request for your server.
        </p>
      </div>
      <div className="px-4 sm:px-5 py-6">
      <p className="mb-4 text-xs text-fg-muted">
        <Link href={`${base}/backlog`} className="underline hover:text-fg">
          Back to backlog
        </Link>
      </p>
      <NewTicketRequestForm
        workspaceId={access.workspace.id}
        workspaceSlug={access.workspace.slug}
        canEdit={canEdit}
      />
      </div>
    </PageShell>
  )
}
